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
export const WORLD_H = 280;
export const LORD_X = 62;
export const LORD_Y = 252;
/** Vertical squash of the floor plane, so the battlefield reads as seen from the side. */
export const DEPTH = 0.5;
/** Where the floor of the throne room begins; floor markings are not drawn above it. */
export const FLOOR_Y = 150;
/**
 * Ranges are strips on the floor, from left to right, starting just in front of the Lord. Their borders follow the perspective of the floor tiles in throne-room.png:
 * straight lines that meet in a vanishing point (FIELD_VP_X, FIELD_VP_Y) above the hall.
 * A hero's distance is measured along the row FIELD_REF_Y (FIELD_X + dist * FIELD_SCALE there); its lane
 * is how far down it stands between FIELD_TOP and FIELD_BOTTOM.
 */
export const FIELD_X = 112;
export const FIELD_TOP = 160;
export const FIELD_BOTTOM = 266;
export const FIELD_REF_Y = 266;
/** Stretches the strips so Far ends near the right edge of the screen. */
export const FIELD_SCALE = 1.27;
export const FIELD_VP_X = 215;
export const FIELD_VP_Y = -40;

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
  /** The first level is free in every run. */
  free?: boolean;
}

export const RUN_UPGRADES: RunUpgradeDef[] = [
  { id: 'shockwave', name: 'Shockwave', desc: 'Every Few Seconds a Shockwave Hurts Every Hero in the Hall.', baseCost: 8, costGrowth: 1.15, free: true },
  { id: 'aura', name: 'Dread Aura', desc: 'Every Hero in the Hall Takes Damage Over Time.', baseCost: 8, costGrowth: 1.15, build: 'aura' },
  { id: 'thorns', name: 'Thorns', desc: 'Every Hero That Hits You Gets Hurt in Return.', baseCost: 8, costGrowth: 1.15, build: 'thorns' },
  { id: 'lash', name: 'Blood Lash', desc: 'You Pay with Your Own Life to Strike Down the Weakest Hero.', baseCost: 8, costGrowth: 1.15, build: 'blood' },
  { id: 'vitality', name: 'Vitality', desc: 'You Can Take More Damage Before You Fall.', baseCost: 8, costGrowth: 1.15 },
  { id: 'hide', name: 'Hide', desc: 'Every Hit Against You Hurts a Little Less.', baseCost: 15, costGrowth: 1.2, maxLevel: 40 },
  { id: 'regen', name: 'Regeneration', desc: 'You Slowly Heal Over Time.', baseCost: 10, costGrowth: 1.16 },
  { id: 'bloodPact', name: 'Blood Pact', desc: 'You Heal a Little Whenever a Hero Dies.', baseCost: 45, costGrowth: 1.28, maxLevel: 10 },
];

/** Shockwave, the basic attack: seconds between waves and damage at level 1. */
export const SHOCKWAVE_INTERVAL = 2;
export const SHOCKWAVE_DAMAGE = 10;

/** Blood Lash: seconds between lashes, base share of max life dealt, share of current life paid. */
export const LASH_INTERVAL = 2;
export const LASH_SHARE = 0.1;
export const LASH_COST = 0.03;

export function runUpgradeCost(def: RunUpgradeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

// ---------------------------------------------------------------------------
// Prestige. Slain heroes give experience, which raises the Lord's level for good.
// Every level gives Dread points. A run ends by falling or by choosing to prestige;
// only then can Dread and Sigils be spent:
// - Dread buys levelled permanent upgrades (numbers only).
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
  /** Dread for the first level; each further level adds `costStep` (rounded down). */
  baseCost: number;
  costStep: number;
  maxLevel?: number;
}

