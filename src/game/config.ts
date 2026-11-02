// All balance numbers live here so they can be tuned in one place.

export type RangeId = 'near' | 'mid' | 'far';

export interface RangeDef {
  id: RangeId;
  name: string;
  /** Distance from the lord where heroes of this range stand. */
  dist: number;
  /** Outer edge of the range; the aura covers everything up to this edge. */
  edge: number;
  /** Fixed spots, as angles around the lord. */
  slots: number[];
}

/** Three fixed ranges. Order matters: index 0 is closest to the lord. */
export const RANGES: RangeDef[] = [
  { id: 'near', name: 'Near', dist: 62, edge: 96, slots: [-0.24, 0.53, 1.3, 2.07] },
  { id: 'mid', name: 'Mid', dist: 132, edge: 166, slots: [0.09, 0.83, 1.57] },
  { id: 'far', name: 'Far', dist: 202, edge: 236, slots: [0.04, 0.48, 0.92] },
];

/** Heroes without a free spot wait this far behind their range. */
export const QUEUE_GAP = 30;

export function rangeIndex(id: RangeId): number {
  return RANGES.findIndex((r) => r.id === id);
}

export type HeroKind = 'squire' | 'archer' | 'cutpurse' | 'battlemage' | 'champion';

export interface HeroDef {
  name: string;
  hp: number;
  damage: number;
  /** Seconds between attacks. */
  attackInterval: number;
  /** Walk speed in world units per second. */
  speed: number;
  /** The range the hero fights from. */
  range: RangeId;
  gold: number;
  /** First wave in which this hero can appear. */
  fromWave: number;
  /** Relative chance to be picked for a wave slot. */
  weight: number;
  ranged: boolean;
  color: string;
  radius: number;
}

export const HEROES: Record<HeroKind, HeroDef> = {
  squire: { name: 'Squire', hp: 20, damage: 3, attackInterval: 1.2, speed: 70, range: 'near', gold: 6, fromWave: 1, weight: 5, ranged: false, color: '#7f9cc7', radius: 13 },
  archer: { name: 'Archer', hp: 13, damage: 2.4, attackInterval: 1.5, speed: 60, range: 'mid', gold: 8, fromWave: 3, weight: 3, ranged: true, color: '#7fb07a', radius: 12 },
  cutpurse: { name: 'Cutpurse', hp: 10, damage: 3.6, attackInterval: 0.7, speed: 110, range: 'near', gold: 10, fromWave: 6, weight: 2, ranged: false, color: '#c9a35b', radius: 11 },
  battlemage: { name: 'Battlemage', hp: 12, damage: 6, attackInterval: 2.6, speed: 55, range: 'far', gold: 12, fromWave: 8, weight: 1.5, ranged: true, color: '#6fc3d8', radius: 12 },
  champion: { name: 'Champion', hp: 180, damage: 7, attackInterval: 1.4, speed: 45, range: 'near', gold: 120, fromWave: 10, weight: 0, ranged: false, color: '#f1c75b', radius: 20 },
};

export const CHAMPION_EVERY = 10;
export const CHAMPION_AURA_REDUCTION = 0.75; // shield blocks a quarter of aura damage

export const SCALE = {
  hp: 1.16,
  damage: 1.12,
  gold: 1.12,
};

export const WORLD_W = 420;
export const WORLD_H = 300;
export const LORD_X = 64;
export const LORD_Y = 190;
/** Vertical squash of the floor plane, so the battlefield reads as seen from the side. */
export const DEPTH = 0.5;
/** Where the floor of the throne room begins; floor markings are not drawn above it. */
export const FLOOR_Y = 166;
/** Height of the Lord's chest above LORD_Y, where projectiles hit and numbers pop. */
export const LORD_CHEST = 55;
export const SPAWN_DIST = 330;
export const WAVE_PAUSE = 1.2; // seconds between waves

export function heroCountForWave(wave: number): number {
  return Math.min(6, 1 + Math.floor(wave / 3));
}

// ---------------------------------------------------------------------------
// Builds. Each run plays one or more builds; a build's start pact unlocks its powers.

export type BuildId = 'aura' | 'thorns' | 'blood';

export interface BuildDef {
  id: BuildId;
  name: string;
  /** The tree branch's tagline. */
  desc: string;
  color: string;
}

