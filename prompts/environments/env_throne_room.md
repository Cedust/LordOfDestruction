---
asset_id: env_throne_room
name: Throne Room
category: environments
type: background
batch: 03-environment
status: ready
revision: 5
output: assets/environments/throne-room.png
format: png
transparency: false
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
reference_images:
  - assets/environments/throne-room.png
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. The battlefield background, shown on a phone in landscape crop above the game menus. A large armored dark lord sprite (about 50 percent of the image height tall) is drawn on top, standing low in the bottom-left corner. Heroes walk across the floor from the right towards him, and later flying heroes will hover in the open air of the hall above the floor.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Simple, sturdy shapes with natural heroic proportions, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: wide interior of a tall, vaulted dark fantasy throne hall. Tall pillars, tall narrow windows with a dim dusk glow and ember braziers stand along the back wall. Purple banners hang flat against the back wall only, between the pillars. In the bottom-left corner there is one single, low, wide stone step for the lord to stand on: no throne, no stairs, no objects on it. No characters, no creatures.

Layout (exact proportions, measured on the 1536x1024 image):
- Top band, from the top edge down to 12 percent of the height (y = 0 to 120): calm and dark, only the shadowy vault of the ceiling. Game numbers are shown over this band.
- Open air, from 12 to 50 percent of the height (y = 120 to 512): the high back wall with its pillars and windows, seen behind a large empty space. Nothing hangs or sticks out into this space: no chandeliers, no hanging banners, no beams across the hall, no ropes.
- Floor: the base of the back wall runs straight across at 50 percent of the height (y = 512). From there the stone floor fills everything down to the bottom edge, across the full width.
- The low step: a flat stone slab covering the bottom-left corner. Its top surface reaches from the left edge to about 22 percent of the width (x = 340) and from the floor's back edge at about 56 percent height down past the bottom edge, so it runs out of the image at the bottom. Only its right side is visible as one single low step face, running diagonally from about (x = 340, y = 575) down to about (x = 420, y = 1024). Its top surface is plain and flat.
- Everything right of the step, from about x = 420 to the right edge, is open, empty floor with large plain tiles.

Palette and contrast: dark, desaturated purples and greys with warm ember light from the braziers and windows. Keep the floor, the step and the open air calm and low in contrast so characters drawn on top stand out clearly. No clutter anywhere.

Perspective: seen from the front-side and slightly from above, consistent for wall, step and floor. The floor tiles recede evenly towards the back wall.

Technical: landscape image, 1536x1024, PNG, fully opaque (no transparency). Final asset size 1536x1024.

Reference image assets/environments/throne-room.png: the current background of the same hall. Keep its art style, palette, pillars, banners and braziers; change the layout exactly as described above (taller open hall, low single step in the corner instead of the raised dais and stairs).

Reference image assets/characters/lord.png: match its art style exactly (outline weight, shading, palette). Do not draw the lord or a throne into the background.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Landscape 1536x1024, opaque
- No characters, no throne, nothing on the step
- Top ~12% calm and dark
- Open air between ~12% and ~50% height with nothing hanging into it
- Base of the back wall at ~50% height, floor fills the rest across the full width
- One single low step in the bottom-left corner, top surface to ~22% width, running out of the bottom edge, step face only on its right
- Floor right of ~27% width open and empty
- Same style and palette as the current throne room

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): style paragraph aligned with the Lord style reference (thick outlines, natural proportions instead of a big head).
- r4 (2026-11-01): Timo rejected r3 because the stairs left no room for the Lord. Large flat dais with exact proportions instead of a small stepped platform.
- r5 (2026-11-04): Mobile UI round (Timo): the dais sat too far back and the Lord nearly left the image. One low step in the bottom-left corner that runs out of the bottom edge, so the Lord stands lower; taller open hall above the floor for flying heroes; calm top band for the HUD; floor right of the step for Near, Mid and Far.
