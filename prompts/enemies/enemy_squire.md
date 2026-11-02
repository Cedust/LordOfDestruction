---
asset_id: enemy_squire
name: Squire
category: enemies
type: character_sprite
batch: 02-heroes
status: approved
revision: 3
output: assets/enemies/squire.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 512x512
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. An enemy hero (Squire) who walks in from the right and attacks the dark lord standing on the left of the battlefield.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: a young squire hero holding a round wooden shield and a short sword, brave but visibly nervous, wearing a helmet that is slightly too big, walking forward.

Palette: steel blue tunic, brown leather, silver metal. Heroes use brighter, warmer colors than the dark lord so they stand out against the dark throne room background.

Composition: exactly one character, full body, side view, facing and moving toward the left side of the image. Leave a small even margin around the figure and place the feet close to the bottom edge of the image, because the game stands the image on the floor by its bottom edge. No floor, no ground plane, no cast shadow, no props outside the character's hands.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white or colored backdrop). Final asset size 512x512; the silhouette must stay clear when shown at about 60 pixels tall on a phone.

Reference image assets/characters/lord.png: match its art style exactly (same outline weight, shading, level of detail and proportions). Use it only for style; do not copy the lord's character, colors or throne.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Faces left
- Full body, feet near the bottom edge
- Real transparency
- Same style as lord.png
- Main colors: steel blue tunic, brown leather, silver metal

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
