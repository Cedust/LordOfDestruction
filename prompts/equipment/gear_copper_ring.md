---
asset_id: gear_copper_ring
name: Copper Ring Icon
category: equipment
type: equipment_icon
batch: 14-gear-icons-c
status: review
revision: 1
output: assets/equipment/copperRing.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 256x256
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. Equipment item icon for "Copper Ring", a piece of gear the Lord can wear. Shown at 32 to 40 pixels inside an inventory slot.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: a simple copper ring.

Composition: one single, solid object, seen from the front or slightly from the side, centered and filling most of the image. No loose sparks, particles or floating parts.

Technical: square image, 1024x1024, PNG with a fully transparent background outside the item (real alpha channel). Final asset size 256x256.

Reference image assets/characters/lord.png: the Lord who wears this gear. Match its outline weight, shading and dark iron, purple and ember palette.

Do not include any text, letters, numbers, labels, logos, watermark, signature, border, frame, badge, background shape or shadow on the ground.

## Acceptance checks

- Shows a simple copper ring
- One clear object, no badge or background shape
- No texture, no fine detail, no loose particles
- Readable at 32 px
- Transparent outside the item

## Changelog

- r1 (2026-11-04): first version. Normally produced by sheet_gear_icons_c; this prompt is the fallback.
