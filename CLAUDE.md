# CLAUDE.md

This file guides Claude Code when editing this repository.

## Quick Context

- Static site for school comparisons (НВО и ДЗИ)
- Hosted at `https://ivandavidov.github.io/nvo`
- Root page `docs/index.html` redirects to `docs/7/`
- Active sections: `4/`, `7/`, `10/`, `12/`, `stats/`, `games/`

## Source of Truth

- Use `AGENTS.md` as the full reference.
- This file is intentionally shorter and operational.

## Core Commands

```bash
./all.sh
```

Or manual Java pipeline:
```bash
cd java
./mvnw clean package
java -jar target/nvo-v2.jar normalize
java -jar target/nvo-v2.jar 4
java -jar target/nvo-v2.jar 7
java -jar target/nvo-v2.jar 10
java -jar target/nvo-v2.jar 12
```

## Files You Will Touch Most

- Grade page logic (split into 6 files, loaded in this order via `<script defer>`):
  - `docs/js/logic-core.js` — shared `var` state, URL helpers, city/school lookups, median calculations
  - `docs/js/logic-chart.js` — button state, Highcharts rendering, redraw, URL/cookie sync
  - `docs/js/logic-pdf.js` — PDF school report generation, ranking table PDF export, font loading
  - `docs/js/logic-ranking.js` — ranking tables, sorting, filtering, median tables, CSV/PDF links
  - `docs/js/logic-city.js` — city sections, school buttons, lazy loading (IntersectionObserver)
  - `docs/js/logic-init.js` — navigation, year nav, bootstrap (`DOMContentLoaded` + `onLoad`)
- `docs/stats/logic.js` — statistics page logic (separate, not part of the split)
- `docs/js/config-global.js` + `docs/js/config-{4,7,10,12}.js` — configuration
- `docs/css/custom.css` — main styling
- `docs/games/*` + `docs/games/games.css` — games pages and theme

## Hard Rules

1. Do not hand-edit generated files:
   - `docs/js/schools-4.js`
   - `docs/js/schools-7.js`
   - `docs/js/schools-10.js`
   - `docs/js/schools-12.js`
2. Keep relative paths correct from nested folders (`../` vs `../../`).
3. Do not modify `docs/old/` unless explicitly asked.
4. `stats/index.html` intentionally includes CSP `unsafe-eval` because `stats/logic.js` uses `new Function(...)` to load configs/data in isolated scope.

## Verification (Manual)

No maintained automated test suite is present right now.
After changes, manually verify in browser:
- grade pages render charts
- navigation links resolve correctly
- stats grade switch works
- CSV export still works
- games load and are usable on touch devices
