// Balance report: plays a long series of runs like a person would and measures how a run feels.
// A "visit" happens every `every` seconds: the bot buys Max on the cheapest power until nothing
// is affordable (each buy is one tap). It prestiges when the record is no longer moving.
// Usage: npm run balance [hours] [build] [every]
import { BUILDS, PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES, type BuildId } from '../src/game/config';
import { Game } from '../src/game/game';
import { blockShare } from '../src/game/stats';
import { newSave, type SaveData } from '../src/game/state';
import { ITEMS, SLOTS } from '../src/game/gear';

const hoursTotal = Number(process.argv[2] ?? 10);
const only = (process.argv[3] || undefined) as BuildId | undefined;
const every = Number(process.argv[4] ?? 5);
const OTHER_BUILDS: Record<BuildId, string[]> = { aura: ['barbs', 'sanguine'], thorns: ['gloom', 'sanguine'], blood: ['gloom', 'barbs'] };
const DT = 1 / 20;

function makeRng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function shop(game: Game): number {
  let taps = 0;
  for (let guard = 0; guard < 200; guard++) {
    const options = RUN_UPGRADES.filter((u) => game.isRunUpgradeAvailable(u.id) && !game.isRunUpgradeMaxed(u.id))
      .map((u) => ({ id: u.id, cost: game.runUpgradeCost(u.id) }))
      .filter((o) => o.cost <= game.run.gold)
      .sort((a, b) => a.cost - b.cost);
    if (!options[0]) break;
    if (game.buyRunUpgradeBulk(options[0].id, Infinity) > 0) taps++;
    else break;
  }
  return taps;
}

/** Seconds and waves the Lord lasts from the start of this wave without buying anything. */
function idleTolerance(save: SaveData, seed: number): { secs: number; waves: number } {
  const g = new Game(structuredClone(save), makeRng(seed));
  const w0 = g.run.wave;
  let t = 0;
  while (g.phase !== 'fallen' && t < 600) {
    g.update(DT);
    t += DT;
  }
  return { secs: t, waves: g.run.wave - w0 };
}

function spendBetweenRuns(game: Game, save: SaveData, build: BuildId) {
  let bought = true;
  while (bought) {
    bought = false;
    const options = PRESTIGE_UPGRADES.filter(
      (u) => !game.isPrestigeMaxed(u.id) && !OTHER_BUILDS[build].includes(u.id),
    ).sort((a, b) => game.prestigeCost(a.id) - game.prestigeCost(b.id));
    if (options[0] && game.buyPrestige(options[0].id)) bought = true;
  }
  while (game.forge());
  for (const slot of SLOTS) {
    const owned = ITEMS.filter((i) => i.slot === slot.id && save.gear.owned[i.id]);
    owned.sort((a, b) => Number(b.set === build) - Number(a.set === build) || save.gear.owned[b.id] - save.gear.owned[a.id]);
    if (owned[0]) game.equip(owned[0].id);
  }
  bought = true;
  while (bought) {
    bought = false;
    const open = PACTS.filter((p) => p.branch === build && !game.isPactMaxed(p.id) && !game.isPactLocked(p.id)).sort(
      (a, b) => game.pactCost(a.id) - game.pactCost(b.id),
    );
    if (open[0] && game.buyPact(open[0].id)) bought = true;
  }
}

