# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Snapshot

- Project: Bulgarian school comparison site (НВО и ДЗИ)
- Hosting: GitHub Pages (`https://ivandavidov.github.io/nvo`)
- Type: static frontend + generated JS data files
- Data source: `data.egov.bg` for the main site, plus per-region RUO raw files (PDF and/or XLSX) under `data/ruo-{region}/` for the `balove` pages

Main public pages:
- `docs/4/` — НВО след 4 клас
- `docs/7/` — НВО след 7 клас
- `docs/7/balove/` — Min/max scores by class/profile for 7th-grade admissions: a hub (`index.html`) linking ~70 per-city pages (`docs/7/balove/{city}/`)
- `docs/10/` — НВО след 10 клас
- `docs/12/` — ДЗИ след 12 клас
- `docs/stats/` — Обобщена статистика
- `docs/games/` — Мини игри
- `docs/blog/` — Static blog: home (`/blog/`) + per-post pages `docs/blog/{slug}/` (see Blog section)
- `docs/api/` — Static JSON API + interactive documentation
- `docs/school/{code}/` — Per-school page (grade-agnostic profile; generated)

`docs/index.html` is only a redirect to `./7/` (preserves URL params and hash via JS).
`docs/api/index.html` is a redirect to `./v1/`.
Each grade page also has `docs/{4,7,10,12}/embed.html` — embeddable chart view for iframes (see Embed section below).

## Canonical Commands

### Full pipeline
```bash
./all.sh
```
Builds Java tool, normalizes CSV/XLSX files, regenerates all `schools-{4,7,10,12}.js` files, generates the API (`docs/api/v1/`), city/year landing pages (`docs/{grade}/{city|year}/`), per-school pages (`docs/school/{code}/`), `docs/7/balove/` pages, and `docs/sitemap.xml`.
The pipeline intentionally generates `balove` pages before `schools-{grade}.js`, because the school bundles expose RUO availability through `si[city].r` based on the published `docs/{grade}/balove/{city}/` directories.

### Java tool — NvoDziDecomplexor (main jar)
```bash
cd java
./mvnw clean package
cd target
java -jar nvo-v2.jar normalize
java -jar nvo-v2.jar 4
java -jar nvo-v2.jar 7
java -jar nvo-v2.jar 10
java -jar nvo-v2.jar 12
```

### Java tool — JsonGenerator (separate entry point, uses `-cp` not `-jar`)
```bash
java -cp nvo-v2.jar nvo.api.JsonGenerator index
java -cp nvo-v2.jar nvo.api.JsonGenerator schools
java -cp nvo-v2.jar nvo.api.JsonGenerator school-pages
java -cp nvo-v2.jar nvo.api.JsonGenerator cities
java -cp nvo-v2.jar nvo.api.JsonGenerator 4
java -cp nvo-v2.jar nvo.api.JsonGenerator 7
java -cp nvo-v2.jar nvo.api.JsonGenerator 10
java -cp nvo-v2.jar nvo.api.JsonGenerator 12
```
- `index` generates `docs/api/v1/index.json` (API metadata) and `docs/api/v1/index.html` (interactive Swagger-like docs)
- `schools` generates `docs/api/v1/schools.json` (all schools with data — identity + city + grades list), `docs/api/v1/schools/{code}.json` (per-school cross-grade document: identity, city, per-grade scores/students + national/city/median ranks), and `docs/api/v1/schools-index.json` (compact array for the search box). The school set is data-driven (codes that appear in the normalized data across grades), not the full `School.schoolCodes` map.
- `school-pages` generates the per-school pages `docs/school/{code}/index.html` from the `schools/{code}.json` documents — must run after `schools`
- `cities` generates `docs/api/v1/cities.json` (all cities) and `docs/api/v1/cities/{slug}.json` (per-city lookup by slug)
- `4`/`7`/`10`/`12` generates per-grade `data.json`, per-city `data.json`, per-school `.json` files, rankings under `docs/api/v1/rankings/`, city landing pages `docs/{grade}/{city-slug}/index.html`, and year landing pages `docs/{grade}/{year}/index.html`
- All per-grade generated files share a unified JSON envelope: `{ grade, yearsRange, cities: { ... } }`
- Rankings: `rankings/{grade}/{year}.json` (per-year) and `rankings/median/{grade}/{year}.json` (3-year median window, from 2020 onwards, includes `adjustedRank` that excludes schools without endYear data)

