---
asset_id: sheet_pact_icons_a
name: Pact Icons Sheet A
category: icons
type: icon_sheet
batch: 06-pact-icons
status: ready
revision: 1
output: assets/icons/sheets/pact-icons-a.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
grid: 3x2
reference_images:
  - assets/characters/lord.png
produces:
  - icon_barbs
  - icon_creeping_dread
  - icon_withering
  - icon_doom
  - icon_echo
  - icon_vengeance
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A sheet of 6 upgrade button icons (pacts of the "Dark Pacts" skill tree and permanent upgrades). Each icon is later cut out and shown at 40x40 pixels next to its upgrade name.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: exactly 6 separate icons arranged in a strict grid of 3 columns and 2 rows, read left to right, top to bottom, in this order:
1. a curling dark vine covered in sharp purple barbs (Barbs)
2. purple mist spreading outward in two wide rings from a small glowing core (Creeping Dread)
3. a drooping, wilted sword with a cracked blade and purple wisps around it (Withering)
4. a purple skull inside a ring of glowing tick marks, like a clock face (Doom)
5. a gauntleted fist striking the ground, sending out three stacked purple shockwave arcs (Echo)
6. a round skull-shaped bomb with a lit orange fuse (Vengeance)

Every icon: one bold, simple symbol centered on a round dusty plum-purple badge with a thin soft orange rim. The symbol fills most of its badge and uses thick dark outlines. All badges are the same size and identical in shape, color and rim. Each badge sits centered in its own grid cell (about 512 pixels wide) with clear empty space around it; badges never touch or overlap each other or the image edge.

Technical: landscape image, 1536x1024, PNG with a fully transparent background everywhere outside the badges (real alpha channel). No grid lines, no cell borders, no background panel.

Reference image assets/characters/lord.png: match its outline weight, shading and purple/ember palette.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Exactly 6 badges in a 3x2 grid, none touching
- Order and symbols match the list
- All badges identical: round plum badge with soft orange rim
- No texture, no fine detail, one clear symbol per badge
- Each icon readable at 40 px
- Transparent outside the badges

## Changelog

- r1 (2026-11-02): first version, icons for the Dark Pacts skill tree (Timo: Dread plus Sigils).
