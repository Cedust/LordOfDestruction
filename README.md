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

Drop PNG files into `public/assets/` and they replace the placeholder shapes automatically:

`lord.png`, `throne-room.png`, `squire.png`, `archer.png`, `cutpurse.png`, `cleric.png`, `champion.png`

Upgrade icons go into `public/assets/icons/`, named after the upgrade id:
`vitality.png`, `hide.png`, `regen.png`, `aura.png`, `radius.png`, `thorns.png`, `shockwave.png`, `bloodPact.png`.