for (const build of BUILDS.filter((b) => !only || b.id === only)) {
  const save = newSave();
  const rng = makeRng(42);
  const game = new Game(save, rng);
  console.log(`== ${build.name} (visit every ${every} s)`);
  let total = 0;
  let r = 0;
  const marks = [1, 2, 3, 5, 8, 12, 16, 20, 30, 40, 50, 60, 80, 100].filter((h) => h <= hoursTotal);
  let nextMark = 0;
  while (total < hoursTotal * 3600) {
    r++;
    let t = 0;
    let visit = every; // a player buys right when a run starts
    let taps = 0;
    let lastRecordT = 0;
    let lastWave = game.run.wave;
    const best = save.bestWave;
    const waveTimes: number[] = [];
    let waveStart = 0;
    let minHpShare = 1;
    let dangerWaves = 0;
    let cleanWaves = 0;
    const tail: string[] = [];
    let hpSum = 0;
    let hurtWave = 0;
    let hurtT = 0;
    let slowWave = 0;
    let slowT = 0;
    let idle: string[] = [];
    const idleAt = [0.5, 0.8, 0.95].map((f) => Math.max(2, Math.floor(best * f)));
    // First run has no record: just play it out. Later runs prestige once 60 s pass without a new wave beyond the record pace.
    while (game.phase !== 'fallen' && t < 7200) {
      game.update(DT);
      t += DT;
      visit += DT;
      minHpShare = Math.min(minHpShare, game.run.lordHp / game.stats.maxHp);
      if (game.run.wave !== lastWave) {
        waveTimes.push(t - waveStart);
        tail.push(`w${game.run.wave - 1}:${(t - waveStart).toFixed(0)}s/${Math.round(minHpShare * 100)}%`);
        waveStart = t;
        if (minHpShare < 0.5) dangerWaves++;
        if (minHpShare > 0.999) cleanWaves++;
        hpSum += minHpShare;
        if (!hurtWave && minHpShare < 0.9) { hurtWave = game.run.wave - 1; hurtT = t; }
        if (!slowWave && waveTimes[waveTimes.length - 1] > 5) { slowWave = game.run.wave - 1; slowT = t; }
        minHpShare = 1;
        lastWave = game.run.wave;
        lastRecordT = t;
        if (best > 10 && idleAt.includes(game.run.wave) && game.phase === 'pause') {
          const it = idleTolerance(game.snapshotSave(), r * 7 + game.run.wave);
          idle.push(`w${game.run.wave}:${Math.round(it.secs)}s/${it.waves}w`);
        }
      }
      if (visit >= every) {
        visit = 0;
        taps += shop(game);
      }
      // Stuck: a wave takes longer than 40 s -> prestige (like a player who sees the wall).
      const last5 = waveTimes.slice(-5);
      const slow = last5.length === 5 && last5.reduce((a, b) => a + b, 0) / 5 > 20 && game.run.wave > best;
      if (t - lastRecordT > 40 || slow || t > 3600) game.prestige();
    }
    const s = game.lastSummary!;
    total += t;
    const shown = r <= 3 || (nextMark < marks.length && total >= marks[nextMark] * 3600);
    if (shown) {
      while (nextMark < marks.length && total >= marks[nextMark] * 3600) nextMark++;
      const half = waveTimes.slice(0, Math.floor(waveTimes.length / 2));
      const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
      console.log(
        `[${(total / 3600).toFixed(1)} h] run ${r}: wave ${s.wave} (best ${best}), ${(t / 60).toFixed(1)} min, ${s.manual ? 'prestige' : 'fell'} | ` +
          `taps ${taps} (${(taps / (t / 60)).toFixed(1)}/min) | wave s: 1st half ${avg(half).toFixed(1)}, all ${avg(waveTimes).toFixed(1)} | danger ${dangerWaves} untouched ${Math.round((100 * cleanWaves) / Math.max(1, waveTimes.length))}% avgLow ${Math.round((100 * hpSum) / Math.max(1, waveTimes.length))}% | zone: slow@${slowWave} hurt@${hurtWave} -> end ${s.wave} (${Math.round(t - (slowT || t))}s/${Math.round(t - (hurtT || t))}s) | idle ${idle.join(' ')} | Lv ${game.level()} (+${s.levels})`,
      );
      if (process.env.TAIL) console.log('     last: ' + tail.slice(-10).join(' ') + ` | died w${s.wave}: ` + game.heroes.map((h) => `${h.kind}(dmg ${Math.round(h.damage)}, hp ${Math.round((100 * h.hp) / h.maxHp)}%)`).join(',') + ` | maxHp ${Math.round(game.stats.maxHp)} regen ${Math.round(game.stats.regen)} block ${(blockShare(game.stats.armor, s.wave) * 100).toFixed(1)}%`);
      const lv = Object.entries(game.run.levels).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
      console.log(`     powers ${lv} | gear ${Object.keys(save.gear.owned).length}/36 | sigils spent ${game.sigilsSpent()}`);
    }
    spendBetweenRuns(game, save, build.id);
    game.rise();
  }
}
