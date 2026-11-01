---
asset_id: env_throne_room
name: Throne Room
category: environments
type: background
batch: 03-environment
status: review
revision: 4
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

Game asset for "Lord of Destruction", a browser idle auto-battler. The battlefield background. A large armored dark lord sprite (about 50 percent of the image height tall) is drawn on top, standing on a raised platform on the left; heroes walk across the floor in the middle and on the right.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: wide interior of a dark fantasy throne room. Pillars, torn purple banners and ember braziers line the back wall. On the left side there is a large, empty, raised stone dais for the lord to stand on: a wide, flat, low platform with a plain flat top surface, no throne, no objects on it. No characters, no creatures.

Layout (exact proportions, measured on the 1536x1024 image):
- Back wall from the top down to 45 percent of the image height; the stone floor begins there and fills everything below.
- The dais covers the left 35 percent of the image width, from the left edge to about x = 540.
- Its flat top surface is wide and deep: it starts at the base of the back wall (45 percent height) and its front edge runs roughly horizontally at about 63 percent of the image height (y = 645). The top surface must be clearly visible as a large flat area, big enough for a standing figure.
- Below the front edge, one or two short, wide steps lead down to the floor, ending at about 72 percent height (y = 740).
- The right side of the dais ends in a simple straight side wall facing the open floor.
- The rest of the floor, middle and right, is open and empty.

Palette and contrast: dark, desaturated purples and greys with warm ember light from the braziers. Keep the floor and the dais calm and low in contrast so characters placed on top stand out clearly. Large plain floor tiles, no clutter.

Perspective: seen from the front-side and slightly from above, consistent for wall, dais and floor. Nothing important in the top 10 percent.

Technical: landscape image, 1536x1024, PNG, fully opaque (no transparency). Final asset size 1536x1024.

Reference image assets/characters/lord.png: match its art style exactly (outline weight, shading, palette). Do not draw the lord or a throne into the background.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Landscape 1536x1024
- No characters, no throne, nothing on the dais
- Dais covers the left ~35% with a large flat top surface, front edge at ~63% height
- Steps end at ~72% height; floor begins at ~45% height
- Middle and right floor open and empty
- Dark and low-contrast

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
- r4 (2026-11-01): Timo rejected r3 because the stairs left no room for the Lord. Large flat dais with exact proportions instead of a small stepped platform.
