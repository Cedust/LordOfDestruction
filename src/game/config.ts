// All balance numbers live here so they can be tuned in one place.

export type RangeId = 'near' | 'mid' | 'far';

export interface RangeDef {
  id: RangeId;
  name: string;
  /** Distance from the lord where heroes of this range stand. */
  dist: number;
  /** Outer edge of the range; the aura covers everything up to this edge. */
  edge: number;
  /** Fixed spots as lanes from the top (0) to the bottom (1) of the floor. */
  slots: number[];
}

/** Three fixed ranges. Order matters: index 0 is closest to the lord. */
export const RANGES: RangeDef[] = [
  { id: 'near', name: 'Near', dist: 62, edge: 96, slots: [0, 0.33, 0.67, 1] },
  { id: 'mid', name: 'Mid', dist: 132, edge: 166, slots: [0.17, 0.5, 0.83] },
  { id: 'far', name: 'Far', dist: 202, edge: 236, slots: [0.17, 0.5, 0.83] },
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
/**
 * Ranges are strips on the floor, from left to right, starting in front of the dais
 * stairs. Their borders follow the perspective of the floor tiles in throne-room.png:
 * straight lines that meet in a vanishing point (FIELD_VP_X, FIELD_VP_Y) above the hall.
 * A hero's distance is measured along the row FIELD_REF_Y (FIELD_X + dist * FIELD_SCALE there); its lane
 * is how far down it stands between FIELD_TOP and FIELD_BOTTOM.
 */
export const FIELD_X = 128;
export const FIELD_TOP = 160;
export const FIELD_BOTTOM = 282;
export const FIELD_REF_Y = 282;
/** Stretches the strips so Far ends near the right edge of the screen. */
export const FIELD_SCALE = 1.2;
export const FIELD_VP_X = 225;
export const FIELD_VP_Y = 2;

/** World x of the line `dist` from the field's left border, at height y. */
export function fieldX(dist: number, y: number): number {
  return FIELD_VP_X + (FIELD_X + dist * FIELD_SCALE - FIELD_VP_X) * ((y - FIELD_VP_Y) / (FIELD_REF_Y - FIELD_VP_Y));
}

/**
 * Where a distance is drawn. All three strips are drawn equally wide, whatever their
 * game distances; each range's standing distance lands in the middle of its strip and
 * everything in between is interpolated. Beyond Far the distance is drawn unchanged.
 */
export function drawnDist(dist: number): number {
  const total = RANGES[RANGES.length - 1].edge;
  const w = total / RANGES.length;
  let inner = 0;
  for (let i = 0; i < RANGES.length; i++) {
    const r = RANGES[i];
    const x0 = i * w;
    if (dist <= r.dist) return x0 + ((dist - inner) / (r.dist - inner)) * (w / 2);
    if (dist <= r.edge) return x0 + w / 2 + ((dist - r.dist) / (r.edge - r.dist)) * (w / 2);
    inner = r.edge;
  }
  return dist;
}

export function fieldPos(dist: number, lane: number): { x: number; y: number } {
  const l = Math.min(1, Math.max(0, lane));
  const y = FIELD_TOP + l * (FIELD_BOTTOM - FIELD_TOP);
  return { x: fieldX(drawnDist(dist), y), y };
}

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
  { id: 'aura', name: 'Aura', desc: 'Damage Over Time', color: '#b07cff' },
  { id: 'thorns', name: 'Thorns', desc: 'Strike Back', color: '#ff9b4a' },
  { id: 'blood', name: 'Blood', desc: 'Trade Life for Kills', color: '#e0566e' },
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
  { id: 'aura', name: 'Dread Aura', desc: 'Every Hero in the Hall Takes Damage Over Time.', baseCost: 8, costGrowth: 1.15, build: 'aura' },
  { id: 'thorns', name: 'Thorns', desc: 'Every Hero That Hits You Gets Hurt in Return.', baseCost: 8, costGrowth: 1.15, build: 'thorns' },
  { id: 'lash', name: 'Blood Lash', desc: 'You Pay with Your Own Life to Strike Down the Weakest Hero.', baseCost: 8, costGrowth: 1.15, build: 'blood' },
  { id: 'vitality', name: 'Vitality', desc: 'You Can Take More Damage Before You Fall.', baseCost: 8, costGrowth: 1.15 },
  { id: 'hide', name: 'Hide', desc: 'Every Hit Against You Hurts a Little Less.', baseCost: 15, costGrowth: 1.2, maxLevel: 40 },
  { id: 'regen', name: 'Regeneration', desc: 'You Slowly Heal Over Time.', baseCost: 10, costGrowth: 1.16 },
  { id: 'bloodPact', name: 'Blood Pact', desc: 'You Heal a Little Whenever a Hero Dies.', baseCost: 45, costGrowth: 1.28, maxLevel: 10 },
  { id: 'shockwave', name: 'Shockwave', desc: 'Every Few Hits You Take, a Shockwave Hurts Every Hero in the Hall.', baseCost: 60, costGrowth: 1.18 },
];