export const BUILDS: BuildDef[] = [
  { id: 'aura', name: 'Aura', desc: 'Damage over time', color: '#b07cff' },
  { id: 'thorns', name: 'Thorns', desc: 'Strike back', color: '#ff9b4a' },
  { id: 'blood', name: 'Blood', desc: 'Trade life for kills', color: '#e0566e' },
];

// ---------------------------------------------------------------------------
// Run powers (bought with gold, reset each run)

export type RunUpgradeId =
  | 'vitality'
  | 'hide'
  | 'regen'
  | 'bloodPact'
  | 'shockwave'
  | 'aura'
  | 'thorns'
  | 'lash';

export interface RunUpgradeDef {
  id: RunUpgradeId;
  name: string;
  desc: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
  /** Only offered while this build's start pact is owned. */
  build?: BuildId;
}

export const RUN_UPGRADES: RunUpgradeDef[] = [
  { id: 'aura', name: 'Dread Aura', desc: 'Every hero in the hall takes damage over time.', baseCost: 8, costGrowth: 1.15, build: 'aura' },
  { id: 'thorns', name: 'Thorns', desc: 'Every hero that hits you gets hurt in return.', baseCost: 8, costGrowth: 1.15, build: 'thorns' },
  { id: 'lash', name: 'Blood Lash', desc: 'You pay with your own life to strike down the weakest hero.', baseCost: 8, costGrowth: 1.15, build: 'blood' },
  { id: 'vitality', name: 'Vitality', desc: 'You can take more damage before you fall.', baseCost: 8, costGrowth: 1.15 },
  { id: 'hide', name: 'Hide', desc: 'Every hit against you hurts a little less.', baseCost: 15, costGrowth: 1.2, maxLevel: 40 },
  { id: 'regen', name: 'Regeneration', desc: 'You slowly heal over time.', baseCost: 10, costGrowth: 1.16 },
  { id: 'bloodPact', name: 'Blood Pact', desc: 'You heal a little whenever a hero dies.', baseCost: 45, costGrowth: 1.28, maxLevel: 10 },
  { id: 'shockwave', name: 'Shockwave', desc: 'Every few hits you take, a shockwave hurts all heroes close to you.', baseCost: 60, costGrowth: 1.18 },
];

export const SHOCKWAVE_HITS = 10;
/** Shockwave reaches Near and Mid. */
export const SHOCKWAVE_REACH = 1;

/** Blood Lash: seconds between lashes, base share of max life dealt, share of current life paid. */
export const LASH_INTERVAL = 2;
export const LASH_SHARE = 0.1;
export const LASH_COST = 0.03;

