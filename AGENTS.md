# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Snapshot

- Project: Bulgarian school comparison site (НВО и ДЗИ)
- Hosting: GitHub Pages (`https://ivandavidov.github.io/nvo`)
- Type: static frontend + generated JS data files
- Data source: `data.egov.bg` (processed through the Java tool)

Main public pages:
- `docs/4/` — НВО след 4 клас
- `docs/7/` — НВО след 7 клас
- `docs/10/` — НВО след 10 клас
- `docs/12/` — ДЗИ след 12 клас
- `docs/stats/` — Обобщена статистика
- `docs/games/` — Мини игри

`docs/index.html` is only a redirect to `./7/`.

## Canonical Commands

### Full pipeline
```bash
./all.sh
```
Builds Java tool, normalizes CSV files, and regenerates all `schools-{4,7,10,12}.js` files.

### Java tool
```bash
cd java
./mvnw clean package
java -jar target/nvo-v2.jar normalize
java -jar target/nvo-v2.jar 4
java -jar target/nvo-v2.jar 7
java -jar target/nvo-v2.jar 10
java -jar target/nvo-v2.jar 12
```

## Current Architecture

### Data flow
```text
data/mon/*.csv -> data/normalized/*.csv -> java (Decomplexor) -> docs/js/schools-{grade}.js
```

### Frontend structure
```text
docs/
  4/, 7/, 10/, 12/           grade pages
  stats/                     statistics page (separate logic)
  games/                     games hub + standalone games
  js/
    config-global.js         shared defaults + constants
    config-{4,7,10,12}.js    per-grade overrides via applyGradeConfig(...)
    schools-{4,7,10,12}.js   generated data
    logic-core.js            shared state (var), URL helpers, city/school lookups, medians
    logic-chart.js           button state, Highcharts rendering, redraw, URL/cookie sync
    logic-pdf.js             PDF school report, ranking table PDF export, font loading
    logic-ranking.js         ranking tables, sorting, filtering, median tables, CSV/PDF links
    logic-city.js            city sections, school buttons, lazy loading (IntersectionObserver)
    logic-init.js            navigation, year nav, DOMContentLoaded bootstrap
    jokes.js, highcharts.js, exporting.js, jspdf.umd.min.js, ...
  css/
    normalize.css
    custom.css
```

The six `logic-*.js` files are loaded via `<script defer>` in the order listed above.
All shared mutable state lives in `logic-core.js` using `var` (not `let`) so that every
subsequent file can access it through the global scope.

`docs/old/` is legacy archive and should stay untouched unless explicitly requested.

## Configuration Model

- `config-global.js` defines `GRADE_CONFIG_DEFAULTS` and shared constants.
- Each per-grade config (`config-*.js`) calls `applyGradeConfig({...})` with overrides.
- The `logic-*.js` files read these globals (`firstYear`, `numYears`, `cookieName`, chart titles, ranking params, etc.).

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
  w: 'website URL'
}

si = {
  'City': { n: [start, end], p: [start, end] }
}
```
`n` = public schools range, `p` = private schools range.

## Important Rules

1. Do not manually edit `docs/js/schools-{4,7,10,12}.js` (generated files).
2. Keep relative paths correct for nested pages (`../` vs `../../`).
3. For grade page navigation, prefer existing `data-*` hooks; `logic-init.js` resolves links dynamically.
4. `stats/index.html` intentionally allows `unsafe-eval` in CSP because `stats/logic.js` loads config/data through `new Function(...)` in isolated scope.
5. Highcharts and jsPDF are vendored; avoid unnecessary upgrades unless requested.

## Testing / Verification

There is currently no maintained automated test suite in this repo (`docs/tests` was removed).
Use manual verification in browser:
- charts render and respond to filters
- grade navigation + stats links work
- CSV export links work
- games pages load and controls work on desktop + touch devices

## Editing Conventions

- Use the existing style in each file (do not reformat unrelated code).
- Keep changes minimal and localized.
- Preserve Bulgarian UI text and terminology already used in the page context.
