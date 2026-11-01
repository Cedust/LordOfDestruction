# Lord of Destruction

An idle auto-battler for desktop and mobile browsers. You are the Lord of Destruction: you never strike yourself.
Waves of heroes storm your throne room and break against your dark powers. When you fall, you rise again stronger.

- Offline single player, no offline progression (a hidden tab simply pauses)
- Installable as a PWA, saves in the browser (localStorage)

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check and production build into dist/
npm run sim       # headless balance simulation (bot plays several runs)
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/game/config.ts` | All balance numbers: heroes, scaling, upgrades, Dread formula |
| `src/game/stats.ts` | Lord stats from run and prestige levels |
| `src/game/game.ts` | Simulation: waves, combat, powers, falling and rising |
| `src/game/state.ts` | Save format and localStorage |
| `src/render.ts` | Canvas drawing with placeholder shapes |
| `src/ui.ts` | HTML interface: top bar, upgrade lists, fallen screen |
| `scripts/sim.ts` | Balance simulation |

## Art

Images live in `assets/` and are generated from the prompts in `prompts/` (workflow: [prompts/README.md](prompts/README.md), log: `generation-log/manifest.json`). Every PNG under `assets/` is bundled at build time and replaces its placeholder automatically:

- `assets/characters/lord.png`
- `assets/environments/throne-room.png`
- `assets/enemies/squire.png`, `archer.png`, `cutpurse.png`, `battlemage.png`, `champion.png`
- `assets/icons/<upgrade-id>.png`, e.g. `vitality.png`, `bloodPact.png`, `blackHeart.png`

## Deployment

- `main` is published to GitHub Pages by `.github/workflows/deploy.yml` (branch `gh-pages`).
- Every pull request gets a preview at `/pr-preview/pr-<number>/` via `.github/workflows/preview.yml`; the link is posted on the PR and removed when it closes.
- One-time setup: Settings → Pages → Source "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.
