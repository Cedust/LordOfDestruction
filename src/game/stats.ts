import { HIDE_ARMOR, HIDE_K, SCALE, SHOCKWAVE_DAMAGE, AVARICE_PER_LEVEL, DREAD_HARVEST_PER_LEVEL, DREAD_GROWTH, LASH_SHARE, MILESTONE_EVERY, MILESTONE_MULT, PACTS, pactValue, type BuildId, type PrestigeId, type RunUpgradeId } from './config';
import { gearMult, setMult, type GearState } from './gear';
import type { PactLevels, PrestigeLevels, RunLevels } from './state';

export interface LordStats {
  maxHp: number;
  /** Armor rating from Hide; see `blockShare` for the share it blocks in a wave. */
  armor: number;
  regen: number;
  /** Aura damage per second in Near, Mid and Far (0 where there is none). */
  auraDps: number[];
  /** Index of the farthest range the aura covers, -1 without an aura. */
  auraReach: number;
  /** Share of each hit thrown back at the attacker; 0 without the Thorns build. */
  thorns: number;
  /** Blood Lash damage as a share of max life; 0 without the Blood build. */
  lash: number;
  /** Damage of the Shockwave, the basic attack that hits every hero. */
  shockwave: number;
  /** Share of max HP healed per kill. */
  bloodPact: number;
  goldMult: number;
  xpMult: number;
  spoilsMult: number;
  /** Multiplier on the gold price of powers. */
  costMult: number;
  builds: Record<BuildId, boolean>;
}

/** Levels a build power counts with: the start pact gives the first level for free. */
export function powerLevel(id: RunUpgradeId, run: RunLevels, owned: boolean): number {
  return owned ? run[id] + 1 : run[id];
}

function grow(level: number, linear: number, exp: number): number {
  return (1 + linear * (level - 1)) * Math.pow(exp, level - 1);
}

/** Milestones: every few levels a power's effect is multiplied once more. */
export function milestoneMult(level: number): number {
  return Math.pow(MILESTONE_MULT, Math.floor(level / MILESTONE_EVERY));
}

/** Multiplier a Dread upgrade gives at a level: grows a little faster with every level. */
export function dreadMult(id: PrestigeId, level: number): number {
  const g = DREAD_GROWTH[id];
  if (!g) return 1;
  return (1 + g.linear * level) * Math.pow(g.exp, level);
}

const pv = (pacts: PactLevels, id: keyof PactLevels) => pactValue(PACTS.find((p) => p.id === id)!, pacts[id]);

/** Compute the lord's current stats from run levels, Dread upgrades, pacts and worn gear. */
export function computeStats(run: RunLevels, p: PrestigeLevels, pacts: PactLevels, gear?: GearState): LordStats {
  const builds = { aura: pacts.pactAura > 0, thorns: pacts.pactThorns > 0, blood: pacts.pactBlood > 0 };
  const malice = dreadMult('malice', p.malice) * gearMult(gear, 'damage');
  const heart = dreadMult('blackHeart', p.blackHeart);
  const life = heart * gearMult(gear, 'life');
  const auraLvl = powerLevel('aura', run, builds.aura);
  const auraBase = auraLvl > 0 ? 13 * grow(auraLvl, 0.4, 1.18) * milestoneMult(auraLvl) * malice * dreadMult('gloom', p.gloom) * setMult(gear, 'aura') : 0;
  const shadow = 1 + pv(pacts, 'longShadow');
  const sanctum = pacts.innerSanctum > 0 ? pv(pacts, 'innerSanctum') : 1;
  const aura = [auraBase * sanctum, auraBase * shadow, auraBase * shadow];
  const thornLvl = powerLevel('thorns', run, builds.thorns);
  const lashLvl = powerLevel('lash', run, builds.blood);
  const waveLvl = run.shockwave + 1;
  let reach = -1;
  aura.forEach((d, i) => {
    if (d > 0) reach = i;
  });
  return {
    maxHp: 100 * (1 + 0.22 * run.vitality) * Math.pow(1.05, run.vitality) * milestoneMult(run.vitality) * life,
    armor: run.hide > 0 ? HIDE_ARMOR * grow(run.hide, 0.3, 1.09) * milestoneMult(run.hide) : 0,
    regen: (run.regen > 0 ? 1 + 0.8 * run.regen : 0) * Math.pow(1.05, run.regen) * milestoneMult(run.regen) * heart * gearMult(gear, 'regen'),
    auraDps: aura,
    auraReach: reach,
    thorns: thornLvl > 0 ? 1.5 * grow(thornLvl, 0.3, 1.0) * milestoneMult(thornLvl) * malice * dreadMult('barbs', p.barbs) * setMult(gear, 'thorns') : 0,
    lash: lashLvl > 0 ? LASH_SHARE * grow(lashLvl, 0.3, 1.08) * milestoneMult(lashLvl) * malice * dreadMult('sanguine', p.sanguine) * setMult(gear, 'blood') : 0,
    shockwave: SHOCKWAVE_DAMAGE * grow(waveLvl, 0.3, 1.18) * milestoneMult(waveLvl) * malice * dreadMult('tremor', p.tremor) * gearMult(gear, 'shockwave'),
    bloodPact: 0.02 * run.bloodPact,
    goldMult: dreadMult('tithe', p.tithe) * gearMult(gear, 'gold'),
    xpMult: (1 + DREAD_HARVEST_PER_LEVEL * p.dreadHarvest) * gearMult(gear, 'xp'),
    spoilsMult: gearMult(gear, 'spoils'),
    costMult: 1 - AVARICE_PER_LEVEL * p.avarice,
    builds,
  };
}

/** How much harder heroes hit in this wave than in wave 1. */
export function heroStrength(wave: number): number {
  return Math.pow(SCALE.damage, wave - 1);
}

/** Share of each hit that Hide blocks in this wave: armor / (armor + K × hero strength). */
export function blockShare(armor: number, wave: number): number {
  return armor <= 0 ? 0 : armor / (armor + HIDE_K * heroStrength(wave));
}
