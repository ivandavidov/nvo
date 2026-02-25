# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bulgarian school comparison website (НВО и ДЗИ) hosted at https://ivandavidov.github.io/nvo. It visualizes school performance data from national exams (НВО after grades 4, 7, 10) and final exams (ДЗИ after grade 12). The site is a static GitHub Pages site; data is sourced from data.egov.bg.

## Commands

### Full Data Pipeline
```zsh
./all.sh
```
Builds the Java tool, normalizes CSV data, then generates all four JS data files.

### Java Data Tool
```zsh
cd java
./mvnw clean package                         # build
java -jar target/nvo-v2.jar normalize        # normalize raw CSVs
java -jar target/nvo-v2.jar 4                # generate schools-4.js
java -jar target/nvo-v2.jar 7                # generate schools-7.js
java -jar target/nvo-v2.jar 10               # generate schools-10.js
java -jar target/nvo-v2.jar 12               # generate schools-12.js
```

### Tests
Open `docs/tests/smoke.html` in a browser. There is no CLI test runner — tests are browser-based and render results to the page. The test suite is in `docs/tests/smoke.js` and runs against `docs/js/logic.js`.

## Architecture

### Data Flow
```
data/normalized/*.csv  →  java/ (Decomplexor.java)  →  docs/js/schools-{4,7,10,12}.js
```
Raw CSV files in `data/normalized/` (one per exam type per year, 2018–2025) are processed by the Java tool into JS data files consumed by the frontend.

### Java Tool (`java/src/main/java/nvo/`)
- **`Decomplexor.java`** — main entry point. Reads normalized CSVs, builds a city→school map, then writes `schools-{mode}.js` with global `s[]` (school data) and `si{}` (city index) arrays. Hard-codes the ordered list of cities for output ordering.
- **`CSVNormalizer.java`** — invoked via `normalize` mode; converts raw Excel exports to normalized pipe-delimited CSVs in `data/normalized/`.
- **`School.java`**, **`Record.java`** — data models. `School.fixedCodes` maps school code aliases; `School.schoolCodes` maps codes to metadata including website URLs.

### Frontend (`docs/`)
The site has four pages (one per exam type), each following the same structure:

**Script loading order (per HTML page):**
1. `js/highcharts.js`, `js/exporting.js`, `js/accessibility.js` — Highcharts library (licensed)
2. `js/config-{4,7,10,12}.js` — per-exam globals (`firstYear`, `numYears`, `cookieName`, chart titles, `baseSchoolIndex`, etc.)
3. `js/schools-{4,7,10,12}.js` — **generated**, do not edit by hand. Declares `s[]` (school array with `b`, `m`, `bu`, `mu`, `l`, `n`, `w` fields) and `si{}` (city index with `n`/`p` ranges for public/private schools)
4. `js/jokes.js` — random quotes shown on load
5. `js/logic.js` — all application logic

**`logic.js`** is the single application file. Key globals it consumes from config:
- `s` — school data array
- `si` — city index
- `firstYear`, `numYears` — year range
- `baseSchoolIndex`, `refSchoolIndex` — default selected schools
- `cookieName` — used for URL param and cookie persistence of selections
- `chartNoSchool`, `rankRangeTop`, `rankRangeBottom` — ranking thresholds

School data shape in `s[]`:
- `b[]` / `m[]` — BEL/MAT scores per year (null if no data)
- `bu[]` / `mu[]` — BEL/MAT student counts per year
- `l` — display label, `n` — full name, `w` — website URL

### CSS
Uses Skeleton CSS framework (`skeleton.css`) with `normalize.css` and custom styles in `custom.css`. Fonts loaded via `fonts.css`.
