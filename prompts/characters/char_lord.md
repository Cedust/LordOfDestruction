---
asset_id: char_lord
name: Lord of Destruction
category: characters
type: character_sprite
batch: 01-style-anchor
status: approved
revision: 4
output: assets/characters/lord.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 1024x1024
reference_images:
  - assets/references/lord_style_reference.png
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. The player character: a dark lord who stands on the left side of the battlefield and never moves; heroes attack him from the right. This image also defines the art style for every other asset in the game.

Reference image assets/references/lord_style_reference.png: follow it closely for art style, character design, proportions, pose and level of detail. Keep its thick dark outlines, flat muted colors, simple armor shapes and calm standing pose. Only change what this prompt describes differently.

Art style: clean 2D cartoon game art. Thick, smooth, dark outlines around every shape. Flat color areas with at most one soft shadow tone per color. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no scratches. Few details: no engravings, patterns, filigree, chains, jewelry or fur. Soft, muted, gently desaturated colors. Light dark-fantasy mood, clear and readable rather than grim or realistic.

Subject: a dark lord in full plate armor, standing upright with no throne. No face or skin is visible. Closed helmet with a narrow visor slit and a few tall spikes forming a crown on top; inside the visor slit, two small glowing orange eyes. Armor made of a few large plates: broad shoulder plates, plain chest plate, armored skirt, chunky gauntlets and boots, with thin muted gold trim along the plate edges only. A long cape in muted crimson red that hangs behind him and ends in a few large, simple tattered points, plus a short crimson sash falling from the belt. One gauntlet rests on the pommel of a large greatsword whose tip touches the ground beside him; the other arm hangs relaxed. Calm, confident, imposing stance.

Palette (soft and muted): dark plum-grey armor, muted crimson red cape and sash, thin muted gold trim, small orange accent for the eyes only. No purple cape, no bright saturated colors, no glowing effects except the eyes.

Composition: exactly one character, full body, three-quarter view with body and helmet turned toward the right side of the image. Leave a small even margin around the figure and place the feet close to the bottom edge of the image, because the game stands the image on the floor by its bottom edge. No throne, no floor, no ground plane, no cast shadow, no other objects besides the sword.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white or colored backdrop). Final asset size 1024x1024; the silhouette must stay clear when shown at about 120 pixels tall on a phone.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Standing, full body, nothing cropped, no throne
- Same style as the reference image: thick dark outlines, flat muted colors
- Turned toward the right
- Full armor and closed helmet, no visible face or skin
- Muted crimson cape, gold only as thin trim
- No texture or grain, no ornaments or patterns
- Reads clearly at 120 px tall against a dark purple background
- Real transparency outside the figure

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): Lord in full armor with a closed horned helmet and glowing eyes instead of a visible face (Timo's idea).
- r4 (2026-11-01): standing without throne, muted crimson cape instead of purple (purple blends into the purple floor and aura), style reference assets/references/lord_style_reference.png chosen by Timo from the r3 candidates.
