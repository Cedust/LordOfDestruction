---
asset_id: sheet_gear_icons_c
name: Gear Icons Sheet C
category: equipment
type: icon_sheet
batch: 14-gear-icons-c
status: review
revision: 1
output: assets/equipment/sheets/gear-icons-c.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 4x3
reference_images:
  - assets/characters/lord.png
  - assets/equipment/sheets/gear-icons-a.png
produces:
  - gear_eye_of_dusk
  - gear_bone_amulet
  - gear_gold_locket
  - gear_ring_of_gloom
  - gear_iron_band
  - gear_signet_of_greed
  - gear_ring_of_veins
  - gear_onyx_ring
  - gear_copper_ring
  - gear_blood_vial
  - gear_raven_feather
  - gear_lucky_coin
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 12 equipment item icons (amulets, rings and charms) for the Lord's gear screen. Each item is later cut out and shown at 32 to 40 pixels inside an inventory slot.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 12 separate items arranged in a strict grid of 4 columns and 3 rows, read left to right, top to bottom, in this order:
1. a round dark amulet with a glowing purple eye in its center, on a short cord (Eye of Dusk)
2. a small carved bone fang on a short cord (Bone Amulet)
3. a round muted gold locket on a short cord (Gold Locket)
4. a dark iron ring with a glowing purple stone (Ring of Gloom)
5. a plain, thick iron ring (Iron Band)
6. a heavy muted gold signet ring with a coin shape on top (Signet of Greed)
7. a dark ring with thin red lines like veins and a red stone (Ring of Veins)
8. a silver ring with a large black stone (Onyx Ring)
9. a simple copper ring (Copper Ring)
10. a small glass vial with a cork, filled with red blood (Blood Vial)
11. a single black raven feather (Raven Feather)
12. an old muted gold coin with a hole in the middle (Lucky Coin)

Every item: one single, solid object, seen from the front or slightly from the side, centered in its own grid cell (about 384 pixels wide and 341 pixels tall) and filling most of it. Items never touch or overlap each other or the image edge. No loose sparks, particles or floating parts that are separate from the object. All items are drawn at a similar size and in the same style, so they look like one set.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the items (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: the Lord who wears this gear. Match its outline weight, shading and dark iron, purple and ember palette.

Reference image assets/equipment/sheets/gear-icons-a.png: an earlier sheet from the same gear set. Match its item style, viewing angle, outline weight and size of the items in their cells; do not copy its items.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border, frame, badge, background shape or shadow on the ground.

## Acceptance checks

- Exactly 12 items in a 4x3 grid, none touching
- Order and items match the list
- Same style, angle and size for all items; matches the Lord's palette and sheet A
- No texture, no fine detail, no loose particles
- Each item readable at 32 px
- Transparent outside the items, no badge or background shape

## Changelog

- r1 (2026-11-04): first version, for the gear system. The single item prompts are the fallback; scripts/slice_sheet.py cuts the sheet into their output files.