export const SHOCKWAVE_HITS = 10;
/** Shockwave reaches every range. */
export const SHOCKWAVE_REACH = 2;

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
  { id: 'blackHeart', name: 'Black Heart', desc: 'You Start Every Run with More Life and Heal Faster.', baseCost: 2, costGrowth: 1.5 },
  { id: 'malice', name: 'Malice', desc: 'All Your Damage Gets Stronger.', baseCost: 3, costGrowth: 1.5 },
  { id: 'gloom', name: 'Gloom', desc: 'Your Aura Deals More Damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'barbs', name: 'Barbs', desc: 'Your Thorns Deal More Damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'sanguine', name: 'Sanguine', desc: 'Your Blood Lash Deals More Damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'tremor', name: 'Tremor', desc: 'Your Shockwave Deals More Damage.', baseCost: 2, costGrowth: 1.5 },
  { id: 'tithe', name: 'Tithe', desc: 'Heroes Drop More Gold.', baseCost: 3, costGrowth: 1.6 },
  { id: 'avarice', name: 'Avarice', desc: 'Powers Cost Less Gold.', baseCost: 4, costGrowth: 1.8, maxLevel: 10 },
  { id: 'dreadHarvest', name: 'Dread Harvest', desc: 'You Gain More Dread Each Time You Fall.', baseCost: 5, costGrowth: 1.7 },
  { id: 'headStart', name: 'Head Start', desc: 'New Runs Skip the First Waves and Start with Gold.', baseCost: 6, costGrowth: 2.2, maxLevel: 10 },
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
  /** Stand-in icon under assets/icons/, used until assets/icons/<id>.png exists. */
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
  { id: 'pactAura', name: 'Dread Aura', desc: 'Every Hero in the Hall Takes Damage Over Time.', effect: 'Unlocks Dread Aura', branch: 'aura', tier: 1, cost: 1, icon: 'aura' },
  { id: 'withering', name: 'Withering', desc: 'Heroes in Your Aura Hit You Softer.', effect: '−25% Hero Damage in the Aura', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1 },
  { id: 'grasp', name: 'Grasp', desc: 'Heroes in Your Aura Attack Less Often.', effect: 'Heroes in the Aura Attack 30% Slower', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1 },
  { id: 'longShadow', name: 'Long Shadow', desc: 'Your Aura Hurts Heroes Far Away More.', effect: '+60% Aura Damage on Distant Heroes', branch: 'aura', tier: 2, requires: ['pactAura'], cost: 1, icon: 'radius' },
  { id: 'doom', name: 'Doom', desc: 'The Longer a Hero Stays in Your Aura, the More It Hurts.', effect: '+25% Aura Damage per Second Inside, Up to ×3', branch: 'aura', tier: 3, requires: AURA2, cost: 2 },
  { id: 'despair', name: 'Despair', desc: 'Badly Hurt Heroes Take Extra Aura Damage.', effect: '×2 Aura Damage Below 30% Life', branch: 'aura', tier: 3, requires: AURA2, cost: 2, icon: 'wrath' },
  { id: 'innerSanctum', name: 'Inner Sanctum', desc: 'Your Aura Hurts Heroes Right Next to You Much More.', effect: '×2 Aura Damage on the Closest Heroes', branch: 'aura', tier: 3, requires: AURA2, cost: 2 },
  { id: 'blackSun', name: 'Black Sun', desc: 'Every Few Seconds Your Aura Bursts and Hits Everyone at Once.', effect: 'Every 8 s: 3 s of Aura Damage at Once', branch: 'aura', tier: 5, requires: AURA3, cost: 3 },

  { id: 'pactThorns', name: 'Thorns', desc: 'Every Hero That Hits You Gets Hurt in Return.', effect: 'Unlocks Thorns', branch: 'thorns', tier: 1, cost: 1, icon: 'thorns' },
  { id: 'splinter', name: 'Splinter', desc: 'Your Thorns Also Hurt the Hero Standing Next to the Attacker.', effect: 'Each Strike Also Hits the Nearest Hero for 50%', branch: 'thorns', tier: 2, requires: ['pactThorns'], cost: 1 },
  { id: 'thornBurst', name: 'Thorn Burst', desc: 'Heroes Killed by Your Thorns Explode and Hurt Those Around Them.', effect: 'Spikes Hit Nearby Heroes for 15% of the Slain Hero\'s Life', branch: 'thorns', tier: 2, requires: ['pactThorns'], cost: 1, icon: 'corpseBurst' },
  { id: 'spikedHide', name: 'Spiked Hide', desc: 'The Better Your Armor, the Harder Your Thorns Hit.', effect: 'Blocked Damage Is Thrown Back ×3', branch: 'thorns', tier: 3, requires: THORNS2, cost: 2 },
  { id: 'retaliation', name: 'Retaliation', desc: 'Every Few Hits, Your Thorns Strike Back Much Harder.', effect: 'Every 5th Hit Is Thrown Back ×3', branch: 'thorns', tier: 3, requires: THORNS2, cost: 2 },
  { id: 'ironMaiden', name: 'Iron Maiden', desc: 'When You Are Badly Hurt, Your Thorns Hit Much Harder.', effect: '×3 Thorns Below 50% Life', branch: 'thorns', tier: 5, requires: THORNS3, cost: 3 },

  { id: 'pactBlood', name: 'Blood Lash', desc: 'You Pay with Your Own Life to Strike Down the Weakest Hero.', effect: 'Unlocks Blood Lash', branch: 'blood', tier: 1, cost: 1, icon: 'lash' },
  { id: 'chain', name: 'Chain', desc: 'When Your Lash Kills, It Jumps On to the Next Weakest Hero.', effect: 'Leftover Damage Jumps to the Next Weakest Hero', branch: 'blood', tier: 2, requires: ['pactBlood'], cost: 1 },
  { id: 'execute', name: 'Execute', desc: 'Your Lash Instantly Kills Heroes That Are Almost Dead.', effect: 'Heroes Below 15% Life Die to a Lash', branch: 'blood', tier: 2, requires: ['pactBlood'], cost: 1 },
  { id: 'frenzy', name: 'Frenzy', desc: 'The Lower Your Life, the Faster You Lash.', effect: 'Up to ×2.5 Lash Speed at Low Life', branch: 'blood', tier: 3, requires: BLOOD2, cost: 2 },
  { id: 'transfusion', name: 'Transfusion', desc: 'When Your Lash Kills, You Get More Life Back than It Cost.', effect: 'A Killing Lash Returns Twice Its Cost', branch: 'blood', tier: 3, requires: BLOOD2, cost: 2 },
  { id: 'bloodMoon', name: 'Blood Moon', desc: 'Healing Beyond Your Full Life Turns into a Shield.', effect: 'Overheal Becomes a Shield, Up to 50% of Your Life', branch: 'blood', tier: 5, requires: BLOOD3, cost: 3 },
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