### Java tool — SitemapGenerator
```bash
java -cp nvo-v2.jar nvo.SitemapGenerator
```
- scans all generated landing pages, static pages, per-school pages under `docs/school/`, pages under `docs/*/balove/`, and blog posts under `docs/blog/{slug}/`
- includes the blog home (`/blog/`) among the static pages
- writes `docs/sitemap.xml`

### RUO / balove pipeline
The `balove` (min/max admission scores) pages now cover **~87 cities across 19 RUO regions**
(Sofia, Plovdiv, Varna, Burgas, Ruse, Stara Zagora, Pleven, Sliven, Dobrich, Shumen, Pernik,
Haskovo, Blagoevgrad, Yambol, Veliko Tarnovo, Pazardzhik, Vratsa, Gabrovo, plus each region's
smaller towns).

```bash
java -cp nvo-v2.jar nvo.RuoNormalizer all          # Sofia only (XLSX -> normalized CSV)
java -cp nvo-v2.jar nvo.RuoDecomplexor <city>       # normalized CSV -> docs/js/ruo-<city>.js
java -cp nvo-v2.jar nvo.RuoPage <city>              # -> docs/7/balove/<city>/index.html
java -cp nvo-v2.jar nvo.RuoIndexPage                # -> docs/7/balove/index.html (hub of all cities)
```
- `RuoNormalizer` handles **only Sofia**: reads `data/ruo-sofia/*.xlsx` -> `data/normalized/ruo-sofia-{year}-normalized.csv`.
- **All other regions** were normalized by one-off Python scripts (kept in gitignored `tmp-ruo-{region}/` working dirs, not part of the build) that parse the mixed raw PDF/XLSX in `data/ruo-{region}/` directly into `data/normalized/ruo-{city}-{year}-normalized.csv`. Re-run a region's script only to regenerate its normalized CSVs. Parsing conventions used by those scripts:
  - **City = the settlement** (`Населено място` = `ГР.<city>`) matching a `Cities.java` city — **NOT the municipality** (a municipality also contains villages and other towns whose schools must not be filed under the city). Mirrors `NvoDziNormalizer.parseCity`.
  - **School codes**: taken from the raw file when embedded; otherwise recovered from MON **DZI-12** data (`data/mon/dzi-{year}.csv`) by settlement + school-name match. Clean school names come from MON too.
  - **Profile codes**: embedded when present; else reused from a year that had them (same school + profile name) or a stable synthetic code (the JS merges profiles by name across non-overlapping years anyway).
  - **Gender** breakdown is often absent → male/female columns written as `"0"`. Output format matches `ruo-sofia` exactly (12-col, `csv.QUOTE_ALL`, trimmed decimals).
  - **RUO Gabrovo** is a special case: the min/max score column positions vary unpredictably per file (not just by klasirane number — e.g. the "3rd stage" file has different column offsets in 2023 vs. 2024), so `tmp-ruo-gabrovo/` uses **one hardcoded script per raw file** (`file_{year}_{klasirane}.py`, verified row-by-row) instead of a single dynamic-column-detection parser, combined by `build.py`.
- `RuoDecomplexor` (generic, takes a city slug) converts the normalized RUO CSVs into `docs/js/ruo-{city}.js` (merges profiles with identical names across years when data does not overlap). `findYears` strips the known `ruo-{city}-` prefix to read the year, so hyphenated slugs (`biala-ruse`, `stara-zagora`) work.
- `RuoPage` (generic) generates `docs/7/balove/{city}/index.html`.
- `RuoIndexPage` scans the published `docs/7/balove/*/` dirs and generates the hub `docs/7/balove/index.html`, grouping cities by `Cities.java` tier ("Областни градове" + "Други градове"). It makes every balove city discoverable even when a city has no `si[city]` entry (e.g. towns with no NVO-7 exam schools).
- `all.sh` runs RuoNormalizer (Sofia), then loops every balove city through `RuoDecomplexor` + `RuoPage`, then `RuoIndexPage` last.