export const PRESTIGE_UPGRADES: PrestigeDef[] = [
  { id: 'blackHeart', name: 'Black Heart', desc: 'You Start Every Run with More Life and Heal Faster.', baseCost: 1, costStep: 0.5 },
  { id: 'malice', name: 'Malice', desc: 'All Your Damage Gets Stronger.', baseCost: 2, costStep: 0.5 },
  { id: 'gloom', name: 'Gloom', desc: 'Your Aura Deals More Damage.', baseCost: 1, costStep: 0.5 },
  { id: 'barbs', name: 'Barbs', desc: 'Your Thorns Deal More Damage.', baseCost: 1, costStep: 0.5 },
  { id: 'sanguine', name: 'Sanguine', desc: 'Your Blood Lash Deals More Damage.', baseCost: 1, costStep: 0.5 },
  { id: 'tremor', name: 'Tremor', desc: 'Your Shockwave Deals More Damage.', baseCost: 1, costStep: 0.5 },
  { id: 'tithe', name: 'Tithe', desc: 'Heroes Drop More Gold.', baseCost: 2, costStep: 0.5 },
  { id: 'avarice', name: 'Avarice', desc: 'Powers Cost Less Gold.', baseCost: 2, costStep: 0.5, maxLevel: 10 },
  { id: 'dreadHarvest', name: 'Dread Harvest', desc: 'You Gain Experience Faster and Level Up Sooner.', baseCost: 3, costStep: 1 },
  { id: 'headStart', name: 'Head Start', desc: 'New Runs Skip the First Waves and Start with Gold.', baseCost: 3, costStep: 1, maxLevel: 10 },
];

/** Dread costs rise by a fixed amount per level, since every Lord level gives one point. */
export function prestigeCost(def: PrestigeDef, level: number): number {
  return def.baseCost + Math.floor(def.costStep * level);
}

/** Experience a slain hero gives in this wave. A Champion gives much more. */
export function xpForKill(wave: number, champion: boolean): number {
  return (1 + Math.floor(wave / 5)) * (champion ? 10 : 1);
}

/** Experience needed to go from `level` to the next one. */
export function xpToNext(level: number): number {
  return Math.round(10 * Math.pow(level, 0.7));
}

/** Dread points gained when reaching a level: always one. */
export function dreadForLevel(_level: number): number {
  return 1;
}

/** Level reached with this much experience in total (starting at level 1). */
export function levelForXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let left = xp;
  while (left >= xpToNext(level)) {
    left -= xpToNext(level);
    level++;
  }
  return { level, into: left, need: xpToNext(level) };
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
  | 'soulHarvest'
  | 'dreadTide'
  | 'creepingDark'
  | 'blackSun'
  | 'unmaking'
  | 'pactThorns'
  | 'splinter'
  | 'thornBurst'
  | 'barbedGround'
  | 'spikedHide'
  | 'retaliation'
  | 'openWounds'
  | 'barbedFury'
  | 'brambleWall'
  | 'mirrorPlate'
  | 'ironMaiden'
  | 'crownOfThorns'
  | 'pactBlood'
  | 'chain'
  | 'execute'
  | 'bloodletting'
  | 'frenzy'
  | 'transfusion'
  | 'thirst'
  | 'bloodlust'
  | 'twinLash'
  | 'crimsonTithe'
  | 'bloodMoon'
  | 'sanguineAvatar';

export interface PactDef {
  id: PactId;
  name: string;
  desc: string;
  /** The rule in plain numbers, shown small under the description; see `pactEffect`. */
  effect: string;
  branch: BuildId;
  /** Tier in the branch: 1 = start pact, 5 = capstone. Tiers open with Sigils spent in the branch. */
  tier: number;
  /** Sigils for the first level; each further level costs one more. */
  cost: number;
  /** The pact's number at each level ({p} shows it as a percent, {x} as a plain number). Start pacts have one level. */
  values?: number[];
  /** Stand-in icon under assets/icons/, used until assets/icons/<id>.png exists. */
  icon?: string;
}

/** Sigils a branch needs spent on it before each tier opens. Tier 2 opens with the start pact. */
export const TIER_SIGILS: Record<number, number> = { 2: 1, 3: 5, 4: 15, 5: 30 };

