---
asset_id: ui_slot_shoulders
name: Shoulders Slot Icon
category: ui
type: ui_icon
batch: 16-slot-icons
status: ready
revision: 2
output: assets/ui/slots/shoulders.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 128x128
reference_images: []
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. A neutral outline symbol for an empty equipment slot, shown dimmed at 34 to 40 pixels.

Art style: clean, simple 2D game interface symbols with crisp, sharp edges. Each symbol is one flat, solid silhouette in a single light grey-lilac color (#b9aecb), surrounded by a thin, sharp, darker purple outline (#3a2d4b). No gradients, no shading, no glow, no blur, no soft edges, no texture, no inner details except a few essential lines that make the shape readable. Simple, sturdy, slightly stylized dark-fantasy shapes, like the empty slot markers of an inventory screen.

Subject: A pair of rounded shoulder plates seen from the front, side by side (Shoulders).

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel), not a colored or blurred surface. Final asset size 128x128.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Flat light grey-lilac silhouette, sharp edges
- Readable at 34 px
- Transparent

## Changelog

- r1 (2026-11-04): first version. Normally cut from sheet_slot_icons; this prompt is the fallback.
- r2 (2026-11-04): r1 result rejected: blurry blobs on an opaque lilac surface. Now flat sharp silhouettes with a thin dark outline instead of outline-only lines, and a stricter transparency line.