## Current Architecture

### Data directory
```text
data/
  mon/                raw CSV files from data.egov.bg
                      naming: {nvo-4|nvo-7|nvo-10|dzi}-{2018-2025}.csv
                      special: nvo-7-2022-sofia.csv (Sofia-specific 2022 data)
                      note: nvo-10 data starts from 2021
  ruo-{region}/       raw RUO files for the 7th-grade min/max scores pages, one dir per
                      RUO region (ruo-sofia, ruo-plovdiv, ruo-varna, ruo-burgas, ruo-ruse,
                      ruo-stara-zagora, ruo-pleven, ruo-sliven, ruo-dobrich, ruo-shumen,
                      ruo-pernik, ruo-haskovo, ruo-blagoevgrad, ruo-iambol, ruo-veliko-turnovo,
                      ruo-pazardjik, ruo-vraca, ruo-gabrovo)
                      naming: min_max_{1-4}_klasirane_{2023-2025}.{pdf|xlsx}
                      format varies per region/year (PDF and/or XLSX; some files missing)
  normalized/         processed CSV files (generated by NvoDziNormalizer / RuoNormalizer / one-off scripts)
                      naming: {grade}-{year}-normalized.csv
                      RUO naming: ruo-{city}-{year}-normalized.csv (per CITY, not per region)
  *.xlsx              historical Excel archives (not used in pipeline)
```

### Data flow
```text
data/mon/*.csv -> data/normalized/*.csv -> java (NvoDziDecomplexor) -> docs/js/schools-{grade}.js
                                        -> java (nvo.api.*) -> docs/api/v1/ (JSON API + HTML docs)

data/ruo-{region}/*.{pdf,xlsx} -> data/normalized/ruo-{city}-*.csv  (Sofia via RuoNormalizer;
                                                                    other regions via one-off scripts)
data/normalized/ruo-{city}-*.csv -> java (RuoDecomplexor) -> docs/js/ruo-{city}.js
                                  -> java (RuoPage)        -> docs/7/balove/{city}/index.html
                                  -> java (RuoIndexPage)   -> docs/7/balove/index.html (hub)
```
`NvoDziDecomplexor` then detects published `docs/{grade}/balove/{city}/` directories and emits `si[city].r` into `schools-{grade}.js`, which lets the main frontend surface a `Балове` link for supported cities.

`SchoolsGenerator` aggregates the normalized CSVs across all four grades into per-school documents (`docs/api/v1/schools/{code}.json`) plus a compact `schools-index.json`; `SchoolPageGenerator` then renders the `docs/school/{code}/` pages from those documents (and inlines the same JSON so `logic-school.js` can hydrate the charts client-side).

