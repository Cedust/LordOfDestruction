// Headless balance check: plays several runs per build with a simple "buy the cheapest" bot
// and prints wave reached, run length, Dread and Sigils. Usage: npm run sim [runs] [build]
import { BUILDS, PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES, type BuildId } from '../src/game/config';
import { Game } from '../src/game/game';
import { newSave } from '../src/game/state';

const runs = Number(process.argv[2] ?? 10);
const only = process.argv[3] as BuildId | undefined;
const DT = 1 / 30;

for (const build of BUILDS.filter((b) => !only || b.id === only)) {
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const save = newSave();
  const game = new Game(save, rng);
  game.chooseBuild(build.id);
  console.log(`== ${build.name}`);
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
          const options = RUN_UPGRADES.filter((u) => game.isRunUpgradeAvailable(u.id) && !game.isRunUpgradeMaxed(u.id)).sort(
            (a, b) => game.runUpgradeCost(a.id) - game.runUpgradeCost(b.id),
          );
          if (options[0] && game.buyRunUpgrade(options[0].id)) bought = true;
        }
      }
    }
    const s = game.lastSummary!;
    const lv = Object.entries(game.run.levels).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(`run ${r + 1}: wave ${s.wave}, ${(t / 60).toFixed(1)} min, Lv ${game.level()} (+${s.levels}), +${s.dread} dread, +${s.sigils} sigils | ${lv}`);
    let bought = true;
    while (bought) {
      bought = false;
      const options = PRESTIGE_UPGRADES.filter((u) => !game.isPrestigeMaxed(u.id) && !(u.id === 'headStart' && save.prestige.headStart >= 1)).sort(
        (a, b) => game.prestigeCost(a.id) - game.prestigeCost(b.id),
      );
      if (options[0] && game.buyPrestige(options[0].id)) bought = true;
    }
    // Pacts: the bot follows its own branch, tier by tier, first pact of each tier first.
    for (const def of PACTS.filter((p) => p.branch === build.id)) game.buyPact(def.id);
    const pacts = Object.entries(save.pacts).filter(([, v]) => v > 0).map(([k]) => k).join(' ');
    console.log(`   pacts: ${pacts} | sigils left ${save.sigils}`);
    game.rise();
  }
}