/** Listed branch by branch, each from start pact to capstone. */
export const PACTS: PactDef[] = [
  { id: 'pactAura', name: 'Dread Aura', desc: 'Every Hero in the Hall Takes Damage Over Time.', effect: 'Unlocks Dread Aura', branch: 'aura', tier: 1, cost: 1, icon: 'aura' },
  { id: 'withering', name: 'Withering', desc: 'Heroes in Your Aura Hit You Softer.', effect: '−{p} Hero Damage in the Aura', values: [0.25, 0.35, 0.45], branch: 'aura', tier: 2, cost: 1 },
  { id: 'grasp', name: 'Grasp', desc: 'Heroes in Your Aura Attack Less Often.', effect: 'Heroes in the Aura Attack {p} Slower', values: [0.3, 0.45, 0.6], branch: 'aura', tier: 2, cost: 1 },
  { id: 'longShadow', name: 'Long Shadow', desc: 'Your Aura Hurts Heroes Far Away More.', effect: '+{p} Aura Damage on Distant Heroes', values: [0.6, 0.9, 1.2], branch: 'aura', tier: 2, cost: 1 },
  { id: 'doom', name: 'Doom', desc: 'The Longer a Hero Stays in Your Aura, the More It Hurts.', effect: '+25% Aura Damage per Second Inside, Up to ×{x}', values: [3, 4, 5], branch: 'aura', tier: 3, cost: 2 },
  { id: 'despair', name: 'Despair', desc: 'Badly Hurt Heroes Take Extra Aura Damage.', effect: '×{x} Aura Damage Below 30% Life', values: [2, 2.5, 3], branch: 'aura', tier: 3, cost: 2 },
  { id: 'innerSanctum', name: 'Inner Sanctum', desc: 'Your Aura Hurts Heroes Right Next to You Much More.', effect: '×{x} Aura Damage on the Closest Heroes', values: [2, 2.5, 3], branch: 'aura', tier: 3, cost: 2 },
  { id: 'soulHarvest', name: 'Soul Harvest', desc: 'Every Hero That Dies in Your Aura Makes It Stronger Until the Wave Ends.', effect: '+{p} Aura Damage per Kill This Wave', values: [0.05, 0.08, 0.12], branch: 'aura', tier: 4, cost: 3 },
  { id: 'dreadTide', name: 'Dread Tide', desc: 'The More Heroes Fill the Hall, the Stronger Your Aura.', effect: '+{p} Aura Damage per Hero in the Hall', values: [0.05, 0.08, 0.12], branch: 'aura', tier: 4, cost: 3 },
  { id: 'creepingDark', name: 'Creeping Dark', desc: 'Heroes in Your Aura Walk Slower and Stay in It Longer.', effect: 'Heroes in the Aura Walk {p} Slower', values: [0.3, 0.45, 0.6], branch: 'aura', tier: 4, cost: 3 },
  { id: 'blackSun', name: 'Black Sun', desc: 'Every Few Seconds Your Aura Bursts and Hits Everyone at Once.', effect: 'Every 8 s: {x} s of Aura Damage at Once', values: [3, 4, 5], branch: 'aura', tier: 5, cost: 4 },
  { id: 'unmaking', name: 'Unmaking', desc: 'Your Aura Also Eats Away at Every Hero\'s Life, Even the Strongest.', effect: '{p} of Each Hero\'s Life per Second', values: [0.01, 0.015, 0.02], branch: 'aura', tier: 5, cost: 4 },

  { id: 'pactThorns', name: 'Thorns', desc: 'Every Hero That Hits You Gets Hurt in Return.', effect: 'Unlocks Thorns', branch: 'thorns', tier: 1, cost: 1, icon: 'thorns' },
  { id: 'splinter', name: 'Splinter', desc: 'Your Thorns Also Hurt the Hero Standing Next to the Attacker.', effect: 'Each Strike Also Hits the Nearest Hero for {p}', values: [0.5, 0.75, 1], branch: 'thorns', tier: 2, cost: 1 },
  { id: 'thornBurst', name: 'Thorn Burst', desc: 'Heroes Killed by Your Thorns Explode and Hurt Those Around Them.', effect: "Spikes Hit Nearby Heroes for {p} of the Slain Hero's Life", values: [0.15, 0.2, 0.25], branch: 'thorns', tier: 2, cost: 1 },
  { id: 'barbedGround', name: 'Barbed Ground', desc: 'Heroes Who Step Up Close Tread on Your Thorns Once.', effect: 'Stepping Close Throws Back ×{x} of a Hit', values: [1, 1.5, 2], branch: 'thorns', tier: 2, cost: 1 },
  { id: 'spikedHide', name: 'Spiked Hide', desc: 'The Better Your Armor, the Harder Your Thorns Hit.', effect: 'Blocked Damage Is Thrown Back ×{x}', values: [3, 4, 5], branch: 'thorns', tier: 3, cost: 2 },
  { id: 'retaliation', name: 'Retaliation', desc: 'Every Few Hits, Your Thorns Strike Back Much Harder.', effect: 'Every 5th Hit Is Thrown Back ×{x}', values: [3, 4, 5], branch: 'thorns', tier: 3, cost: 2 },
  { id: 'openWounds', name: 'Open Wounds', desc: 'Heroes Hurt by Your Thorns Keep Bleeding for a While.', effect: '{p} of Each Strike per Second for 3 s', values: [0.2, 0.3, 0.4], branch: 'thorns', tier: 3, cost: 2 },
  { id: 'barbedFury', name: 'Barbed Fury', desc: 'Every Hero Your Thorns Kill Makes Them Stronger Until the Wave Ends.', effect: '+{p} Thorns per Kill This Wave', values: [0.05, 0.08, 0.12], branch: 'thorns', tier: 4, cost: 3 },
  { id: 'brambleWall', name: 'Bramble Wall', desc: 'Heroes Right in Front of You Hurt Themselves Even Without Striking.', effect: 'Every 2 s: ×{x} of a Hit to the Closest Heroes', values: [0.5, 0.75, 1], branch: 'thorns', tier: 4, cost: 3 },
  { id: 'mirrorPlate', name: 'Mirror Plate', desc: 'Arrows and Spells Bounce Off You Even Harder.', effect: 'Ranged Hits Are Thrown Back ×{x}', values: [1.5, 2, 2.5], branch: 'thorns', tier: 4, cost: 3 },
  { id: 'ironMaiden', name: 'Iron Maiden', desc: 'When You Are Badly Hurt, Your Thorns Hit Much Harder.', effect: '×{x} Thorns Below 50% Life', values: [3, 4, 5], branch: 'thorns', tier: 5, cost: 4 },
  { id: 'crownOfThorns', name: 'Crown of Thorns', desc: 'Every Hero Your Thorns Kill Sends a Spike Into Another Hero.', effect: "A Spike Hits Another Hero for {p} of the Slain Hero's Life", values: [0.2, 0.3, 0.4], branch: 'thorns', tier: 5, cost: 4 },

  { id: 'pactBlood', name: 'Blood Lash', desc: 'You Pay with Your Own Life to Strike Down the Weakest Hero.', effect: 'Unlocks Blood Lash', branch: 'blood', tier: 1, cost: 1, icon: 'lash' },
  { id: 'chain', name: 'Chain', desc: 'When Your Lash Kills, It Jumps On to the Next Weakest Hero.', effect: '{p} of the Leftover Damage Jumps to the Next Weakest Hero', values: [1, 1.25, 1.5], branch: 'blood', tier: 2, cost: 1 },
  { id: 'execute', name: 'Execute', desc: 'Your Lash Instantly Kills Heroes That Are Almost Dead.', effect: 'Heroes Below {p} Life Die to a Lash', values: [0.15, 0.2, 0.25], branch: 'blood', tier: 2, cost: 1 },
  { id: 'bloodletting', name: 'Bloodletting', desc: 'Heroes Struck by Your Lash Keep Bleeding for a While.', effect: '{p} of the Lash per Second for 3 s', values: [0.1, 0.15, 0.2], branch: 'blood', tier: 2, cost: 1 },
  { id: 'frenzy', name: 'Frenzy', desc: 'The Lower Your Life, the Faster You Lash.', effect: 'Up to ×{x} Lash Speed at Low Life', values: [2.5, 3, 3.5], branch: 'blood', tier: 3, cost: 2 },
  { id: 'transfusion', name: 'Transfusion', desc: 'When Your Lash Kills, You Get More Life Back than It Cost.', effect: 'A Killing Lash Returns ×{x} Its Cost', values: [2, 2.5, 3], branch: 'blood', tier: 3, cost: 2 },
  { id: 'thirst', name: 'Thirst', desc: 'The Healthier You Are, the Less Your Lash Costs.', effect: 'Up to {p} Less Lash Cost at Full Life', values: [0.3, 0.5, 0.7], branch: 'blood', tier: 3, cost: 2 },
  { id: 'bloodlust', name: 'Bloodlust', desc: 'Every Hero Your Lash Kills Makes It Stronger Until the Wave Ends.', effect: '+{p} Lash Damage per Kill This Wave', values: [0.05, 0.08, 0.12], branch: 'blood', tier: 4, cost: 3 },
  { id: 'twinLash', name: 'Twin Lash', desc: 'Every Third Lash Strikes Twice.', effect: 'Every 3rd Lash Strikes Again for {p}', values: [0.5, 0.75, 1], branch: 'blood', tier: 4, cost: 3 },
  { id: 'crimsonTithe', name: 'Crimson Tithe', desc: 'Heroes Your Lash Kills Drop More Gold.', effect: '+{p} Gold from Lash Kills', values: [0.25, 0.5, 0.75], branch: 'blood', tier: 4, cost: 3 },
  { id: 'bloodMoon', name: 'Blood Moon', desc: 'Healing Beyond Your Full Life Turns into a Shield.', effect: 'Overheal Becomes a Shield, Up to {p} of Your Life', values: [0.5, 0.75, 1], branch: 'blood', tier: 5, cost: 4 },
  { id: 'sanguineAvatar', name: 'Sanguine Avatar', desc: 'When You Are Close to Death, Your Lash Costs Nothing and Hits Every Hero.', effect: 'Below {p} Life: Free Lash on Every Hero', values: [0.25, 0.3, 0.35], branch: 'blood', tier: 5, cost: 4 },
];