### Frontend structure
```text
docs/
  4/, 7/, 10/, 12/           grade pages
  school/{code}/             per-school page (generated, grade-agnostic profile)
  7/balove/{city}/           min/max scores by class/profile for 7th-grade admissions
  stats/                     statistics page (separate logic)
  games/                     games hub + standalone games
  api/                       redirect to api/v1/
  api/v1/                    static JSON API + interactive Swagger-like docs
  api/v1/index.json          API metadata (grades list + schoolsUrl)
  api/v1/schools.json        all schools with data (code → name, website, isPrivate, city, grades)
  api/v1/schools/{code}.json per-school cross-grade document (identity, city, per-grade scores/students + ranks)
  api/v1/schools-index.json  compact array for the client-side school search box
  api/v1/cities.json         all cities lookup (slug → name, orderPosition)
  api/v1/cities/{slug}.json  per-city lookup by slug
  api/v1/rankings/{grade}/{year}.json          per-year ranking
  api/v1/rankings/median/{grade}/{year}.json  3-year median ranking (from 2020 onwards)
  api/v1/{grade}/data.json   full data per grade
  api/v1/{grade}/{city}/     per-city data + per-school JSON files
  embed/index.html             embed documentation + live demos
  fonts/NotoSans-Regular.ttf   font for PDF rendering (loaded by logic-pdf.js)
  images/
    favicon-{4,7,10,12}.png    per-grade favicons
    social-preview.png         OG/Twitter card image
  js/
    config-global.js           shared defaults + constants
    config-{4,7,10,12}.js      per-grade overrides via applyGradeConfig(...)
    schools-{4,7,10,12}.js     generated data (DO NOT EDIT)
    ruo-{city}.js              generated RUO min/max scores data, one file per balove city (DO NOT EDIT)
    logic-core.js              shared state (var), URL helpers, city/school lookups, medians
    logic-chart.js             button state, Highcharts rendering, redraw, URL/cookie sync
    logic-pdf.js               PDF school report, ranking table PDF export, font loading
    logic-ranking.js           ranking tables, sorting, filtering, median tables, CSV/PDF links
    logic-city.js              city sections, school buttons, lazy loading (IntersectionObserver)
    logic-init.js              navigation, year nav, DOMContentLoaded bootstrap
    logic-school.js            per-school page chart hydration (standalone, not part of the 6-file split)
    school-search.js           grade-page school search box (reads schools-index.json)
    theme.js                   dark/light mode toggle, localStorage persistence
    jokes.js                   Bulgarian jokes collection
    highcharts.js              vendored Highcharts library
    exporting.js               vendored Highcharts export module
    jspdf.umd.min.js           vendored jsPDF library
    jspdf.plugin.autotable.min.js  vendored jsPDF AutoTable plugin
  css/
    normalize.css              CSS reset (vendored)
    custom.css                 main project styling
    blog.css                   blog home + article styling (built on custom.css)
```

The six `logic-*.js` files are loaded via `<script defer>` in the order listed above.
All shared mutable state lives in `logic-core.js` using `var` (not `let`) so that every
subsequent file can access it through the global scope.

`docs/old/` is legacy archive (original Plotly-based version) and should stay untouched unless explicitly requested.

### Games structure
`docs/games/` contains a hub page and 36 standalone games (2048, asteroids, breakout, bubbles, checkers, chess, connectfour, doodlejump, flappy, frogger, hangman, hanoi, lightsout, lines, mastermind, maze, memory, minesweeper, nonogram, pacman, pong, reaction, reversi, simon, sliding, snake, sokoban, solitaire, spaceinvaders, sudoku, tetris, tictactoe, typing, whackamole, wordle). Each game is a self-contained `index.html` with inline CSS/JS. Shared files:
- `docs/games/games.css` — styling for all games
- `docs/games/games-header.js` — navigation header component
- `docs/games/games-touch.js` — touch device support

### Embed pages
Each grade page has a sibling `embed.html` (`docs/{4,7,10,12}/embed.html`) for embedding charts in iframes. URL parameters:
- `theme=dark|light` — theme selection
- `chart=b|m` — show only BEL or MAT chart
- `i{grade}=idx1,idx2,idx3` — school indices (e.g., `i7=178,179,181`)

The embed pages communicate height to the parent via `postMessage`. Full documentation and live demos are at `docs/embed/index.html`.

### Blog
`docs/blog/` is a static, Bulgarian-only blog (no build step — pages are hand-authored HTML).
- `docs/blog/index.html` — blog home (`/blog/`): a hand-maintained list of `.post-card`s.
- `docs/blog/{slug}/index.html` — one directory per post (`/blog/{slug}/`, clean URLs). Posts are depth 2, so assets resolve via `../../css/…`, `../../js/…` and school links via `../../school/{code}/`. Use ASCII slugs (e.g. `dzi-analiz-2026`).
- `docs/css/blog.css` — shared article + post-card styles, built on `custom.css` + `theme.js` (so dark/light themes work automatically). Both the home and every post load `custom.css` + `blog.css`.

