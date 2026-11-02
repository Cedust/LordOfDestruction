// Headless balance check: plays several runs with a simple "buy the cheapest" bot
// and prints wave reached, run length and Dread earned. Usage: npm run sim
import { PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES } from '../src/game/config';
import { Game } from '../src/game/game';
import { newSave } from '../src/game/state';

let seed = 42;
const rng = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const save = newSave();
const game = new Game(save, rng);
const DT = 1 / 30;
const runs = Number(process.argv[2] ?? 8);

for (let r = 0; r < runs; r++) {
  let t = 0;
  let shopTimer = 0;
  while (game.phase !== 'fallen' && t < 3600) {
    game.update(DT);
    t += DT;
    shopTimer += DT;
    if (shopTimer > 0.5) {
      shopTimer = 0;
      let bought = true;
      while (bought) {
        bought = false;
        const options = RUN_UPGRADES.filter((u) => !game.isRunUpgradeMaxed(u.id)).sort(
          (a, b) => game.runUpgradeCost(a.id) - game.runUpgradeCost(b.id),
        );
        const pick = options[0];
        if (pick && game.buyRunUpgrade(pick.id)) bought = true;
      }
    }
  }
  const s = game.lastSummary!;
  const lv = Object.entries(game.run.levels).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`run ${r + 1}: wave ${s.wave}, ${(t / 60).toFixed(1)} min, +${s.dread} dread | ${lv}`);
  if (game.run.secondWinds) console.log(`   second wind used ${game.run.secondWinds}x`);
  // Spend Dread on the cheapest prestige upgrade.
  let bought = true;
  while (bought) {
    bought = false;
    const options = PRESTIGE_UPGRADES.filter((u) => !game.isPrestigeMaxed(u.id) && !(u.id === 'headStart' && save.prestige.headStart >= 1)).sort(
      (a, b) => game.prestigeCost(a.id) - game.prestigeCost(b.id),
    );
    if (options[0] && game.buyPrestige(options[0].id)) bought = true;
  }
  // Spend Sigils on the first pact that can be taken, branch by branch.
  for (const def of PACTS) while (game.buyPact(def.id));
  console.log('   prestige:', JSON.stringify(save.prestige), 'dread left', save.dread);
  console.log('   pacts:', Object.entries(save.pacts).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' '), 'sigils left', save.sigils);
  game.rise();
}
