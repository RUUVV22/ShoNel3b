"""Re-letter the existing illustrated game box art without changing its characters.

Requires Pillow, arabic_reshaper and python-bidi. Output is a 768x512 PNG.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/game-logos/codenames_logo.png"
OUTPUT = ROOT / "assets/game-logos/fak_alshifra_logo.png"

PLUM = "#351326"
CORAL = "#E75A3C"
MUSTARD = "#F2B529"
CREAM = "#FFF0CF"

image = Image.open(SOURCE).convert("RGB")
draw = ImageDraw.Draw(image)
font_path = ROOT / "node_modules/@expo-google-fonts/tajawal/900Black/Tajawal_900Black.ttf"
if not font_path.exists():
    font_path = Path("C:/Windows/Fonts/arialbd.ttf")
small_font = ImageFont.truetype(font_path, 32)

# Preserve the existing silhouettes and magnifier in the upper illustration,
# while covering both the former Arabic and English title completely.
draw.rounded_rectangle((73, 308, 701, 498), radius=34, fill=PLUM)
draw.rounded_rectangle((80, 312, 693, 488), radius=28, outline=MUSTARD, width=8)
draw.rounded_rectangle((94, 326, 681, 476), radius=23, outline=CORAL, width=3)
draw.ellipse((95, 383, 124, 412), fill=MUSTARD)
draw.ellipse((653, 383, 682, 412), fill=MUSTARD)

title = get_display(arabic_reshaper.reshape("فك الشيفرة"))
font_size = 116
while True:
    title_font = ImageFont.truetype(font_path, font_size)
    box = draw.textbbox((0, 0), title, font=title_font, stroke_width=3)
    if box[2] - box[0] <= 525 or font_size <= 70:
        break
    font_size -= 2
x = (768 - (box[2] - box[0])) / 2 - box[0]
y = 310 - box[1]
draw.text((x + 4, y + 6), title, font=title_font, fill=CORAL, stroke_width=7, stroke_fill=PLUM)
draw.text((x, y), title, font=title_font, fill=CREAM, stroke_width=4, stroke_fill=MUSTARD)

subtitle = "DECODE THE CLUE"
subtitle_width = draw.textbbox((0, 0), subtitle, font=small_font)[2]
draw.text(((768 - subtitle_width) / 2, 445), subtitle, font=small_font, fill=MUSTARD)

image.save(OUTPUT, optimize=True)
print(f"Generated {OUTPUT} ({image.size[0]}x{image.size[1]})")
