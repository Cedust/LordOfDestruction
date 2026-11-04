---
asset_id: sheet_tier4_pact_icons_b
name: Tier 4 Pact Icons Sheet B
category: icons
type: icon_sheet
batch: 11-tier4-pact-icons-b
status: approved
revision: 1
output: assets/icons/sheets/tier4-pact-icons-b.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 4x2
reference_images:
  - assets/characters/lord.png
  - assets/icons/sheets/power-icons.png
produces:
  - icon_mirror_plate
  - icon_crown_of_thorns
  - icon_bloodletting
  - icon_thirst
  - icon_bloodlust
  - icon_twin_lash
  - icon_crimson_tithe
  - icon_sanguine_avatar
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 8 upgrade button icons (skill tree pacts of the Thorns and Blood builds). Each icon is later cut out and shown at 40x40 pixels next to its upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 8 separate icons arranged in a strict grid of 4 columns and 2 rows, read left to right, top to bottom, in this order:
1. a polished dark breastplate with an arrow bouncing off it (Mirror Plate)
2. a dark crown made of black thorns (Crown of Thorns)
3. a curved red whip tip with blood drops (Bloodletting)
4. an empty dark goblet with a single red drop above it (Thirst)
5. a glowing red eye with a fierce look (Bloodlust)
6. two crossed red whips (Twin Lash)
7. a gold coin with a red blood drop on it (Crimson Tithe)
8. a horned dark helmet with glowing red eyes inside a red blood halo (Sanguine Avatar)

Every icon: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. All badges are the same size and identical in shape, color and rim. Each badge sits centered in its own grid cell (about 384 pixels wide) with clear empty space around it; badges never touch or overlap each other or the image edge.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the badges (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Reference image assets/icons/sheets/power-icons.png: an approved sheet from the same icon set. Copy its badge exactly (same plum color, same thin orange rim, same size relative to the symbol) and match its symbol style; do not copy its symbols.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border or frame.

## Acceptance checks

- Exactly 8 badges in a 4x2 grid, none touching
- Order and symbols match the list
- All badges identical: round plum badge with soft orange rim, same as in power-icons.png
- No texture, no fine detail, one clear symbol per badge
- Each icon readable at 40 px
- Transparent outside the badges

## Changelog

- r1 (2026-11-04): first version, for the pacts added with the bigger Dark Pacts tree. The single icon prompts are the fallback; scripts/slice_sheet.py cuts the sheet into their output files.
