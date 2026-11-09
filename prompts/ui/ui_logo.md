---
asset_id: ui_logo
name: Game Logo
category: ui
type: logo
batch: 18-logo
status: ready
revision: 1
output: assets/ui/logo.png
format: png
transparency: true
aspect_ratio: "3:2"
generation_size: 1536x1024
final_size: 1536x1024
reference_images:
  - assets/references/lord_style_reference.png
---

## Prompt

Game logo for "Lord of Destruction", a browser idle auto-battler in which the player is a dark lord in full plate armor who withstands endless waves of heroes. The logo is shown on the title screen and in store-style banners, on a dark purple background.

Reference image assets/references/lord_style_reference.png: use it only for the art style and for the design of the Lord's helmet. Keep its thick dark outlines, flat muted colors and simple shapes. Do not copy the full figure.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape and every letter. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no filigree, no engravings, no ornate patterns. Soft, muted, gently desaturated colors. Light dark-fantasy mood, bold and readable rather than grim or realistic.

Layout: a centered emblem above a two-line wordmark.
- Emblem: the Lord's closed helmet from the reference, seen from the front: narrow visor slit with two small glowing orange eyes, and a few tall spikes forming a crown on top. Behind the helmet, a simple broad shield-like plate shape in dark plum-grey with a thin muted gold rim. The emblem is compact and about as wide as the word "DESTRUCTION".
- Wordmark, exactly this text and nothing else: small first line "LORD OF", large second line "DESTRUCTION". All capital letters, spelled exactly L-O-R-D O-F D-E-S-T-R-U-C-T-I-O-N. Chunky, heavy, slightly angular display letters with sharp straight cuts, like letters cut from iron plates, all letters the same height within a line and perfectly legible. "DESTRUCTION" is filled in muted crimson red with a darker crimson lower half, a thin muted gold inner edge and a thick dark outline. "LORD OF" is smaller, in bone-white with a thick dark outline, centered above "DESTRUCTION".
- A few small, simple cracks running out from under the bottom edge of "DESTRUCTION", in dark plum-grey, as a hint of destruction. No fire, no smoke, no sparks, no blood splatter.

Palette (soft and muted): dark plum-grey, muted crimson red, bone-white, thin muted gold trim, small orange accent for the eyes only. No bright saturated colors, no neon, no glow effects except the eyes, no gradients other than the single shadow tone.

Composition: the whole logo (emblem plus wordmark) is centered and fills about 80 percent of the image width, with an even transparent margin on all sides. Nothing touches or crosses the image edges. Wide landscape image.

Technical: landscape image 1536x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white, black or colored backdrop). The text must stay readable when the logo is shown about 320 pixels wide on a phone.

Do not include any text besides "LORD OF" and "DESTRUCTION": no subtitle, no slogan, no letters in the emblem, no numbers, no watermark, no signature, no border or frame.

## Acceptance checks

- Text reads exactly "LORD OF" and "DESTRUCTION", correctly spelled, no extra text
- Letters are clearly legible at 320 px logo width
- Same style as the reference: thick dark outlines, flat muted colors, no texture
- Emblem shows the Lord's closed spiked helmet with orange eyes, no face or skin
- Crimson "DESTRUCTION", bone-white "LORD OF", gold only as thin trim
- No fire, smoke, glow or ornate filigree
- Nothing cropped, even margin around the logo
- Real transparency outside the logo
- Reads clearly against a dark purple background

## Changelog

- r1 (2026-11-09): first version.
