#!/usr/bin/env python3
"""Generate a cover image for the Kaggle dataset."""

from PIL import Image, ImageDraw, ImageFont
import json
import os

W, H = 1128, 568  # 2x the minimum 564x284
FONT = os.path.join(os.path.dirname(__file__), '..', 'docs', 'fonts', 'NotoSans-Regular.ttf')
API = os.path.join(os.path.dirname(__file__), '..', 'docs', 'api', 'v1')
OUT = os.path.join(os.path.dirname(__file__), 'cover.png')

# Colors
BG = (22, 27, 34)           # dark background
ACCENT = (56, 132, 244)     # blue accent
ACCENT2 = (46, 160, 67)     # green accent
TEXT = (230, 237, 243)       # light text
TEXT_DIM = (139, 148, 158)   # dimmed text
BAR1 = (56, 132, 244)       # blue bars (BEL)
BAR2 = (246, 173, 66)       # orange bars (MAT)
GRID = (48, 54, 61)         # grid lines

img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

def font(size):
    return ImageFont.truetype(FONT, size)

# --- Background grid pattern ---
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(30, 36, 44), width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(30, 36, 44), width=1)

# --- Mini bar chart (left side, decorative) ---
chart_x, chart_y = 50, 200
chart_w, chart_h = 380, 300
bar_w = 20
gap = 10

# Load actual top-10 scores from grade 7, year 2025 for realistic data
try:
    with open(os.path.join(API, 'rankings', '7', '2025.json')) as f:
        rdata = json.load(f)
    top_schools = rdata['schools'][:9]
    bel_scores = [s['belScore'] for s in top_schools]
    mat_scores = [s['matScore'] for s in top_schools]
except Exception:
    bel_scores = [95, 92, 90, 88, 87, 85, 83, 82, 80]
    mat_scores = [97, 94, 91, 89, 86, 84, 82, 80, 79]

# Draw axis lines
draw.line([(chart_x, chart_y), (chart_x, chart_y + chart_h)], fill=GRID, width=2)
draw.line([(chart_x, chart_y + chart_h), (chart_x + chart_w, chart_y + chart_h)], fill=GRID, width=2)

# Horizontal grid lines
for i in range(1, 5):
    y = chart_y + int(chart_h * i / 5)
    draw.line([(chart_x, y), (chart_x + chart_w, y)], fill=GRID, width=1)

# Draw bars
for i, (b, m) in enumerate(zip(bel_scores, mat_scores)):
    x = chart_x + 20 + i * (bar_w * 2 + gap)
    h1 = int((b / 100) * chart_h * 0.9)
    h2 = int((m / 100) * chart_h * 0.9)
    # BEL bar
    draw.rectangle([(x, chart_y + chart_h - h1), (x + bar_w, chart_y + chart_h)], fill=BAR1)
    # MAT bar
    draw.rectangle([(x + bar_w, chart_y + chart_h - h2), (x + bar_w * 2, chart_y + chart_h)], fill=BAR2)

# Chart legend
lx = chart_x + 10
ly = chart_y - 30
draw.rectangle([(lx, ly), (lx + 14, ly + 14)], fill=BAR1)
draw.text((lx + 20, ly - 2), "БЕЛ", fill=TEXT_DIM, font=font(16))
draw.rectangle([(lx + 75, ly), (lx + 89, ly + 14)], fill=BAR2)
draw.text((lx + 95, ly - 2), "МАТ", fill=TEXT_DIM, font=font(16))
draw.text((lx + 155, ly - 2), "Топ 9 училища, НВО 7 клас, 2025", fill=TEXT_DIM, font=font(14))

# --- Right side: text content ---
tx = 570
# Title
draw.text((tx, 50), "Bulgarian School", fill=TEXT, font=font(44))
draw.text((tx, 104), "Exam Results", fill=TEXT, font=font(44))

# Subtitle with accent
draw.text((tx, 170), "НВО & ДЗИ  2018–2025", fill=ACCENT, font=font(28))

# Author
draw.text((tx, 220), "by Ivan Davidov", fill=TEXT_DIM, font=font(22))

# Stats boxes
stats = [
    ("1,388", "schools"),
    ("145", "cities"),
    ("25,945", "score records"),
    ("45,724", "rankings"),
]

sy = 280
for i, (num, label) in enumerate(stats):
    bx = tx + (i % 2) * 260
    by = sy + (i // 2) * 90
    # Box background
    draw.rounded_rectangle([(bx, by), (bx + 240, by + 75)], radius=8, fill=(30, 38, 48), outline=GRID)
    draw.text((bx + 16, by + 10), num, fill=ACCENT, font=font(28))
    draw.text((bx + 16, by + 44), label, fill=TEXT_DIM, font=font(16))

# Bottom accent line
draw.rectangle([(0, H - 4), (W, H)], fill=ACCENT)

# --- Flag stripe (tiny Bulgarian flag accent in top-right) ---
flag_x, flag_y, flag_w, flag_h = W - 80, 20, 60, 36
draw.rectangle([(flag_x, flag_y), (flag_x + flag_w, flag_y + flag_h // 3)], fill=(255, 255, 255))
draw.rectangle([(flag_x, flag_y + flag_h // 3), (flag_x + flag_w, flag_y + 2 * flag_h // 3)], fill=(0, 150, 110))
draw.rectangle([(flag_x, flag_y + 2 * flag_h // 3), (flag_x + flag_w, flag_y + flag_h)], fill=(214, 38, 18))

img.save(OUT, 'PNG', quality=95)
print(f'Saved: {OUT} ({W}x{H})')