First post: `dzi-analiz-2026` (ДЗИ 2018–2026 analysis). Its charts use the vendored `highcharts.js` with the aggregates **inlined as a precomputed `var D = {…}`** (not read from `schools-{grade}.js`), so the post is a **snapshot** — it does NOT auto-update when the pipeline reruns. To refresh it, recompute the aggregates (a small Node script over `docs/js/schools-12.js`) and replace `D`. Call `Highcharts.setOptions({accessibility:{enabled:false}})` inside the `DOMContentLoaded` handler (Highcharts is loaded with `defer`, so a top-level call runs too early) and set `window.redraw` so the theme toggle re-renders the charts.

**To add a post:** create `docs/blog/{slug}/index.html` (copy the header/footer from an existing post), add a `.post-card` to `docs/blog/index.html` and a `blogPost` entry to that page's JSON-LD, then run `./all.sh` (SitemapGenerator auto-discovers `docs/blog/{slug}/`).

The **"Блог" header tab is site-wide but hardcoded per page/generator** (the `grade-tabs` header is not a shared include). It lives in: the static grade pages, `stats/`, and the `index.html` redirect; the generators `SchoolPageGenerator`, `LandingPageGenerator`, `RuoPage` (→ per-school, city/year landing, and balove pages, regenerated by `./all.sh`); `docs/games/games-header.js` (all games + hub); `docs/console/index.html`; and the blog pages themselves (tab marked `active`). The relative path differs by depth (`../blog/`, `../../blog/`, `../../../blog/`). The same pages share a unified footer `footer-links` nav (Начало / Блог / Статистика). Intentionally WITHOUT a blog link (technical pages with custom/no standard header): the per-grade `embed.html` iframe views, `docs/embed/`, the `docs/api/` redirect, and the `docs/api/v1/` API docs.

### Java source files
```text
java/src/main/java/nvo/
  ProjectConfig.java      shared project paths, site URL, and grade metadata
  NvoDziDecomplexor.java  main entry point (-jar), normalizes CSV + generates schools-{grade}.js
  NvoDziNormalizer.java   CSV reformatting (handles varying delimiters, column orders per year/grade)
  RuoNormalizer.java      XLSX → normalized CSV for RUO Sofia min/max scores (Sofia only)
  RuoDecomplexor.java     normalized RUO CSV → docs/js/ruo-{city}.js (generic, any city slug)
  RuoPage.java            generated per-city balove page under docs/7/balove/{city}/
  RuoIndexPage.java       generated balove hub docs/7/balove/index.html (lists all cities)
  SitemapGenerator.java   generates docs/sitemap.xml by scanning published docs pages
  School.java             domain model with school name constants, code lookups, name fixes
  Cities.java             city definitions with fullName, shortName, hrefName, orderPosition tiers (1-3)
  Record.java             simple DTO: city, code, school, belScore, matScore, belStudents, matStudents

java/src/main/java/nvo/api/
  JsonGenerator.java        entry point (-cp), dispatches to sub-generators below
  IndexGenerator.java       generates index.json + index.html (API docs page)
  SchoolsGenerator.java     schools.json + schools-index.json + cross-grade schools/{code}.json
  SchoolPageGenerator.java  per-school HTML pages docs/school/{code}/ from schools/{code}.json
  CitiesGenerator.java      generates cities.json + cities/{slug}.json
  GradeDataGenerator.java   CSV parsing → {grade}/data.json, per-city/per-school JSON files (parseGrade() reused by SchoolsGenerator)
  RankingsGenerator.java    rankings/{grade}/{year}.json + median rankings (buildAllSchools/nationalYearRank/nationalMedianRank reused by SchoolsGenerator)
  LandingPageGenerator.java city + year landing pages (HTML; school names link to /school/{code}/)
  GeneratorUtils.java       shared utilities (collapseArrays, cleanDirectory, etc.)
  SchoolData.java           data class for per-school score/student arrays
  RankedSchool.java         record for ranking entries
```

