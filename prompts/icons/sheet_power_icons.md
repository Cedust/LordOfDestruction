---
asset_id: sheet_power_icons
name: Power Icons Sheet
category: icons
type: icon_sheet
batch: 04-power-icons
status: ready
revision: 1
output: assets/icons/sheets/power-icons.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 4x2
reference_images:
  - assets/characters/lord.png
produces:
  - icon_vitality
  - icon_hide
  - icon_regen
  - icon_aura
  - icon_radius
  - icon_thorns
  - icon_shockwave
  - icon_blood_pact
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 8 upgrade button icons (powers bought with gold). Each icon is later cut out and shown at 40x40 pixels next to its upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 8 separate icons arranged in a strict grid of 4 columns and 2 rows, read left to right, top to bottom, in this order:
1. a glowing red heart (Vitality)
2. a plate of dark scaly armor (Hide)
3. a heart with a curling green regrowth swirl (Regeneration)
4. a ring of swirling purple mist (Dread Aura)
5. three purple rings expanding outward with small arrows pointing out (Aura Reach)
6. a coiled thorny black vine (Thorns)
7. an orange shockwave burst ring (Shockwave)
8. a chalice overflowing with blood (Blood Pact)

Every icon: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. All badges are the same size and identical in shape, color and rim. Each badge sits centered in its own grid cell (about 384 pixels wide) with clear empty space around it; badges never touch or overlap each other or the image edge.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the badges (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border or frame.

## Acceptance checks

- Exactly 8 badges in a 4x2 grid, none touching
- Order and symbols match the list
- All badges identical: round plum badge with soft orange rim
- No texture, no fine detail, one clear symbol per badge
- Each icon readable at 40 px
- Transparent outside the badges

## Changelog

- r1 (2026-11-01): sheet replaces generating the 8 icons one by one (Timo's request). The single icon prompts stay as fallback; scripts/slice_sheet.py cuts the sheet into their output files.
