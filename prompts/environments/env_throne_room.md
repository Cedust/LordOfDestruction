---
asset_id: env_throne_room
name: Throne Room
category: environments
type: background
batch: 03-environment
status: review
revision: 6
output: assets/environments/throne-room.png
format: png
transparency: false
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
reference_images:
  - assets/environments/throne-room.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. The battlefield background, shown on a phone in landscape crop above the game menus. The game draws its characters on top of this image later, so the image itself shows an empty hall: a large armored dark lord (about 50 percent of the image height tall) will stand on the floor at the left. Heroes walk across the floor from the right towards him, and later flying heroes will hover in the open air of the hall above the floor.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: wide interior of a tall, vaulted dark fantasy throne hall. Tall pillars, tall narrow windows with a dim dusk glow and ember braziers stand along the back wall. Purple banners hang flat against the back wall only, between the pillars. The floor is one single flat level everywhere: no dais, no platform, no steps, no stairs, no throne. The hall is completely empty: no people, no knights, no lord, no creatures, no statues.

Layout (exact proportions, measured on the 1536x1024 image):
- Top band, from the top edge down to 12 percent of the height (y = 0 to 120): calm and dark, only the shadowy vault of the ceiling. Game numbers are shown over this band.
- Open air, from 12 to 50 percent of the height (y = 120 to 512): the high back wall with its pillars and windows, seen behind a large empty space. Nothing hangs or sticks out into this space: no chandeliers, no hanging banners, no beams across the hall, no ropes.
- Floor: the base of the back wall runs straight across at 50 percent of the height (y = 512). From there the stone floor fills everything down to the bottom edge, across the full width.
- The left quarter of the floor (x = 0 to 380) is where the lord will stand, his feet at about 85 percent height. Keep it plain, open floor like the rest, with nothing on it.
- The whole floor, from the left edge to the right edge, is open and empty with large plain tiles.

Palette and contrast: dark, desaturated purples and greys with warm ember light from the braziers and windows. Keep the floor and the open air calm and low in contrast so characters drawn on top stand out clearly. No clutter anywhere.

Perspective: seen from the front-side and slightly from above, consistent for wall and floor. The floor tiles recede evenly towards the back wall.

Technical: landscape image, 1536x1024, PNG, fully opaque (no transparency). Final asset size 1536x1024.

Reference image assets/environments/throne-room.png: the current background of the same hall. Keep its art style, palette, pillars, banners and braziers; change the layout exactly as described above (taller open hall, flat floor everywhere, no raised dais and no stairs).

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Landscape 1536x1024, opaque
- No characters at all (no lord, no heroes), no throne
- Top ~12% calm and dark
- Open air between ~12% and ~50% height with nothing hanging into it
- Base of the back wall at ~50% height, floor fills the rest across the full width
- Flat floor everywhere: no dais, no steps
- Whole floor open and empty
- Same style and palette as the current throne room

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
- r4 (2026-11-01): Timo rejected r3 because the stairs left no room for the Lord. Large flat dais with exact proportions instead of a small stepped platform.
- r5 (2026-11-04): Mobile UI round (Timo): the dais sat too far back and the Lord nearly left the image. One low step in the bottom-left corner that runs out of the bottom edge, so the Lord stands lower; taller open hall above the floor for flying heroes; calm top band for the HUD; floor right of the step for Near, Mid and Far.
- r6 (2026-11-04): r5 result rejected by Timo: the step running out of the bottom edge looked odd and the Lord stood on its very edge; the image tool also drew the Lord in. Now a flat floor everywhere with no step, the Lord reference removed and an empty hall stated plainly.
