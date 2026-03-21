#!/usr/bin/env python3
"""Convert NVO/DZI JSON API data to CSV files for Kaggle dataset."""

import csv
import json
import os

API = os.path.join(os.path.dirname(__file__), '..', 'docs', 'api', 'v1')
OUT = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT, exist_ok=True)

# --- schools.csv ---
with open(os.path.join(API, 'schools.json')) as f:
    schools_data = json.load(f)

with open(os.path.join(OUT, 'schools.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['code', 'short_name', 'full_name', 'website', 'is_private'])
    for code, s in sorted(schools_data['schools'].items()):
        w.writerow([code, s['shortName'], s['fullName'], s.get('website') or '', s['isPrivate']])

print('schools.csv')

# --- cities.csv ---
with open(os.path.join(API, 'cities.json')) as f:
    cities_data = json.load(f)

with open(os.path.join(OUT, 'cities.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['slug', 'full_name', 'short_name', 'order_position'])
    for slug, c in sorted(cities_data['cities'].items(), key=lambda x: x[1]['orderPosition']):
        w.writerow([slug, c['fullName'], c['shortName'], c['orderPosition']])

print('cities.csv')

# --- scores.csv (main dataset: one row per school per grade per year) ---
YEARS = list(range(2018, 2026))

with open(os.path.join(OUT, 'scores.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['grade', 'year', 'city', 'school_code', 'bel_score', 'mat_score', 'bel_students', 'mat_students'])

    for grade in ['4', '7', '10', '12']:
        data_path = os.path.join(API, grade, 'data.json')
        with open(data_path) as gf:
            grade_data = json.load(gf)

        for city_slug, city_info in grade_data['cities'].items():
            for school_code, school in city_info['schools'].items():
                bel = school['belScore']
                mat = school['matScore']
                bel_s = school['belStudents']
                mat_s = school['matStudents']
                for i, year in enumerate(YEARS):
                    bs = bel[i] if i < len(bel) else None
                    ms = mat[i] if i < len(mat) else None
                    bu = bel_s[i] if i < len(bel_s) else None
                    mu = mat_s[i] if i < len(mat_s) else None
                    if bs is None and ms is None:
                        continue
                    w.writerow([grade, year, city_slug, school_code,
                                bs if bs is not None else '',
                                ms if ms is not None else '',
                                bu if bu is not None else '',
                                mu if mu is not None else ''])

print('scores.csv')

# --- rankings.csv ---
with open(os.path.join(OUT, 'rankings.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['grade', 'year', 'type', 'rank', 'adjusted_rank', 'school_code', 'city', 'bel_score', 'mat_score', 'score'])

    for grade in ['4', '7', '10', '12']:
        # Year rankings
        for year in YEARS:
            path = os.path.join(API, 'rankings', grade, f'{year}.json')
            if not os.path.exists(path):
                continue
            with open(path) as rf:
                rdata = json.load(rf)
            for s in rdata['schools']:
                w.writerow([grade, year, 'year', s['rank'], '',
                            s['code'], ','.join(s['cities']),
                            s.get('belScore', ''), s.get('matScore', ''), s.get('score', '')])

        # Median rankings
        for year in range(2020, 2026):
            path = os.path.join(API, 'rankings', 'median', grade, f'{year}.json')
            if not os.path.exists(path):
                continue
            with open(path) as rf:
                rdata = json.load(rf)
            for s in rdata['schools']:
                w.writerow([grade, year, 'median', s['rank'], s.get('adjustedRank', ''),
                            s['code'], ','.join(s['cities']),
                            s.get('belMedian', ''), s.get('matMedian', ''), s.get('score', '')])

print('rankings.csv')
print('Done!')