### Build system (Maven)
- Java 21 (source and target)
- Dependencies: OpenCSV 5.9, Gson 2.11.0, Lombok 1.18.34, Apache POI OOXML 5.3.0, Log4j Core 2.23.1
- Maven Assembly Plugin produces fat jar: `nvo-v2-jar-with-dependencies.jar` → renamed to `nvo-v2.jar`
- Main class: `nvo.NvoDziDecomplexor`

## Configuration Model

- `config-global.js` defines `GRADE_CONFIG_DEFAULTS` and shared constants.
- Each per-grade config (`config-*.js`) calls `applyGradeConfig({...})` with overrides.
- The `logic-*.js` files read these globals (`firstYear`, `numYears`, `cookieName`, chart titles, ranking params, etc.).
- `numYearsByGrade` in `config-global.js` is the single source of truth for the per-grade chart window (8 for 4/7/12, 5 for 10). The main pages apply it via `config-{grade}.js`; the per-school page loads `config-global.js` and `logic-school.js` reads `numYearsByGrade` directly (falling back to 8).

## Generated Data Contract

In `schools-{grade}.js`:
```javascript
s[i] = {
  b:  [/* BEL scores by year */],
  m:  [/* MAT/DZI-2 scores by year */],
  bu: [/* BEL participants */],
  mu: [/* MAT/DZI-2 participants */],
  l: 'short label',
  n: 'full name',
  w: 'website URL',
  c: 'school code'   /* canonical code; used to link to /school/{code}/ */
}

si = {
  'City': { n: [start, end], p: [start, end], l: 'short label', h: 'slug', o: 1, i: 0, r: true/false }
}
```
`n` = public schools range, `p` = private schools range, `l` = short label, `h` = slug, `o` = order tier, `i` = city index, `r` = has RUO balove page for this grade.
`c` (on `s[i]`) = canonical school code, used to link each row to its `/school/{code}/` page.

In `schools/{code}.json` (per-school cross-grade document):
```javascript
{
  code, fullName, shortName, isPrivate, website,
  city: { slug, name },
  yearsRange: [2018, /* … */ 2025],
  grades: {
    "7": {
      belScore: [/* … */], matScore: [/* … */], belStudents: [/* … */], matStudents: [/* … */],
      latestYear, nationalRank, nationalTotal, cityRank, cityTotal,
      medianRank, medianAdjustedRank, medianTotal, medianEndYear
    }
    /* one entry per grade the school participates in */
  }
}
```

In `schools-index.json` (search box index):
```javascript
{ schools: [ { code, shortName, fullName, isPrivate, city, cityOrder, grades: [4, 7] } ] }
```
`cityOrder` mirrors the position in `Cities.ORDERED`, so the search box sorts results in the site's city order.

In `ruo-{city}.js`:
```javascript
let ruoYears = [2023, 2024, 2025];

let ruoSchools = {
  "schoolCode": {
    n: "short school label",
    f: "full school name",
    c: false,
    p: {
      "profileCode": {
        n: "profile name",
        d: [
          [null, [/* 6 scores */], null, null],
          [/* next year */]
        ]
      }
    }
  }
};
```
- `ruoYears` = years with available RUO data
- `c` = private school flag
- `p` = profiles/classes keyed by profile code
- `d` = per-year array aligned with `ruoYears`; each year contains 4 ranking slots (`0` = first ranking)
- each score entry is `[min_total, min_male, min_female, max_total, max_male, max_female]`
- `null` means the class/profile is already filled in a previous ranking

## Important Rules

1. Do not manually edit generated files: `docs/js/schools-{4,7,10,12}.js`, `docs/js/ruo-*.js`, `docs/api/v1/` (all contents), generated `docs/7/balove/**/index.html` pages, and generated `docs/school/**/index.html` pages.
2. Keep relative paths correct for nested pages (`../` vs `../../`).
3. For grade page navigation, prefer existing `data-*` hooks; `logic-init.js` resolves links dynamically.
4. `stats/index.html` intentionally allows `unsafe-eval` in CSP because `stats/logic.js` loads config/data through `new Function(...)` in isolated scope.
5. Highcharts and jsPDF are vendored; avoid unnecessary upgrades unless requested.
6. `balove` pages are generated standalone pages with inline JS/CSS; they do not use the shared `logic-*.js` split architecture.

