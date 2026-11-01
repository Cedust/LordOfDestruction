---
asset_id: enemy_battlemage
name: Battlemage
category: enemies
type: character_sprite
batch: 02-heroes
status: draft
revision: 1
output: assets/enemies/battlemage.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 512x512
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. An enemy hero (Battlemage) who walks in from the right and attacks the dark lord standing on the left of the battlefield.

Art style: stylized 2D cartoon game art with a hand-painted look. Flat colors with soft cel shading, clean bold dark outlines of even weight, chunky readable proportions with a slightly oversized head and hands, simple shapes and few small details, light dark-fantasy mood that stays playful rather than grim or realistic.

Subject: a young battlemage hero in long robes conjuring a crackling frost orb above an open spellbook held in one hand, determined look.

Palette: icy cyan and blue robes, white frost glow. Heroes use brighter, warmer colors than the dark lord so they stand out against the dark throne room background.

Composition: exactly one character, full body, side view, facing and moving toward the left side of the image. Leave a small even margin around the figure and place the feet close to the bottom edge of the image, because the game stands the image on the floor by its bottom edge. No floor, no ground plane, no cast shadow, no props outside the character's hands.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white or colored backdrop). Final asset size 512x512; the silhouette must stay clear when shown at about 60 pixels tall on a phone.

Reference image assets/characters/lord.png: match its art style exactly (same outline weight, shading, level of detail and proportions). Use it only for style; do not copy the lord's character, colors or throne.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Faces left
- Full body, feet near the bottom edge
- Real transparency
- Same style as lord.png
- Main colors: icy cyan and blue robes, white frost glow

## Changelog

- r1 (2026-11-01): first version.
