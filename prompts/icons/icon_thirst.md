---
asset_id: icon_thirst
name: Thirst Icon
category: icons
type: game_icon
batch: 11-tier4-pact-icons-b
status: review
revision: 1
output: assets/icons/thirst.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 256x256
reference_images:
  - assets/characters/lord.png
  - assets/icons/sheets/power-icons.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. Upgrade button icon for "Thirst" (the lash costs less while the Lord is healthy). Shown at 40x40 pixels next to the upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: an empty dark goblet with a single red drop above it.

Composition: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. Must be readable at 40 pixels. Every icon in this set uses the identical badge.

Technical: square image, 1024x1024, PNG with a fully transparent background outside the round badge (real alpha channel). Final asset size 256x256.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Reference image assets/icons/sheets/power-icons.png: an approved sheet from the same icon set. Copy its badge exactly (same plum color, same thin orange rim, same size relative to the symbol) and match its symbol style; do not copy its symbols.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border or frame.

## Acceptance checks

- Round plum badge with soft orange rim, same as in power-icons.png
- Shows an empty dark goblet with a single red drop above it
- No texture, no fine detail
- One clear symbol
- Readable at 40 px
- Transparent outside the badge

## Changelog

- r1 (2026-11-04): first version. Normally produced by sheet_tier4_pact_icons_b; this prompt is the fallback.
