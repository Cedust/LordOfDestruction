# Lord of Destruction

An idle auto-battler for desktop and mobile browsers. You are the Lord of Destruction: you never strike yourself.
Waves of heroes storm your throne room and break against your dark powers. When you fall, you rise again stronger.

Every game starts with one Sigil for a **start pact** that picks a build: **Aura** (steady damage in Near, Mid and Far), **Thorns** (every hit you take strikes back) or **Blood** (Blood Lash executes the weakest hero, paid with your life). Falling ends the run and pays two currencies: **Dread** (by the wave reached) buys permanent upgrades that only raise numbers, and **Sigils** (one for every 10 waves of a new record) buy pacts in the **Dark Pacts** skill tree, which change the rules of a build. The tree can be reset between runs for a full refund.

- Offline single player, no offline progression (a hidden tab simply pauses)
- Installable as a PWA, saves in the browser (localStorage)

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check and production build into dist/
npm run sim       # headless balance simulation (bot plays several runs)
npm run balance   # play-like report: npm run balance [hours] [build] [seconds between visits]
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/game/config.ts` | All balance numbers: heroes, scaling, upgrades, Dread and Sigil formulas, the pact tree |
| `src/game/stats.ts` | Lord stats from run and prestige levels |
| `src/game/game.ts` | Simulation: waves, combat, powers, falling and rising |
| `src/game/state.ts` | Save format and localStorage |
| `src/render.ts` | Canvas drawing of the game art |
| `src/ui.ts` | HTML interface: top bar, upgrade lists, fallen screen |
| `src/tree.ts` | Dark Pacts skill tree view |
| `scripts/sim.ts` | Balance simulation |
| `scripts/balance.ts` | Balance report: taps per minute, wave speed, idle tolerance, long-term record curve |

## Art

Images live in `assets/` and are generated from the prompts in `prompts/` (workflow: [prompts/README.md](prompts/README.md), log: `generation-log/manifest.json`). Every PNG under `assets/` is bundled at build time:

- `assets/characters/lord.png`
- `assets/environments/throne-room.png`
- `assets/enemies/squire.png`, `archer.png`, `cutpurse.png`, `battlemage.png`, `champion.png`
- `assets/icons/<upgrade-id>.png`, e.g. `vitality.png`, `bloodPact.png`, `blackHeart.png`

## Deployment

- `main` is published to GitHub Pages by `.github/workflows/deploy.yml` (branch `gh-pages`).
- Every pull request gets a preview at `/pr-preview/pr-<number>/` via `.github/workflows/preview.yml`; the link is posted on the PR and removed when it closes.
- One-time setup: Settings → Pages → Source "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.