export const START_PACTS: Record<BuildId, PactId> = { aura: 'pactAura', thorns: 'pactThorns', blood: 'pactBlood' };

/** Tuning numbers for the pacts that do not change with the pact's level. */
export const BLEED_SECONDS = 3;
export const BRAMBLE_EVERY = 2;
export const TWIN_LASH_EVERY = 3;
export const DOOM_PER_SECOND = 0.25;
export const DESPAIR_BELOW = 0.3;
export const BLACK_SUN_EVERY = 8;
export const THORN_BURST_RADIUS = 60;
export const RETALIATION_EVERY = 5;
export const IRON_MAIDEN_BELOW = 0.5;

/** Levels a pact can reach. Start pacts have just one. */
export function pactMaxLevel(def: PactDef): number {
  return def.values?.length ?? 1;
}

/** Sigils for the next level of a pact that is at `level` now. */
export function pactLevelCost(def: PactDef, level: number): number {
  return def.cost + level;
}

/** The pact's number at a level (0 while not owned). */
export function pactValue(def: PactDef, level: number): number {
  if (level <= 0 || !def.values) return 0;
  return def.values[Math.min(level, def.values.length) - 1];
}

/** The rule text at a level, with its number filled in. */
export function pactEffect(def: PactDef, level: number): string {
  const v = pactValue(def, Math.max(1, level));
  return def.effect.replace('{p}', `${Math.round(v * 100)}%`).replace('{x}', String(v));
}

/** A second and third start pact cost more, so a run with several builds takes saving up. */
export const EXTRA_BUILD_COST = 15;

/** One Sigil for every this many Lord levels. */
export const SIGIL_LEVELS = 50;

/**
 * Dread upgrades multiply: (1 + linear × level) × exp^level. The small exponential part keeps
 * every level worth about as much as the last, so records keep moving instead of hitting a wall.
 */
export const DREAD_GROWTH: Partial<Record<PrestigeId, { linear: number; exp: number }>> = {
  blackHeart: { linear: 0.15, exp: 1.05 },
  malice: { linear: 0.1, exp: 1.05 },
  gloom: { linear: 0.25, exp: 1.05 },
  barbs: { linear: 0.25, exp: 1.05 },
  sanguine: { linear: 0.25, exp: 1.05 },
  tremor: { linear: 0.25, exp: 1.05 },
  tithe: { linear: 0.15, exp: 1.04 },
};

/** Milestones for run powers without a level cap: every MILESTONE_EVERY levels, ×MILESTONE_MULT. */
export const MILESTONE_EVERY = 25;
export const MILESTONE_MULT = 1.5;

export const DREAD_HARVEST_PER_LEVEL = 0.1;
export const AVARICE_PER_LEVEL = 0.05;
