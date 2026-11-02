---
asset_id: sheet_extra_icons
name: Extra Icons Sheet
category: icons
type: icon_sheet
batch: 09-extra-icons
status: review
revision: 1
output: assets/icons/sheets/extra-icons.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 1024x1024
grid: 2x2
reference_images:
  - assets/characters/lord.png
  - assets/icons/sheets/power-icons.png
produces:
  - icon_lash
  - icon_tremor
  - icon_avarice
  - icon_dread_harvest
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 4 upgrade button icons (a gold power and permanent upgrades). Each icon is later cut out and shown at 40x40 pixels next to its upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 4 separate icons arranged in a strict grid of 2 columns and 2 rows, read left to right, top to bottom, in this order:
1. a crimson whip cracking in a curved arc (Blood Lash)
2. a cracked stone slab with orange shock lines rising from the crack (Tremor)
3. a gold coin with a bite taken out of it (Avarice)
4. a dark scythe with a purple soul wisp curling around its blade (Dread Harvest)

Every icon: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. All badges are the same size and identical in shape, color and rim. Each badge sits centered in its own grid cell (about 512 pixels wide) with clear empty space around it; badges never touch or overlap each other or the image edge.

Technical: square image, 1024x1024, PNG with a fully transparent background everywhere outside the badges (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Reference image assets/icons/sheets/power-icons.png: an approved sheet from the same icon set. Copy its badge exactly (same plum color, same thin orange rim, same size relative to the symbol) and match its symbol style; do not copy its symbols.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border or frame.

## Acceptance checks

- Exactly 4 badges in a 2x2 grid, none touching
- Order and symbols match the list
- All badges identical: round plum badge with soft orange rim, same as in power-icons.png
- No texture, no fine detail, one clear symbol per badge
- Each icon readable at 40 px
- Transparent outside the badges

## Changelog

- r1 (2026-11-02): first version, for the pacts and upgrades added with the prestige builds. The single icon prompts are the fallback; scripts/slice_sheet.py cuts the sheet into their output files.
