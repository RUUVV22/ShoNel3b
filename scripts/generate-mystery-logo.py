"""Rebuild the approved Sho Nel3b 'مين وراها' catalogue logo from its source artwork.

Input: assets/mystery/logo_source.png (original approved 1536x1024 illustration)
Output: assets/mystery/logo.png (768x512 optimized PNG for web and mobile)
Run: python scripts/generate-mystery-logo.py

The source art is intentionally retained in version control. Never regenerate it
from a prompt when preparing a production build; only resize the approved source.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "mystery" / "logo_source.png"
OUTPUT = ROOT / "assets" / "mystery" / "logo.png"
if not SOURCE.is_file():
    raise SystemExit(f"Missing approved source illustration: {SOURCE}")

with Image.open(SOURCE) as original:
    if original.size != (1536, 1024):
        raise SystemExit(f"Unexpected source dimensions {original.size}; expected 1536x1024.")
    if original.format != "PNG":
        raise SystemExit("Source artwork must be PNG.")
    image = original.convert("RGB").resize((768, 512), Image.Resampling.LANCZOS)
    image.save(OUTPUT, format="PNG", optimize=True)
print(f"Regenerated {OUTPUT} from {SOURCE} ({image.width}x{image.height})")
