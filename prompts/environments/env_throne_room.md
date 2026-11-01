---
asset_id: env_throne_room
name: Throne Room
category: environments
type: background
batch: 03-environment
status: review
revision: 3
output: assets/environments/throne-room.png
format: png
transparency: false
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. The battlefield background. The game shows it in a wide landscape frame (about 7:5) and anchors it to the bottom edge, so a little of the top may be cropped. The dark lord sprite is drawn on top at the left, heroes on the floor in the middle and right.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: wide interior of a dark fantasy throne room. Flat stone floor fills the lower 55 percent of the image. An empty raised stone platform sits on the far left (no throne; the throne is a separate sprite). Pillars, torn purple banners and ember braziers line the back wall. No characters, no creatures.

Palette and contrast: dark, desaturated purples and greys with warm ember light from the braziers. Keep it low in contrast and calm so characters placed on top stand out clearly.

Composition and perspective: seen from the side and slightly from above, horizon of the floor at about 45 percent of the image height. Open, empty floor in the middle and on the right side. Nothing important in the top 10 percent.

Technical: landscape image, 1536x1024, PNG, fully opaque (no transparency). Final asset size 1536x1024.

Reference image assets/characters/lord.png: match its art style exactly (outline weight, shading, palette). Do not draw the lord or his throne into the background.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Landscape 1536x1024
- No characters, no throne
- Empty platform on the far left
- Floor covers lower ~55%
- Dark and low-contrast

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
