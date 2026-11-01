---
asset_id: enemy_champion
name: Champion
category: enemies
type: character_sprite
batch: 02-heroes
status: draft
revision: 3
output: assets/enemies/champion.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 768x768
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. An enemy hero (Champion) who walks in from the right and attacks the dark lord standing on the left of the battlefield.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: a heroic paladin champion in shining plate armor carrying a large tower shield and a longsword, broad shoulders, proud upright stance, red plume on the helmet; clearly bigger, heavier and more imposing than a regular hero. No glowing aura and no healing light around him.

Palette: gold and white armor, red accents. Heroes use brighter, warmer colors than the dark lord so they stand out against the dark throne room background.

Composition: exactly one character, full body, side view, facing and moving toward the left side of the image. Leave a small even margin around the figure and place the feet close to the bottom edge of the image, because the game stands the image on the floor by its bottom edge. No floor, no ground plane, no cast shadow, no props outside the character's hands.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white or colored backdrop). Final asset size 768x768; the silhouette must stay clear when shown at about 60 pixels tall on a phone.

Reference image assets/characters/lord.png: match its art style exactly (same outline weight, shading, level of detail and proportions). Use it only for style; do not copy the lord's character, colors or throne.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Faces left
- Full body, feet near the bottom edge
- Real transparency
- Same style as lord.png
- Main colors: gold and white armor, red accents

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
