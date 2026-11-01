---
asset_id: char_lord
name: Lord of Destruction
category: characters
type: character_sprite
batch: 01-style-anchor
status: ready
revision: 3
output: assets/characters/lord.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024
final_size: 1024x1024
reference_images: []
---

## Prompt

Game asset for "Lord of Destruction", a browser idle auto-battler. The player character. He sits on the left side of the battlefield and never moves; heroes attack him from the right. This image also defines the art style for every other asset in the game.

Art style: clean, simple 2D cartoon game art like a modern casual mobile game. Large flat color areas with at most one soft shadow tone per color and no extra highlights. Thick, smooth, uniform dark outlines. Smooth surfaces: no texture, no grain, no noise, no visible brush strokes, no hatching, no cracks or scratches. Very few details: no ornaments, engravings, patterns, filigree, chains, jewelry, fur or embroidery. Soft, muted, gently desaturated colors with low contrast inside the figure; the clearest contrast is between the figure and its outline. Chunky cute-but-tough proportions: big head (about a third of the body height), short sturdy body, oversized hands. Light dark-fantasy mood that stays friendly and playful, never grim or realistic.

Subject: a dark lord in full plate armor so that no face or skin is visible, seated on a simple chunky throne built from a few large smooth dark stone blocks with three tall pointed spikes on the backrest. A closed helmet with two big curved horns and a narrow visor slit; inside the slit, two glowing orange eyes are the only bright point of the figure. The armor is made of a few big rounded plates with large simple shapes: broad shoulder plates each with one short spike, plain chest plate, chunky gauntlets and boots. A plain deep purple cape without any pattern. Relaxed, confident, slightly smug pose, leaning back with one hand resting on the armrest. The throne is part of the image.

Palette (soft and muted): dark plum-grey armor, dusty plum purple cape, warm charcoal grey throne, and one small ember-orange accent for the eyes only. No gold, no lava, no glowing cracks, no red, no bright heroic colors. Avoid many spikes, scales, engravings or layered armor pieces.

Composition: exactly one character, full body, three-quarter view, body and face turned toward the right side of the image. Leave a small even margin around the figure and place the feet close to the bottom edge of the image, because the game stands the image on the floor by its bottom edge. No floor, no ground plane, no cast shadow, no props outside the character's hands.

Technical: square image, 1024x1024, PNG with a fully transparent background (real alpha channel, not a painted checkerboard and not a white or colored backdrop). Final asset size 1024x1024; the silhouette must stay clear when shown at about 120 pixels tall on a phone.

Do not include any text, letters, numbers, logos, watermark, signature, border or frame.

## Acceptance checks

- Lord and throne fully visible, nothing cropped
- Looks to the right
- Full armor and closed helmet, no visible face or skin
- No texture or grain, no ornaments or patterns, only a few spikes
- Reads clearly at 120 px tall
- Real transparency outside the figure
- Soft muted plum, charcoal and bone palette; orange only in the eyes
- Reads clearly at small size

## Changelog

- r1 (2026-11-01): first version.
- r2 (2026-11-01): calmer, more readable style after Timo rejected the first Lord: no texture, far fewer details, softer muted colors.
- r3 (2026-11-01): Lord in full armor with a closed horned helmet and glowing eyes instead of a visible face (Timo's idea).
