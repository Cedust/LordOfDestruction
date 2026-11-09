---
asset_id: ui_app_icon
name: App Icon
category: ui
type: app_icon
batch: 18-logo
status: ready
revision: 1
output: assets/ui/app-icon.png
format: png
transparency: false
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 1024x1024
reference_images:
  - assets/ui/logo.png
---

## Prompt

App icon for "Lord of Destruction", a browser idle auto-battler in which the player is a dark lord in full plate armor. The icon is shown on phone home screens and as a tiny browser tab icon, so it must read at 32 pixels.

Reference image assets/ui/logo.png: this is the approved game logo. Use its emblem, the Lord's helmet with the gold spiked crown, the two glowing orange eyes, the shoulder plates and the crimson scarf, in exactly the same art style, colors and outline thickness. Leave out the shield and all text.

Art style: clean 2D cartoon game art, same as the reference. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes. Few details. Soft, muted, gently desaturated colors. Light dark-fantasy mood.

Subject: the Lord's head and shoulders seen from the front, centered: closed helmet with a narrow visor slit, two glowing orange eyes, three tall gold crown spikes on top, broad dark plum-grey shoulder plates with thin muted gold trim, and the muted crimson scarf around the neck. Make the shapes bolder and simpler than in the reference so the helmet, the crown and the orange eyes stay recognizable when the icon is very small.

Background: one flat, fully opaque dark purple color (#2a1d3d) filling the whole square, edge to edge, with no rounded corners, no border, no frame, no vignette, no gradient and no glow. The phone rounds or masks the corners itself.

Composition: square. The whole figure, including the crown tips, stays inside the central 75 percent of the image, so nothing important is lost when the corners are cut away by a circle mask. The helmet with its eyes sits slightly above the center and is the largest, clearest shape.

Technical: square image 1024x1024, PNG, fully opaque, no transparency.

Do not include any text, letters, numbers, logo lettering, watermark, signature, border or frame.

## Acceptance checks

- Same style and emblem as the approved logo: gold spiked crown, orange eyes, plum-grey plates, crimson scarf
- No shield, no text
- Flat opaque dark purple background edge to edge, no rounded corners, no frame, no glow
- Whole figure inside the central 75 percent (survives a circle mask)
- Helmet, crown and eyes still recognizable at 32 px
- No texture or grain

## Changelog

- r1 (2026-11-09): first version, derived from the approved-candidate logo.
