---
asset_id: sheet_gear_icons_a
name: Gear Icons Sheet A
category: equipment
type: icon_sheet
batch: 12-gear-icons-a
status: approved
revision: 1
output: assets/equipment/sheets/gear-icons-a.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 4x3
reference_images:
  - assets/characters/lord.png
produces:
  - gear_horned_helm
  - gear_iron_visor
  - gear_skull_cap
  - gear_spiked_pauldrons
  - gear_bone_mantle
  - gear_grave_spaulders
  - gear_thorned_cuirass
  - gear_black_plate
  - gear_ashen_hauberk
  - gear_briar_belt
  - gear_gilded_girdle
  - gear_chain_sash
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 12 equipment item icons (helms, shoulder guards, chest armor and belts) for the Lord's gear screen. Each item is later cut out and shown at 32 to 40 pixels inside an inventory slot.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 12 separate items arranged in a strict grid of 4 columns and 3 rows, read left to right, top to bottom, in this order:
1. a closed dark iron helmet with two curved horns and a soft purple glow in its eye slit (Horned Helm)
2. a plain grey iron helmet with a lowered visor (Iron Visor)
3. a simple round dark leather cap with a small pale bone skull on the front (Skull Cap)
4. a pair of black iron shoulder plates covered in sharp black thorns (Spiked Pauldrons)
5. a shoulder guard made of a few large pale bones (Bone Mantle)
6. a pair of heavy dark grey stone shoulder plates shaped like small tombstones (Grave Spaulders)
7. a black iron breastplate with sharp black thorns sticking out of it (Thorned Cuirass)
8. a plain, heavy black iron breastplate (Black Plate)
9. an ash-grey armored tunic made of a few large overlapping plates (Ashen Hauberk)
10. a dark leather belt wrapped in black thorny brambles (Briar Belt)
11. a wide dark leather belt with a large muted gold buckle (Gilded Girdle)
12. a dark red cloth sash with three large iron rings on it (Chain Sash)

Every item: one single, solid object, seen from the front or slightly from the side, centered in its own grid cell (about 384 pixels wide and 341 pixels tall) and filling most of it. Items never touch or overlap each other or the image edge. No loose sparks, particles or floating parts that are separate from the object. All items are drawn at a similar size and in the same style, so they look like one set.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the items (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: the Lord who wears this gear. Match its outline weight, shading and dark iron, purple and ember palette.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border, frame, badge, background shape or shadow on the ground.

## Acceptance checks

- Exactly 12 items in a 4x3 grid, none touching
- Order and items match the list
- Same style, angle and size for all items; matches the Lord's palette
- No texture, no fine detail, no loose particles
- Each item readable at 32 px
- Transparent outside the items, no badge or background shape

## Changelog

- r1 (2026-11-04): first version, for the gear system. The single item prompts are the fallback; scripts/slice_sheet.py cuts the sheet into their output files.
