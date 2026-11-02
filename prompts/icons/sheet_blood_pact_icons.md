---
asset_id: sheet_blood_pact_icons
name: Blood Pact Icons Sheet
category: icons
type: icon_sheet
batch: 08-blood-pact-icons
status: review
revision: 1
output: assets/icons/sheets/blood-pact-icons.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 3x2
reference_images:
  - assets/characters/lord.png
  - assets/icons/sheets/power-icons.png
produces:
  - icon_chain
  - icon_execute
  - icon_frenzy
  - icon_transfusion
  - icon_blood_moon
  - icon_sanguine
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 6 upgrade button icons (skill tree pacts of the Blood build, plus one permanent upgrade). Each icon is later cut out and shown at 40x40 pixels next to its upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 6 separate icons arranged in a strict grid of 3 columns and 2 rows, read left to right, top to bottom, in this order:
1. a crimson lash arcing in two jumps between three red drops (Chain)
2. a crimson executioner's axe (Execute)
3. a pair of glowing red angry eyes with motion streaks (Frenzy)
4. a red blood drop inside two circling arrows (Transfusion)
5. a crimson full moon behind a pale round shield (Blood Moon)
6. a sharp fang dripping a single red drop (Sanguine)

Every icon: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. All badges are the same size and identical in shape, color and rim. Each badge sits centered in its own grid cell (about 512 pixels wide) with clear empty space around it; badges never touch or overlap each other or the image edge.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the badges (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Reference image assets/icons/sheets/power-icons.png: an approved sheet from the same icon set. Copy its badge exactly (same plum color, same thin orange rim, same size relative to the symbol) and match its symbol style; do not copy its symbols.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border or frame.

## Acceptance checks

- Exactly 6 badges in a 3x2 grid, none touching
- Order and symbols match the list
- All badges identical: round plum badge with soft orange rim, same as in power-icons.png
- No texture, no fine detail, one clear symbol per badge
- Each icon readable at 40 px
- Transparent outside the badges

## Changelog

- r1 (2026-11-02): first version, for the pacts and upgrades added with the prestige builds. The single icon prompts are the fallback; scripts/slice_sheet.py cuts the sheet into their output files.
