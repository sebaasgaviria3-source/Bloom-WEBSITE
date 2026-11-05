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


# ---------------------------------------------------------------
# Gallery photos (collage, full-bleed, menu, instagram)
# Each entry: name -> optional crop box (left, top, right, bottom) in source px
# ---------------------------------------------------------------
GAL = ROOT / "assets/photos/source/gallery"
GALLERY = {
    "tortitas": None, "acai-coco": None, "croissant-benedict": None, "zumo-rojo": None,
    "desayuno": None, "bizcocho": None, "tostada-bacon": None, "cafes-latte": None,
    "bollo-crema": None, "pasteis": None, "tortilla": None, "coxinhas": None,
    "batidos": None, "hamburguesa": None, "helado": None,
}
for name, box in GALLERY.items():
    im = grade(Image.open(GAL / f"{name}.jpg").convert("RGB"))
    if box:
        im = im.crop(box)
    for width in (1000, 600):
        if im.width >= width * 0.9:
            save(im, f"g-{name}-{width}.webp", min(width, im.width), q=72)
        else:  # small source (e.g. 608px): export once at native size
            save(im, f"g-{name}-{width}.webp", im.width, q=78)

# Full-bleed coxinhas: wide for desktop, 4:5 portrait for mobile
cox = grade(Image.open(GAL / "coxinhas.jpg").convert("RGB"))
save(cox, "full-coxinhas-1600.webp", 1600, q=72)
cw = round(cox.height * 4 / 5)
left = (cox.width - cw) // 2
save(cox.crop((left, 0, left + cw, cox.height)), "full-coxinhas-portrait-900.webp", 900, q=72)
