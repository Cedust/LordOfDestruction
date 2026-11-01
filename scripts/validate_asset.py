#!/usr/bin/env python3
"""Technical validation of a generated image against its prompt file.

Usage:
  python3 scripts/validate_asset.py prompts/characters/char_lord.md candidate.png
  python3 scripts/validate_asset.py prompts/characters/char_lord.md candidate.png --resize out.png

Checks format, dimensions, alpha channel, real transparency (no painted checkerboard),
output path and final_size. Prints a JSON block that goes into the manifest under
validation.technical. With --resize, a candidate in generation_size is scaled to
final_size and written to the given path (usually the prompt's output path), and the
checks then run on the resized file.

Exit code 0 = all technical checks passed, 1 = at least one failed, 2 = usage error.
Needs Pillow only (available in ChatGPT's Python sandbox).
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

CATEGORIES = {"characters", "enemies", "equipment", "icons", "ui", "environments"}


def read_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError(f"{path}: no YAML frontmatter")
    data: dict = {}
    key = None
    for line in m.group(1).splitlines():
        if line.startswith("  - ") and key:
            data.setdefault(key, []).append(line[4:].strip())
            continue
        k, _, v = line.partition(":")
        key = k.strip()
        v = v.strip().strip('"')
        data[key] = [] if v in ("", "[]") else v
    return data


def size_tuple(s: str) -> tuple[int, int]:
    w, h = s.lower().split("x")
    return int(w), int(h)


def checkerboard_suspected(img: Image.Image) -> bool:
    """A painted checkerboard shows up as opaque light/grey tiles in the corners."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    n = max(16, min(w, h) // 16)
    light = grey = total = 0
    for x0, y0 in ((0, 0), (w - n, 0), (0, h - n), (w - n, h - n)):
        for y in range(y0, y0 + n, 2):
            for x in range(x0, x0 + n, 2):
                r, g, b = rgb.getpixel((x, y))
                total += 1
                if max(r, g, b) - min(r, g, b) < 12:
                    if r >= 235:
                        light += 1
                    elif 170 <= r <= 225:
                        grey += 1
    return light / total > 0.2 and grey / total > 0.2


def validate(prompt_path: Path, image_path: Path) -> dict:
    fm = read_frontmatter(prompt_path)
    want_alpha = str(fm.get("transparency", "true")).lower() == "true"
    final = size_tuple(fm["final_size"])
    output = fm.get("output", "")
    checks: dict = {}

    checks["output_path_valid"] = (
        output.startswith("assets/")
        and output.split("/")[1] in CATEGORIES
        and output.endswith(".png")
        and output.split("/")[1] == fm.get("category")
    )
    checks["output_path_matches"] = Path(image_path).as_posix().endswith(output)

    with Image.open(image_path) as img:
        img.load()
        checks["format"] = (img.format or "").lower()
        checks["format_ok"] = checks["format"] == "png"
        checks["dimensions"] = f"{img.width}x{img.height}"
        checks["final_size"] = fm["final_size"]
        checks["final_size_ok"] = (img.width, img.height) == final
        has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
        checks["alpha_channel"] = has_alpha
        rgba = img.convert("RGBA")
        alpha = rgba.getchannel("A")
        hist = alpha.histogram()
        pixels = img.width * img.height
        transparent = hist[0] / pixels
        checks["transparent_pixel_share"] = round(transparent, 3)
        corners = [alpha.getpixel(p) for p in ((0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1))]
        checks["content_ok"] = sum(hist[200:]) / pixels >= 0.05  # not an empty or almost empty image
        checks["checkerboard_suspected"] = checkerboard_suspected(rgba) if transparent < 0.05 else False
        if want_alpha:
            checks["transparency_ok"] = has_alpha and all(a == 0 for a in corners) and transparent >= 0.15 and not checks["checkerboard_suspected"]
        else:
            checks["transparency_ok"] = hist[255] == pixels  # fully opaque background

    required = ["output_path_valid", "output_path_matches", "format_ok", "final_size_ok", "transparency_ok", "content_ok"]
    if want_alpha:
        required.append("alpha_channel")
    passed = all(checks[k] for k in required) and not checks["checkerboard_suspected"]
    failed = [k for k in required if not checks[k]] + (["checkerboard_suspected"] if checks["checkerboard_suspected"] else [])
    return {
        "asset_id": fm.get("asset_id"),
        "revision": int(fm.get("revision", 0)),
        "technical": {"passed": passed, "failed": failed, **checks},
    }


def main(argv: list[str]) -> int:
    if len(argv) not in (3, 5) or (len(argv) == 5 and argv[3] != "--resize"):
        print(__doc__)
        return 2
    prompt_path, image_path = Path(argv[1]), Path(argv[2])
    if len(argv) == 5:
        fm = read_frontmatter(prompt_path)
        out = Path(argv[4])
        out.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(image_path) as img:
            img = img.convert("RGBA") if str(fm.get("transparency", "true")).lower() == "true" else img.convert("RGB")
            img.resize(size_tuple(fm["final_size"]), Image.LANCZOS).save(out, "PNG")
        image_path = out
    result = validate(prompt_path, image_path)
    print(json.dumps(result, indent=2))
    return 0 if result["technical"]["passed"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