### Stats page
`docs/stats/logic.js` is a large standalone file (~73KB) that dynamically loads per-grade config and data using `new Function(...)` in isolated scope. This is why `stats/index.html` has `unsafe-eval` in its CSP.

## Local Development

A Python HTTP server can be used for local preview:
```bash
python3 -m http.server 8090 -d docs
```
Then open `http://localhost:8090/`.

## Testing / Verification

There is currently no maintained automated test suite in this repo (`docs/tests` was removed).
Use manual verification in browser:
- charts render and respond to filters
- grade navigation + stats links work
- CSV export links work
- games pages load and controls work on desktop + touch devices
- API docs page loads with working interactive dropdowns
- embed pages render charts correctly with theme/chart params
- `docs/7/balove/` hub lists all cities (grouped by tier); a per-city page (e.g. `docs/7/balove/sofia/`) loads its table, filters, charts, search/sort, and relative asset paths correctly
- per-school pages (`docs/school/{code}/`) render the charts, tables, ranks, and JSON-LD; charts use the per-grade `numYears` window and trim empty leading/trailing years
- the grade-page school search box finds schools (ordered by city) and links to `/school/{code}/`
- school name links in the ranking tables open the correct `/school/{code}/`

## Key Files (Quick Reference)

Files you will touch most often:

- Grade page logic (6 files, loaded in this order via `<script defer>`):
  - `docs/js/logic-core.js` — shared `var` state, URL helpers, city/school lookups, median calculations
  - `docs/js/logic-chart.js` — button state, Highcharts rendering, redraw, URL/cookie sync
  - `docs/js/logic-pdf.js` — PDF school report generation, ranking table PDF export, font loading
  - `docs/js/logic-ranking.js` — ranking tables, sorting, filtering, median tables, CSV/PDF links, and `Балове` links when `si[city].r` is true
  - `docs/js/logic-city.js` — city sections, school buttons, lazy loading (IntersectionObserver)
  - `docs/js/logic-init.js` — navigation, year nav, bootstrap (`DOMContentLoaded` + `onLoad`)
- `docs/stats/logic.js` — statistics page logic (separate, not part of the split)
- `docs/js/config-global.js` + `docs/js/config-{4,7,10,12}.js` — configuration
- `docs/css/custom.css` — main styling
- `docs/js/theme.js` — dark/light mode toggle
- `docs/js/logic-school.js` — per-school page chart hydration (standalone)
- `docs/js/school-search.js` — grade-page school search box (reads `schools-index.json`)
- `docs/js/ruo-{city}.js` — generated RUO min/max scores data (one file per balove city)
- `docs/games/*` + `docs/games/games.css` — games pages and theme
- `docs/games/games-header.js` — games navigation header
- `docs/games/games-touch.js` — touch device support for games
- `docs/blog/index.html` + `docs/blog/{slug}/index.html` — static blog home + posts (see Blog section)
- `docs/css/blog.css` — blog home + article styling (built on `custom.css`)
- `docs/{4,7,10,12}/embed.html` — embeddable chart pages for iframes
- `docs/embed/index.html` — embed documentation and live demos
- `docs/7/balove/index.html` — generated balove hub (lists all cities); `docs/7/balove/{city}/index.html` — generated per-city min/max scores pages
- Java source files under `java/src/main/java/nvo/`:
  - `ProjectConfig.java` — shared constants for project paths, site URL, and grade metadata
  - `NvoDziDecomplexor.java` — main jar entry point, CSV processing + schools-{grade}.js generation
  - `NvoDziNormalizer.java` — CSV reformatting for varying source formats
  - `RuoNormalizer.java` — XLSX normalization for the RUO Sofia flow (Sofia only)
  - `RuoDecomplexor.java` — normalized RUO CSV → generated `ruo-{city}.js`
  - `RuoPage.java` — generated per-city balove page `docs/7/balove/{city}/`
  - `RuoIndexPage.java` — generated balove hub `docs/7/balove/index.html`
  - `SitemapGenerator.java` — standalone sitemap generator for all published docs pages
  - `School.java` — domain model, school name constants, code lookups
  - `Cities.java` — city definitions, ordering tiers
  - `Record.java` — simple DTO for CSV records
