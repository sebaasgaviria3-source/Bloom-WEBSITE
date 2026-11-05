"""Dev-time image pipeline for Bloom (not shipped). Usage: python3 tools/build_images.py"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/photos/source"
OUT = ROOT / "assets/img"
OUT.mkdir(parents=True, exist_ok=True)

# Hero: landscape (desktop) + portrait 4:5 crop centred on the açaí bowl (mobile)
hero = Image.open(SRC / "hero-brunch.jpg").convert("RGB")
w, h = hero.size  # 1600x1280
for width in (1600, 1200):
    im = hero.resize((width, round(h * width / w)), Image.LANCZOS)
    im.save(OUT / f"hero-brunch-{width}.webp", "WEBP", quality=72, method=6)
cw = round(h * 4 / 5)
cx = 790  # bowl centre x in source
left = max(0, min(w - cw, cx - cw // 2))
portrait = hero.crop((left, 0, left + cw, h))
for width in (900, 640):
    im = portrait.resize((width, round(width * 5 / 4)), Image.LANCZOS)
    im.save(OUT / f"hero-brunch-portrait-{width}.webp", "WEBP", quality=72, method=6)

# Logo: black background -> transparent (unpremultiply by brightest channel)
logo = Image.open(SRC / "logo-bloom-black.jpg").convert("RGB")
logo = logo.resize((logo.width * 2, logo.height * 2), Image.LANCZOS)
px = logo.load()
out = Image.new("RGBA", logo.size)
po = out.load()
for y in range(logo.height):
    for x in range(logo.width):
        r, g, b = px[x, y]
        a = max(r, g, b)
        a = 0 if a < 22 else min(255, round((a - 22) * 255 / (255 - 22)))
        if a == 0:
            po[x, y] = (0, 0, 0, 0)
        else:
            k = 255 / max(a, 1)
            po[x, y] = (min(255, round(r * k)), min(255, round(g * k)), min(255, round(b * k)), a)
bbox = out.getbbox()
out = out.crop(bbox)
out.save(OUT / "logo-bloom.webp", "WEBP", quality=90, method=6, lossless=False)
out.save(ROOT / "assets/photos/source/logo-bloom-transparent.png")
print("logo", out.size)
for p in sorted(OUT.iterdir()):
    print(p.name, p.stat().st_size // 1024, "KB")
