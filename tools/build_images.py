"""Dev-time image pipeline for Bloom (not shipped). Usage: python3 tools/build_images.py

Applies a gentle, natural grade (slightly less saturation, a touch brighter)
and exports WebP crops for desktop and mobile.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/photos/source"
OUT = ROOT / "assets/img"
OUT.mkdir(parents=True, exist_ok=True)


def grade(im):
    im = ImageEnhance.Color(im).enhance(0.86)       # softer, more natural colour
    im = ImageEnhance.Brightness(im).enhance(1.03)  # a little brighter, fresher
    im = ImageEnhance.Contrast(im).enhance(0.97)
    return im


def save(im, name, width, q=74):
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / name, "WEBP", quality=q, method=6)


hero = grade(Image.open(SRC / "hero-brunch.jpg").convert("RGB"))
w, h = hero.size  # 1600x1280

# Hero, desktop (full frame)
for width in (1600, 1200):
    save(hero, f"hero-brunch-{width}.webp", width)

# Hero, mobile: portrait crop centred on the açaí bowl
cw = round(h * 4 / 5)
left = max(0, min(w - cw, 790 - cw // 2))
portrait = hero.crop((left, 0, left + cw, h))
for width in (900, 640):
    save(portrait, f"hero-brunch-portrait-{width}.webp", width)

# Detail photo under the colour block: lower half of the table (juices, sandwiches, strawberries)
detail_wide = hero.crop((0, 800, w, h))                    # 1600x480, below the bowl
save(detail_wide, "detail-table-1600.webp", 1600)
save(detail_wide, "detail-table-1200.webp", 1200)
detail_tall = hero.crop((880, 520, 1600, 1280))            # croissant, red juice, strawberries
save(detail_tall, "detail-table-portrait-840.webp", 840)

for p in sorted(OUT.iterdir()):
    print(p.name, p.stat().st_size // 1024, "KB")
