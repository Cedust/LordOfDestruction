---
asset_id: sheet_gear_icons_b
name: Gear Icons Sheet B
category: equipment
type: icon_sheet
batch: 13-gear-icons-b
status: review
revision: 1
output: assets/equipment/sheets/gear-icons-b.png
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
  - gear_bloodstep_greaves
  - gear_iron_treads
  - gear_ashen_boots
  - gear_shroud_of_night
  - gear_crimson_cloak
  - gear_tattered_cape
  - gear_barbed_gauntlets
  - gear_ironclad_fists
  - gear_grave_gloves
  - gear_bloodletter
  - gear_dread_blade
  - gear_iron_greatsword
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 12 equipment item icons (boots, cloaks, gloves and swords) for the Lord's gear screen. Each item is later cut out and shown at 32 to 40 pixels inside an inventory slot.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 12 separate items arranged in a strict grid of 4 columns and 3 rows, read left to right, top to bottom, in this order:
1. a pair of dark iron boots with deep red trim and a red blood drop on the side (Bloodstep Greaves)
2. a pair of heavy, plain iron boots (Iron Treads)
3. a pair of worn ash-grey leather boots (Ashen Boots)
4. a dark purple hooded cloak with a soft purple glow along its edge (Shroud of Night)
5. a flowing muted red cloak (Crimson Cloak)
6. a torn brown cape with ragged edges (Tattered Cape)
7. a black iron gauntlet with sharp black thorns on the knuckles (Barbed Gauntlets)
8. a heavy plain iron gauntlet clenched into a fist (Ironclad Fists)
9. a dark grey leather glove with glowing orange cracks on the palm (Grave Gloves)
10. a curved dark sword with a deep red blade edge and a red drop at its tip, shown diagonally (Bloodletter)
11. a straight black sword with a glowing orange line along the blade, shown diagonally (Dread Blade)
12. a large, plain iron two-handed sword, shown diagonally (Iron Greatsword)

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
