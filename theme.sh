#!/bin/zsh
# Цветови теми на сайта.
#
#   ./theme.sh build              docs/css/themes/theme-*.css -> docs/css/skins.css (всички теми
#                                 под html[data-skin="..."]; пуска се и от all.sh)
#   ./theme.sh auto on|off        включва/изключва автоматичната смяна по календар (AUTO_SKIN в
#                                 docs/js/theme.js). "on" връща theme.css на default, за да не се
#                                 наслагват ръчна и автоматична тема.
#   ./theme.sh auto status        показва дали автоматичната смяна е включена
#   ./theme.sh today [ГГГГ-ММ-ДД] коя тема дава календарът за датата (по подразбиране: днес)
#   ./theme.sh <име>              копира docs/css/themes/theme-<име>.css -> docs/css/theme.css
#                                 (има смисъл при auto off; при auto on календарът я презаписва)
#   ./theme.sh list               всички теми + календарът
#   ./theme.sh current            коя тема е в theme.css
#
# Календарът живее САМО в docs/js/theme.js между /* CALENDAR-START */ и /* CALENDAR-END */
# (валиден JSON) — този скрипт го чете оттам. Изключване за всички посетители:
#   ./theme.sh auto off && git commit -am "Disable auto skins" && git push
# Изключване само в един браузър, без deploy: ?skin=default в адреса.

set -e
cd "$(dirname "$0")"

THEMES_DIR=docs/css/themes
ACTIVE=docs/css/theme.css
SKINS=docs/css/skins.css
THEME_JS=docs/js/theme.js

usage() { sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

apply() {
  local name=$1 src=$THEMES_DIR/theme-$1.css
  [[ -f $src ]] || { echo "Няма тема '$name' ($src)"; exit 1; }
  cp "$src" "$ACTIVE"
  echo "theme.css = $name"
}

current() {
  local sum=$(md5 -q "$ACTIVE")
  for f in $THEMES_DIR/theme-*.css; do
    if [[ $(md5 -q "$f") == $sum ]]; then
      local n=${f:t:r}; echo "${n#theme-}"; return
    fi
  done
  echo "(theme.css не съвпада с никоя тема в $THEMES_DIR)"
}

auto_status() {
  if grep -q '^var AUTO_SKIN = true;' "$THEME_JS"; then echo on
  elif grep -q '^var AUTO_SKIN = false;' "$THEME_JS"; then echo off
  else echo "(не намирам 'var AUTO_SKIN = ...;' в $THEME_JS)"; exit 1; fi
}

build() {
  python3 - "$THEMES_DIR" "$SKINS" <<'PY'
import sys, re, glob, os
themes_dir, out = sys.argv[1], sys.argv[2]
parts = ["/* ГЕНЕРИРАН ФАЙЛ — не редактирай. Източник: docs/css/themes/theme-*.css; ./theme.sh build */\n"]
for f in sorted(glob.glob(os.path.join(themes_dir, "theme-*.css"))):
    name = os.path.basename(f)[len("theme-"):-len(".css")]
    css = open(f, encoding="utf-8").read()
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)                 # без коментари
    css = "\n".join(l.rstrip() for l in css.splitlines() if l.strip())
    n_root = css.count(":root {"); n_dark = css.count('[data-theme="dark"] {')
    assert n_root == 1 and n_dark == 1, (f, n_root, n_dark)
    css = css.replace(":root {", f'html[data-skin="{name}"] {{')
    css = css.replace('[data-theme="dark"] {', f'html[data-skin="{name}"][data-theme="dark"] {{')
    parts.append(f"\n/* --- {name} --- */\n{css}\n")
open(out, "w", encoding="utf-8").write("".join(parts))
print(f"{out}: {len(parts)-1} теми, {os.path.getsize(out)//1024} KB")
PY
}

calendar_json() {
  sed -n '/CALENDAR-START/,/CALENDAR-END/p' "$THEME_JS" \
    | sed '1d;$d' | sed 's/^var SKIN_CALENDAR = //; s/;\s*$//'
}

PY_TODAY='
import sys, json, datetime
day = datetime.date.fromisoformat(sys.argv[1])
rules = json.loads(sys.argv[2])

def orthodox_easter(y):
    a, b, c = y % 4, y % 7, y % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7
    month, dd = divmod(d + e + 114, 31)
    return datetime.date(y, month, dd + 1) + datetime.timedelta(days=13)

def bound(spec, y):
    if spec.startswith("EASTER"):
        return orthodox_easter(y) + datetime.timedelta(days=int(spec[6:] or 0))
    m, d = spec.split("-")
    try:
        return datetime.date(y, int(m), int(d))
    except ValueError:  # 02-29 в невисокосна година -> последният ден на месеца
        return datetime.date(y, int(m) + 1, 1) - datetime.timedelta(days=1)

for name, lo, hi, _ in rules:
    if bound(lo, day.year) <= day <= bound(hi, day.year):
        print(name); break
else:
    print("default")
'

today() { python3 -c "$PY_TODAY" "$1" "$(calendar_json)"; }

case ${1:-} in
  "" | -h | --help) usage ;;
  build) build ;;
  auto)
    case ${2:-} in
      on)
        sed -i '' 's/^var AUTO_SKIN = false;/var AUTO_SKIN = true;/' "$THEME_JS"
        apply default
        echo "auto: $(auto_status)"
        ;;
      off)
        sed -i '' 's/^var AUTO_SKIN = true;/var AUTO_SKIN = false;/' "$THEME_JS"
        echo "auto: $(auto_status)  (theme.css = $(current))"
        ;;
      status | "") echo "auto: $(auto_status)  (theme.css = $(current))" ;;
      *) usage ;;
    esac
    ;;
  today)
    d=${2:-$(date +%Y-%m-%d)}
    echo "$d -> $(today "$d")"
    ;;
  list)
    echo "Теми в $THEMES_DIR:"
    for f in $THEMES_DIR/theme-*.css; do n=${f:t:r}; echo "  ${n#theme-}"; done
    echo; echo "Календар (първото съвпадение печели):"
    python3 -c '
import sys, json
for n, lo, hi, d in json.loads(sys.argv[1]):
    print(f"  {n:<14}{lo:<11}– {hi:<11}{d}")
print("  default        (всички останали дни)")' "$(calendar_json)"
    ;;
  current) current ;;
  *) apply "$1" ;;
esac
