---
asset_id: sheet_slot_icons
name: Gear Slot Icons Sheet
category: ui
type: icon_sheet
batch: 16-slot-icons
status: ready
revision: 2
output: assets/ui/sheets/slot-icons.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 4x3
reference_images:
  - assets/ui/sheets/ui-icons.png
produces:
  - ui_slot_helm
  - ui_slot_shoulders
  - ui_slot_chest
  - ui_slot_belt
  - ui_slot_boots
  - ui_slot_cloak
  - ui_slot_gloves
  - ui_slot_sword
  - ui_slot_amulet
  - ui_slot_ring
  - ui_slot_charm
  - ui_slot_unknown
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 12 neutral outline symbols that mark the empty equipment slots on the Lord's gear screen. Each symbol is later cut out and shown at 34 to 40 pixels, dimmed, inside an empty slot, until the player puts a real item there.

Art style: clean, simple 2D game interface symbols with crisp, sharp edges. Each symbol is one flat, solid silhouette in a single light grey-lilac color (#b9aecb), surrounded by a thin, sharp, darker purple outline (#3a2d4b). No gradients, no shading, no glow, no blur, no soft edges, no texture, no inner details except a few essential lines that make the shape readable. Simple, sturdy, slightly stylized dark-fantasy shapes, like the empty slot markers of an inventory screen.

Subject: exactly 12 separate symbols arranged in a strict grid of 4 columns and 3 rows, read left to right, top to bottom, in this order:
1. a closed knight helmet with a narrow eye slit, seen from the front (Helm)
2. a pair of rounded shoulder plates seen from the front, side by side (Shoulders)
3. a breastplate seen from the front (Chest)
4. a belt with a square buckle, seen from the front (Belt)
5. a pair of boots side by side, seen from the side (Boots)
6. a hanging cloak with a high collar, seen from the back (Cloak)
7. a single armored glove with the fingers pointing up (Gloves)
8. a straight sword pointing up, shown diagonally (Sword)
9. a round amulet on a short cord (Amulet)
10. a plain ring with a small stone, seen slightly from above (Ring)
11. a small round charm hanging from a short loop (Charm)
12. a small closed cloth bundle tied with a cord (Unknown Item)

Every symbol: one simple outline shape, centered in its own grid cell (about 384 pixels wide and 341 pixels tall) and filling most of it. All symbols use the identical line color and line thickness and are drawn at a similar size, so they look like one set. Symbols never touch or overlap each other or the image edge.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the symbols (real alpha channel). The background must be truly transparent, not a colored, blurred or painted surface. No grid lines, no cell borders, no background panel.

Reference image assets/ui/sheets/ui-icons.png: interface icons of the same game. Match their sharp edges and simple, sturdy shapes, but draw every symbol as a flat light grey-lilac silhouette without other colors.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border, frame, badge, background shape or shadow.

## Acceptance checks

- Exactly 12 symbols in a 4x3 grid, none touching
- Order and shapes match the list
- Flat light grey-lilac silhouettes with a thin dark outline, sharp edges, no blur
- Same line weight and size across the set
- Readable at 34 px
- Truly transparent background

## Changelog

- r1 (2026-11-04): first version. Timo wants own neutral outline icons for empty gear slots instead of dimmed item icons.
- r2 (2026-11-04): r1 result rejected: blurry blobs on an opaque lilac surface. Now flat sharp silhouettes with a thin dark outline instead of outline-only lines, and a stricter transparency line.
