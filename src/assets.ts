// Game art lives in the repo-level assets/ folder (see prompts/README.md for the workflow).
// Vite picks up every PNG there at build time.
// assets/references/ (style references) and */sheets/ (uncut icon sheets) are for the
// image workflow only and are not shipped.
const files = import.meta.glob<string>(['/assets/**/*.png', '!/assets/references/**', '!/assets/**/sheets/**'], { eager: true, import: 'default', query: '?url' });

/** URL of an asset like 'enemies/squire', or undefined when the image does not exist yet. */
export function assetUrl(path: string): string | undefined {
  return files[`/assets/${path}.png`];
}