- Java API generators under `java/src/main/java/nvo/api/`:
  - `JsonGenerator.java` — entry point, dispatches to sub-generators
  - `IndexGenerator.java` — index.json + API docs HTML
  - `SchoolsGenerator.java` — schools.json + per-school files
  - `CitiesGenerator.java` — cities.json + per-city files
  - `GradeDataGenerator.java` — CSV → per-grade/city/school JSON
  - `RankingsGenerator.java` — per-year + median rankings
  - `LandingPageGenerator.java` — city + year landing pages (school names link to `/school/{code}/`)
  - `SchoolPageGenerator.java` — per-school pages under `docs/school/{code}/`

## Static Assets

- `docs/fonts/NotoSans-Regular.ttf` — used by `logic-pdf.js` for PDF generation
- `docs/images/favicon-{4,7,10,12}.png` — per-grade favicons
- `docs/images/social-preview.png` — OG/Twitter card image
- `docs/googlea6ca7b7cd3a055bf.html` — Google Search Console verification (do not delete)

## Kaggle Dataset

The `kaggle/` directory contains everything needed to publish and maintain the Kaggle dataset.

### Structure
```text
kaggle/
  dataset-metadata.json   Kaggle dataset metadata (title, subtitle, tags, resources)
  kernel-metadata.json    Kaggle notebook metadata (for `kaggle kernels push`)
  README.md               dataset description (shown on Kaggle dataset page)
  notebook.ipynb           exploratory analysis notebook (published on Kaggle)
  prepare.py               converts JSON API → 4 CSV files in data/
  generate_cover.py        generates cover.png for the Kaggle dataset page
  cover.png                generated cover image (1128×568)
  data/                    generated CSV files (gitignored)
    scores.csv             29,301 rows — scores per school/grade/year
    rankings.csv           52,434 rows — annual + 3-year median rankings
    schools.csv            1,417 rows — school directory (data-driven: schools that appear in the data)
    cities.csv             145 rows — city directory
```

### Workflow
The CSV files are generated from the JSON API (`docs/api/v1/`), so the full pipeline must run first:
```bash
# 1. Run the full data pipeline (builds Java tool, generates API)
./all.sh

# 2. Generate Kaggle CSV files from the API
cd kaggle
python3 prepare.py

# 3. (Optional) Regenerate cover image
python3 generate_cover.py
```

After generating the CSVs, upload to Kaggle via the Kaggle web interface or CLI.

The notebook (`notebook.ipynb`) is stored without outputs — Kaggle runs it server-side on publish.

To publish the notebook from the repo (instead of editing on kaggle.com), use the Kaggle CLI with `kernel-metadata.json` (requires an API token in `~/.kaggle/kaggle.json`, created from Kaggle → Settings → API):
```bash
cd kaggle
kaggle kernels push -p .
kaggle kernels status johnddavidson/initial-exploratory-analysis-2018-2026  # check the server-side run
```
`dataset_sources` in `kernel-metadata.json` is unpinned, so each push runs against the latest dataset version.

### Kaggle links
- Dataset: https://www.kaggle.com/datasets/johnddavidson/bulgarian-school-exam-results-20182025
- Notebook: https://www.kaggle.com/code/johnddavidson/initial-exploratory-analysis-2018-2026

## Editing Conventions

- Use the existing style in each file (do not reformat unrelated code).
- Keep changes minimal and localized.
- Preserve Bulgarian UI text and terminology already used in the page context.
