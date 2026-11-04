#!/usr/bin/env python3
"""Cut an icon sheet into the single icon files it produces.

Usage:
  python3 scripts/slice_sheet.py prompts/icons/sheet_power_icons.md sheet.png

Reads `grid` (e.g. 4x2) and `produces` (asset ids, left to right, top to bottom)
from the sheet's prompt file, finds the badge inside each grid cell by its alpha
bounding box, pads it to a centered square, scales it to the icon's final_size and
writes it to the icon's output path. Then runs the technical validation on every
icon and prints one JSON result per icon. The sheet itself is saved under the
sheet's output path.

Exit code 0 = every icon passed, 1 = at least one failed or a cell was empty.
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from validate_asset import read_frontmatter, size_tuple, validate  # noqa: E402


def prompt_for(asset_id: str) -> Path:
    hits = list(Path("prompts").glob(f"*/{asset_id}.md"))
    if len(hits) != 1:
        raise SystemExit(f"prompt file for {asset_id} not found")
    return hits[0]


def _main_run(sums: list[int]) -> tuple[int, int] | None:
    """Longest-mass run of non-empty lines: drops stray bits a neighbour cell pokes in."""
    runs, start = [], None
    for i, v in enumerate(sums + [0]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i))
            start = None
    return max(runs, key=lambda r: sum(sums[r[0]:r[1]])) if runs else None


def item_bbox(alpha: Image.Image) -> tuple[int, int, int, int] | None:
    """Bounding box of the main shape in a cell's alpha mask (values 0 or 255)."""
    w, h = alpha.size
    data = alpha.load()
    rows = _main_run([sum(1 for x in range(w) if data[x, y]) for y in range(h)])
    if not rows:
        return None
    cols = _main_run([sum(1 for y in range(*rows) if data[x, y]) for x in range(w)])
    return (cols[0], rows[0], cols[1], rows[1])


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    sheet_prompt, sheet_path = Path(argv[1]), Path(argv[2])
    fm = read_frontmatter(sheet_prompt)
    cols, rows = size_tuple(fm["grid"])
    ids = fm["produces"]
    if len(ids) > cols * rows:
        raise SystemExit("more produced assets than grid cells")

    sheet = Image.open(sheet_path).convert("RGBA")
    Path(fm["output"]).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(fm["output"], "PNG")
    cw, ch = sheet.width / cols, sheet.height / rows
    alpha = sheet.getchannel("A").point(lambda a: 255 if a > 8 else 0)

    ok = True
    results = []
    for i, asset_id in enumerate(ids):
        c, r = i % cols, i // cols
        box = (round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))
        bbox = item_bbox(alpha.crop(box))
        if not bbox:
            results.append({"asset_id": asset_id, "error": f"cell {c + 1},{r + 1} is empty"})
            ok = False
            continue
        x0, y0, x1, y1 = bbox[0] + box[0], bbox[1] + box[1], bbox[2] + box[0], bbox[3] + box[1]
        side = round(max(x1 - x0, y1 - y0) * 1.06)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        crop = sheet.crop((x0, y0, x1, y1))
        crop.putalpha(crop.getchannel("A").point(lambda a: 0 if a <= 8 else a))
        square.alpha_composite(crop, (round(side / 2 - (cx - x0)), round(side / 2 - (cy - y0))))
        pf = prompt_for(asset_id)
        ifm = read_frontmatter(pf)
        out = Path(ifm["output"])
        out.parent.mkdir(parents=True, exist_ok=True)
        square.resize(size_tuple(ifm["final_size"]), Image.LANCZOS).save(out, "PNG")
        res = validate(pf, out)
        res["sliced_from"] = f"{fm['output']} cell {c + 1},{r + 1}"
        results.append(res)
        ok = ok and res["technical"]["passed"]

    print(json.dumps(results, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