export function runUpgradeCost(def: RunUpgradeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

// ---------------------------------------------------------------------------
// Prestige. Falling ends the run and pays two currencies:
// - Dread, by the wave reached, buys levelled permanent upgrades (numbers only).
// - Sigils, one at the start and one for every 10 waves of a new record, buy the
//   "Dark Pacts" skill tree, which changes the rules of a build.

export type PrestigeId =
  | 'blackHeart'
  | 'malice'
  | 'gloom'
  | 'barbs'
  | 'sanguine'
  | 'tremor'
  | 'tithe'
  | 'avarice'
  | 'dreadHarvest'
  | 'headStart';

export interface PrestigeDef {
  id: PrestigeId;
  name: string;
  desc: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
}

export const PRESTIGE_UPGRADES: PrestigeDef[] = [
  { id: 'blackHeart', name: 'Black Heart', desc: 'You start every run with more life and heal faster.', baseCost: 2, costGrowth: 1.5 },
  { id: 'malice', name: 'Malice', desc: 'All your damage gets stronger.', baseCost: 3, costGrowth: 1.5 },
  { id: 'gloom', name: 'Gloom', desc: 'Your aura deals more damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'barbs', name: 'Barbs', desc: 'Your thorns deal more damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'sanguine', name: 'Sanguine', desc: 'Your Blood Lash deals more damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'tremor', name: 'Tremor', desc: 'Your shockwave deals more damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'tithe', name: 'Tithe', desc: 'Heroes drop more gold.', baseCost: 3, costGrowth: 1.6 },
  { id: 'avarice', name: 'Avarice', desc: 'Powers cost less gold.', baseCost: 4, costGrowth: 1.8, maxLevel: 10 },
  { id: 'dreadHarvest', name: 'Dread Harvest', desc: 'You gain more Dread each time you fall.', baseCost: 5, costGrowth: 1.7 },
  { id: 'headStart', name: 'Head Start', desc: 'New runs skip the first waves and start with gold.', baseCost: 6, costGrowth: 2.2, maxLevel: 10 },
];

export function prestigeCost(def: PrestigeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

export function dreadForWave(bestWave: number): number {
  return Math.floor(Math.pow(bestWave / 4, 1.6));
}

/** One Sigil for every 10 waves of a new record. */
export const SIGIL_WAVES = 10;
/** Sigils a new game starts with, for the start pact. */
export const START_SIGILS = 1;

export function sigilsForRecord(oldBest: number, newBest: number): number {
  return Math.max(0, Math.floor(newBest / SIGIL_WAVES) - Math.floor(oldBest / SIGIL_WAVES));
}

export type PactId =
  | 'pactAura'
  | 'withering'
  | 'grasp'
  | 'longShadow'
  | 'doom'
  | 'despair'
  | 'innerSanctum'
  | 'blackSun'
  | 'pactThorns'
  | 'splinter'
  | 'thornBurst'
  | 'spikedHide'
  | 'retaliation'
  | 'ironMaiden'
  | 'pactBlood'
  | 'chain'
  | 'execute'
  | 'frenzy'
  | 'transfusion'
  | 'bloodMoon';

export interface PactDef {
  id: PactId;
  name: string;
  desc: string;
  /** The rule in plain numbers, shown small under the description. */
  effect: string;
  branch: BuildId;
  /** Tier in the branch: 1 = start pact, 5 = capstone. */
  tier: number;
  /** Owning any one of these unlocks the pact. */
  requires?: PactId[];
  /** Sigils. */
  cost: number;
  /** Icon file under assets/icons/, when it differs from the id. */
  icon?: string;
}

const AURA2: PactId[] = ['withering', 'grasp', 'longShadow'];
const AURA3: PactId[] = ['doom', 'despair', 'innerSanctum'];
const THORNS2: PactId[] = ['splinter', 'thornBurst'];
const THORNS3: PactId[] = ['spikedHide', 'retaliation'];
const BLOOD2: PactId[] = ['chain', 'execute'];
const BLOOD3: PactId[] = ['frenzy', 'transfusion'];

/** Listed branch by branch, each from start pact to capstone. */
export const PACTS: PactDef[] = [
  { id: 'pactAura', name: 'Dread Aura', desc: 'Every hero in the hall takes damage over time.', effect: 'Unlocks Dread Aura', branch: 'aura', tier: 1, cost: 1, icon: 'aura' },
  { id: 'withering', name: 'Withering', desc: 'Heroes in your aura hit you softer.', effect: '−25% hero damage in the aura', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1 },
  { id: 'grasp', name: 'Grasp', desc: 'Heroes in your aura attack less often.', effect: 'Heroes in the aura attack 30% slower', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1 },
  { id: 'longShadow', name: 'Long Shadow', desc: 'Your aura hurts heroes far away more.', effect: '+60% aura damage on distant heroes', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1, icon: 'radius' },
  { id: 'doom', name: 'Doom', desc: 'The longer a hero stays in your aura, the more it hurts.', effect: '+25% aura damage per second inside, up to ×3', branch: 'aura', tier: 3, requires: AURA2, cost: 2 },
  { id: 'despair', name: 'Despair', desc: 'Badly hurt heroes take extra aura damage.', effect: '×2 aura damage below 30% life', branch: 'aura', tier: 3, requires: AURA2, cost: 2, icon: 'wrath' },
  { id: 'innerSanctum', name: 'Inner Sanctum', desc: 'Your aura hurts heroes right next to you much more.', effect: '×2 aura damage on the closest heroes', branch: 'aura', tier: 3, requires: AURA2, cost: 2 },
  { id: 'blackSun', name: 'Black Sun', desc: 'Every few seconds your aura bursts and hits everyone at once.', effect: 'Every 8 s: 3 s of aura damage at once', branch: 'aura', tier: 5, requires: AURA3, cost: 3 },

  { id: 'pactThorns', name: 'Thorns', desc: 'Every hero that hits you gets hurt in return.', effect: 'Unlocks Thorns', branch: 'thorns', tier: 1, cost: 1, icon: 'thorns' },
  { id: 'splinter', name: 'Splinter', desc: 'Your thorns also hurt the hero standing next to the attacker.', effect: 'Each strike also hits the nearest hero for 50%', branch: 'thorns', tier: 2, requires: ['pactThorns'], cost: 1 },
  { id: 'thornBurst', name: 'Thorn Burst', desc: 'Heroes killed by your thorns explode and hurt those around them.', effect: 'Spikes hit nearby heroes for 15% of the slain hero\'s life', branch: 'thorns', tier: 2, requires: ['pactThorns'], cost: 1, icon: 'corpseBurst' },
  { id: 'spikedHide', name: 'Spiked Hide', desc: 'The better your armor, the harder your thorns hit.', effect: 'Blocked damage is thrown back ×3', branch: 'thorns', tier: 3, requires: THORNS2, cost: 2 },
  { id: 'retaliation', name: 'Retaliation', desc: 'Every few hits, your thorns strike back much harder.', effect: 'Every 5th hit is thrown back ×3', branch: 'thorns', tier: 3, requires: THORNS2, cost: 2 },
  { id: 'ironMaiden', name: 'Iron Maiden', desc: 'When you are badly hurt, your thorns hit much harder.', effect: '×3 thorns below 50% life', branch: 'thorns', tier: 5, requires: THORNS3, cost: 3 },

  { id: 'pactBlood', name: 'Blood Lash', desc: 'You pay with your own life to strike down the weakest hero.', effect: 'Unlocks Blood Lash', branch: 'blood', tier: 1, cost: 1, icon: 'lash' },
  { id: 'chain', name: 'Chain', desc: 'When your lash kills, it jumps on to the next weakest hero.', effect: 'Leftover damage jumps to the next weakest hero', branch: 'blood', tier: 2, requires: ['pactBlood'], cost: 1 },
  { id: 'execute', name: 'Execute', desc: 'Your lash instantly kills heroes that are almost dead.', effect: 'Heroes below 15% life die to a lash', branch: 'blood', tier: 2, requires: ['pactBlood'], cost: 1 },
  { id: 'frenzy', name: 'Frenzy', desc: 'The lower your life, the faster you lash.', effect: 'Up to ×2.5 lash speed at low life', branch: 'blood', tier: 3, requires: BLOOD2, cost: 2 },
  { id: 'transfusion', name: 'Transfusion', desc: 'When your lash kills, you get more life back than it cost.', effect: 'A killing lash returns twice its cost', branch: 'blood', tier: 3, requires: BLOOD2, cost: 2 },
  { id: 'bloodMoon', name: 'Blood Moon', desc: 'Healing beyond your full life turns into a shield.', effect: 'Overheal becomes a shield, up to 50% of your life', branch: 'blood', tier: 5, requires: BLOOD3, cost: 3 },
];

export const START_PACTS: Record<BuildId, PactId> = { aura: 'pactAura', thorns: 'pactThorns', blood: 'pactBlood' };

/** Tuning numbers for the pacts. */
export const WITHERING = 0.25;
export const LONG_SHADOW = 1.6;
export const INNER_SANCTUM = 2;
export const GRASP = 1.3;
export const DOOM_PER_SECOND = 0.25;
export const DOOM_MAX = 3;
export const DESPAIR_BELOW = 0.3;
export const BLACK_SUN_EVERY = 8;
export const BLACK_SUN_SECONDS = 3;
export const SPLINTER_SHARE = 0.5;
export const THORN_BURST_SHARE = 0.15;
export const THORN_BURST_RADIUS = 60;
export const SPIKED_HIDE_MULT = 3;
export const RETALIATION_EVERY = 5;
export const RETALIATION_MULT = 3;
export const IRON_MAIDEN_BELOW = 0.5;
export const IRON_MAIDEN_MULT = 3;
export const EXECUTE_BELOW = 0.15;
export const FRENZY_MAX = 2.5;
export const TRANSFUSION_MULT = 2;
export const BLOOD_MOON_SHIELD = 0.5;
export const DREAD_HARVEST_PER_LEVEL = 0.1;
export const AVARICE_PER_LEVEL = 0.05;
