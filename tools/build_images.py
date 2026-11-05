"""Dev-time image pipeline for Bloom (not shipped). Usage: python3 tools/build_images.py

Applies a lively grade (a little more colour and contrast, a touch brighter)
and exports WebP crops for desktop and mobile.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/photos/source"
OUT = ROOT / "assets/img"
OUT.mkdir(parents=True, exist_ok=True)


def grade(im):
    im = ImageEnhance.Color(im).enhance(1.08)       # vivid, true-to-life colour
    im = ImageEnhance.Brightness(im).enhance(1.02)  # a little brighter, fresher
    im = ImageEnhance.Contrast(im).enhance(1.04)
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
    "batidos": None, "hamburguesa": None, "helado": None, "local-sala": None,
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

# ---------------------------------------------------------------
# Venue + colourful photos (second upload)
# ---------------------------------------------------------------
# Teddy bear with coffee: crop away the black letterbox bars (rows 431–1169)
osito = grade(Image.open(GAL / "osito-cafe.jpg").convert("RGB")).crop((0, 434, 738, 1166))
save(osito, "g-osito-cafe-738.webp", 738, q=78)

# Venue: the pink counter with the Bloom sign
barra = grade(Image.open(GAL / "local-barra.jpg").convert("RGB"))
save(barra, "venue-barra-1195.webp", 1195, q=78)
bw, bh = barra.size
pw = round(bh * 4 / 5)
pl = max(0, min(bw - pw, 600 - pw // 2))       # centre on the counter + teddy
save(barra.crop((pl, 0, pl + pw, bh)), "venue-barra-portrait-717.webp", pw, q=78)

sala = grade(Image.open(GAL / "local-sala.jpg").convert("RGB"))
save(sala, "venue-sala-800.webp", 800, q=74)

# Menu cover: the colourful breakfast table, square and wide crops
des = grade(Image.open(GAL / "desayuno.jpg").convert("RGB"))
save(des, "menu-desayuno-1200.webp", 1200, q=76)
save(des, "menu-desayuno-800.webp", 800, q=74)

# Pink teddy poster for the visit section: keep the bear and the welcome line
cartel = grade(Image.open(GAL / "cartel-osito.jpg").convert("RGB"))
save(cartel, "g-cartel-osito-600.webp", 600, q=76)
