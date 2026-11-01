// Game art lives in the repo-level assets/ folder (see prompts/README.md for the workflow).
// Vite picks up every PNG there at build time, so a missing file simply means the game
// keeps drawing its placeholder shape.
// assets/references/ holds style references for image generation only and is not shipped.
const files = import.meta.glob<string>(['/assets/**/*.png', '!/assets/references/**'], { eager: true, import: 'default', query: '?url' });

/** URL of an asset like 'enemies/squire', or undefined when the image does not exist yet. */
export function assetUrl(path: string): string | undefined {
  return files[`/assets/${path}.png`];
}
