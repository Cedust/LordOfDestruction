---
asset_id: sheet_ui_icons
name: UI Icons Sheet
category: ui
type: icon_sheet
batch: 15-ui-icons
status: ready
revision: 1
output: assets/ui/sheets/ui-icons.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 3x2
reference_images:
  - assets/characters/lord.png
  - assets/icons/malice.png
produces:
  - ui_settings
  - ui_gold
  - ui_dread
  - ui_sigil
  - ui_spoils
  - ui_lock
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 6 small interface icons: a settings button, four currency symbols and a lock. Each icon is later cut out and shown very small, at 18 to 32 pixels, next to numbers in the game's top bar, on buttons and on tabs.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 6 separate icons arranged in a strict grid of 3 columns and 2 rows, read left to right, top to bottom, in this order:
1. a dark iron cog wheel with six chunky teeth and a round hole in the middle (Settings)
2. a single round gold coin seen from the front, with a simple raised rim and a small skull stamped in its center (Gold)
3. a pale bone skull wreathed in soft purple flame (Dread)
4. a glowing teal four-pointed star rune carved from stone, with a soft teal glow (Sigil)
5. a chunky dark iron ingot with a glowing ember-orange crack across its top (Spoils)
6. a heavy dark iron padlock with a simple round body and thick shackle (Locked)

Every icon: one single, solid, bold object with a very simple silhouette, seen from the front, centered in its own grid cell (about 512 pixels wide and 512 pixels tall) and filling most of it. Thick dark outlines so it stays readable at 18 pixels. No badge, no circle or background shape behind the object. Icons never touch or overlap each other or the image edge. No loose sparks, particles or floating parts. All icons are drawn at a similar size and in the same style, so they look like one set.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the icons (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and dark iron, purple and ember palette.

Reference image assets/icons/malice.png: an upgrade icon of the same game. Match its outline weight and color softness, but draw no badge behind these icons.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border, frame, badge, background shape or shadow on the ground.

## Acceptance checks

- Exactly 6 icons in a 3x2 grid, none touching
- Order and objects match the list
- No badge or background shape, transparent outside the icons
- Simple silhouettes, readable at 18 px
- Same outline weight and palette as the Lord

## Changelog

- r1 (2026-11-04): first version for the mobile UI round (Timo: generate the settings cog, gold and the other currency icons).
