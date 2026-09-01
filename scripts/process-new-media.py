#!/usr/bin/env python3
"""Optimiza fotos nuevas en public/images/nuevas/ → public/images/real/"""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
except ImportError:
    raise SystemExit("Instalá Pillow: pip3 install Pillow")

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images" / "nuevas"
DST = ROOT / "public" / "images" / "real"


def enhance(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > 2400:
        scale = 2400 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Color(img).enhance(1.05)
    img = ImageEnhance.Sharpness(img).enhance(1.15)
    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=3))


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    files = [f for f in SRC.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
    if not files:
        print("No hay fotos en public/images/nuevas/")
        return

    for path in files:
        out = DST / f"{path.stem}.jpg"
        img = enhance(Image.open(path))
        img.save(out, format="JPEG", quality=88, optimize=True, progressive=True)
        print(f"OK {path.name} → {out.name}")


if __name__ == "__main__":
    main()
