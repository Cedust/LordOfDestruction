---
asset_id: ui_gold
name: Gold Icon
category: ui
type: ui_icon
batch: 15-ui-icons
status: review
revision: 1
output: assets/ui/gold.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 128x128
reference_images:
  - assets/characters/lord.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A small interface icon, shown at 18 to 32 pixels next to numbers and on buttons.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree or fine decorations. Soft, muted, gently desaturated colors. Simple, sturdy shapes, slightly stylized. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: A single round gold coin seen from the front, with a simple raised rim and a small skull stamped in its center (Gold).

Composition: one single, solid, bold object with a very simple silhouette, centered and filling most of the image. Thick dark outlines so it stays readable at 18 pixels. No badge or background shape.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel). Final asset size 128x128.

Reference image assets/characters/lord.png: match its outline weight, shading and palette.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- One clear object, no badge
- Readable at 18 px
- Transparent background

## Changelog

- r1 (2026-11-04): first version. Normally cut from sheet_ui_icons; this prompt is the fallback.
