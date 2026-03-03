# AGENTS.md

This file provides guidance to AI agents operating in this repository.

## Project Overview

Bulgarian school comparison website (НВО и ДЗИ) hosted at https://ivandavidov.github.io/nvo. Visualizes school performance data from national exams (НВО after grades 4, 7, 10) and final exams (ДЗИ after grade 12). Static GitHub Pages site; data sourced from data.egov.bg.

## Commands

### Full Data Pipeline
```bash
./all.sh
```
Builds Java tool, normalizes CSV data, then generates all four JS data files.

### Java Data Tool
```bash
cd java
./mvnw clean package                         # build
java -jar target/nvo-v2.jar normalize        # normalize raw CSVs
java -jar target/nvo-v2.jar 4                # generate schools-4.js
java -jar target/nvo-v2.jar 7                # generate schools-7.js
java -jar target/nvo-v2.jar 10               # generate schools-10.js
java -jar target/nvo-v2.jar 12               # generate schools-12.js
```

### Tests
Open `docs/tests/smoke.html` in a browser. Tests are browser-based and render results to the page. The test suite is in `docs/tests/smoke.js`.

**Running a single test**: Edit `smoke.js` and comment out unwanted tests (search for `runTest(` calls), or add `return;` at the start of the test function you want to skip. There is no CLI test runner.

## Code Style Guidelines

### JavaScript (docs/js/)

**General**
- Language: ES5 (no modules, global variables)
- All code in `docs/js/logic.js` and `docs/js/stats/logic.js`
- Follow existing patterns in the codebase

**Variables and Constants**
- Use `const` for configuration constants (e.g., `const CHART_HEIGHT_PERCENT = 0.85`)
- Use `let` for mutable variables
- Use `var` only if required for legacy compatibility (existing code only)
- Runtime state variables stay in the files where they are used

**Naming Conventions**
- Functions: `camelCase` (e.g., `generateYearNavigation`, `safeDivide`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `CHART_EXPORT_WIDTH`)
- Config variables (per-grade): `camelCase` (e.g., `firstYear`, `baseSchoolIndex`)
- HTML IDs: lowercase with hyphens (e.g., `chartb`, `btnClear`)
- CSS classes: lowercase with hyphens (e.g., `button-primary`, `years-nav`)

**Formatting**
- Indentation: 2 spaces
- No semicolons at end of statements (follow existing style)
- Opening brace on same line: `if (condition) {`
- Use single quotes for strings in JS

**Functions**
- Keep functions small and focused (under 50 lines when possible)
- Place helper functions near their usage
- Document complex logic with inline comments (sparse - follow existing style)

**Error Handling**
- Use `try-catch` for async operations (fetch, file operations)
- Provide fallback values: `function safeDivide(numerator, denominator, fallback = 0)`
- Log errors to console for debugging
- Never expose sensitive information in error messages

### HTML (docs/)

**Structure**
- Use semantic HTML5 elements: `<main>`, `<header>`, `<nav>`, `<section>`
- One main HTML file per page (index.html, 4/index.html, 10/index.html, 12/index.html)
- Include `lang="bg"` attribute on `<html>`

**Meta Tags**
- Include proper SEO meta tags (title, description, canonical, Open Graph, Twitter Cards)
- Use CSP meta tag for security

**Script Loading**
- Use `defer` attribute for non-blocking scripts
- Load scripts in correct order: config → data → logic
- Load `config-global.js` before grade-specific config files

### CSS (docs/css/)

**Style**
- Follow Skeleton CSS conventions (already in use)
- Custom styles go in `custom.css`
- Use flexbox for layout, avoid floats

**Classes**
- Use descriptive class names: `button-primary`, `quote-container`
- One class per element for simple styling, combine for complex

### Java (java/)

**Standard Maven Project**
- Follow standard Maven directory structure
- Use existing code style in `Decomplexor.java`, `CSVNormalizer.java`
- Run `mvnw clean package` before testing

**Naming**
- Classes: `PascalCase` (e.g., `Decomplexor`, `CSVNormalizer`)
- Methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

## Architecture

### Data Flow
```
data/normalized/*.csv → java/ → docs/js/schools-{4,7,10,12}.js
```

### Frontend Structure
```
docs/
├── index.html, 4/, 10/, 12/     # HTML pages
├── js/
│   ├── logic.js                  # Main application (1873 lines)
│   ├── stats/logic.js           # Statistics page (1778 lines)
│   ├── config-global.js         # Shared configuration
│   ├── config-{4,7,10,12}.js    # Per-grade configuration
│   ├── schools-{4,7,10,12}.js   # Generated data (DO NOT EDIT)
│   └── *.js                     # Libraries (Highcharts, jsPDF)
├── css/
│   ├── skeleton.css             # CSS framework
│   ├── custom.css               # Custom styles
│   └── fonts.css                # Font definitions
└── tests/
    ├── smoke.html               # Test runner
    └── smoke.js                 # Test suite (491 lines)
```

### Configuration Files

**config-global.js** - Shared constants:
- `latestYearByGrade` - Navigation years per grade
- `CHART_*` - Highcharts configuration
- `TABLE_PDF_*` - PDF export settings
- `SCHOOL_*_THRESHOLD` - Top school thresholds
- `NAV_FIRST_YEAR`, `COOKIE_MAX_AGE_SECONDS`

**config-{grade}.js** - Per-grade configuration:
- `firstYear`, `numYears` - Year range
- `baseSchoolIndex`, `refSchoolIndex` - Default schools
- `chartCeiling`, `chartFloor` - Y-axis bounds
- `cookieName` - Cookie prefix for URL persistence

## Key Files

| File | Purpose |
|------|---------|
| `docs/js/logic.js` | Main application logic, 1873 lines |
| `docs/js/config-global.js` | Shared configuration constants |
| `docs/js/config-{4,7,10,12}.js` | Per-grade configuration |
| `docs/js/stats/logic.js` | Statistics page logic, 1778 lines |
| `docs/tests/smoke.js` | Browser-based test suite |
| `java/Decomplexor.java` | Data generation tool |
| `java/CSVNormalizer.java` | CSV normalization |

## School Data Structure

In `schools-{grade}.js`:
```javascript
s[i] = {
  b: [/* BEL scores per year, null if no data */],
  m: [/* MAT scores per year, null if no data */],
  bu: [/* BEL student counts */],
  mu: [/* MAT student counts */],
  l: "Short label",
  n: "Full school name",
  w: "Website URL"
};
si = {
  "Sofia": { n: [start, end], p: [start, end] },
  // n = public, p = private
};
```

## Important Notes

1. **DO NOT EDIT** `schools-{4,7,10,12}.js` - these are generated files
2. **Generated by Java tool** from CSV data in `data/normalized/`
3. **Tests run in browser only** - no CLI test runner exists
4. **Highcharts is licensed** - do not redistribute
5. **Update config-global.js** when changing shared configuration
