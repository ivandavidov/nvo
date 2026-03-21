# Bulgarian School Exam Results — НВО and ДЗИ (2018–2025)

Comprehensive dataset of national exam results for all schools in Bulgaria, covering the National External Assessment (НВО) for grades 4, 7, and 10, and the State Matriculation Exams (ДЗИ) for grade 12.

**Author:** Ivan Davidov (Иван Давидов)
**Source website:** https://ivandavidov.github.io/nvo
**JSON API:** https://ivandavidov.github.io/nvo/api/v1/
**GitHub:** https://github.com/ivandavidov/nvo

## Data Source

Raw data originates from the Bulgarian Open Data Portal ([data.egov.bg](https://data.egov.bg)). It has been cleaned, normalized, and structured by Ivan Davidov into a unified format across all grades and years.

## Files

### scores.csv (25,945 rows)

One row per school per grade per year where at least one exam score exists.

| Column | Type | Description |
|--------|------|-------------|
| grade | int | Grade level: 4, 7, 10, or 12 |
| year | int | Exam year (2018–2025) |
| city | string | City slug (e.g., "sofia", "plovdiv") |
| school_code | string | Unique school identifier |
| bel_score | float | Bulgarian Language and Literature score |
| mat_score | float | Mathematics score (or 2nd exam for grade 12) |
| bel_students | int | Number of students who took the BEL exam |
| mat_students | int | Number of students who took the MAT exam |

**Score scale:** 0–100 for grades 4, 7, 10; 2–6 for grade 12 (ДЗИ).

### rankings.csv (45,724 rows)

School rankings by composite score (average of BEL and MAT). Two types:

- **year** — single-year ranking
- **median** — 3-year rolling median (available from 2020 onwards)

| Column | Type | Description |
|--------|------|-------------|
| grade | int | Grade level |
| year | int | Ranking year |
| type | string | "year" or "median" |
| rank | int | Position in ranking |
| adjusted_rank | int | Rank excluding schools without end-year data (median only) |
| school_code | string | Unique school identifier |
| city | string | City slug(s), comma-separated if multiple |
| bel_score | float | BEL score (or median for type=median) |
| mat_score | float | MAT score (or median for type=median) |
| score | float | Composite score |

### schools.csv (1,388 rows)

Master directory of all schools.

| Column | Type | Description |
|--------|------|-------------|
| code | string | Unique school identifier |
| short_name | string | Abbreviated name (Bulgarian) |
| full_name | string | Full official name (Bulgarian) |
| website | string | School website URL (if available) |
| is_private | bool | True for private schools |

### cities.csv (145 rows)

All cities where schools participate in national exams.

| Column | Type | Description |
|--------|------|-------------|
| slug | string | URL-friendly identifier |
| full_name | string | Full city name (Bulgarian) |
| short_name | string | Short city name (Bulgarian) |
| order_position | int | Tier: 1 = major city, 2 = regional center, 3 = smaller town |

## Coverage

| Grade | Exam | Years | Scale |
|-------|------|-------|-------|
| 4 | НВО (National External Assessment) | 2018–2025 | 0–100 |
| 7 | НВО (National External Assessment) | 2018–2025 | 0–100 |
| 10 | НВО (National External Assessment) | 2021–2025 | 0–100 |
| 12 | ДЗИ (State Matriculation Exams) | 2018–2025 | 2–6 |

## Usage Ideas

- Compare school performance trends over time
- Analyze urban vs. rural education gaps
- Study private vs. public school outcomes
- Build predictive models for future exam results
- Explore geographic patterns in education quality

## License

MIT — free to use, modify, and redistribute with attribution.

## Citation

If you use this dataset, please cite:

> Ivan Davidov, "Bulgarian School Exam Results — НВО and ДЗИ (2018–2025)", https://ivandavidov.github.io/nvo
