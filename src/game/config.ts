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
export const CHAMPION_AURA_REDUCTION = 0.5; // shield halves aura damage

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
// Run upgrades (bought with gold, reset each run)

export type RunUpgradeId =
  | 'vitality'
  | 'hide'
  | 'regen'
  | 'aura'
  | 'radius'
  | 'thorns'
  | 'shockwave'
  | 'bloodPact';

export interface RunUpgradeDef {
  id: RunUpgradeId;
  name: string;
  desc: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
}

export const RUN_UPGRADES: RunUpgradeDef[] = [
  { id: 'vitality', name: 'Vitality', desc: 'More maximum life.', baseCost: 8, costGrowth: 1.15 },
  { id: 'hide', name: 'Hide', desc: 'Reduces damage taken.', baseCost: 15, costGrowth: 1.2, maxLevel: 40 },
  { id: 'regen', name: 'Regeneration', desc: 'Life regained per second.', baseCost: 10, costGrowth: 1.16 },
  { id: 'aura', name: 'Dread Aura', desc: 'Damage per second to heroes inside the aura.', baseCost: 8, costGrowth: 1.15 },
  { id: 'radius', name: 'Aura Reach', desc: 'The aura reaches the next range: Mid, then Far.', baseCost: 120, costGrowth: 7, maxLevel: 2 },
  { id: 'thorns', name: 'Thorns', desc: 'Reflects part of every hit back at the attacker.', baseCost: 20, costGrowth: 1.17 },
  { id: 'shockwave', name: 'Shockwave', desc: 'Every 10 hits taken, a wave strikes all heroes in Near and Mid.', baseCost: 60, costGrowth: 1.18 },
  { id: 'bloodPact', name: 'Blood Pact', desc: 'Each slain hero heals you.', baseCost: 45, costGrowth: 1.28, maxLevel: 10 },
];

export const SHOCKWAVE_HITS = 10;
/** Shockwave reaches Near and Mid. */
export const SHOCKWAVE_REACH = 1;
/** Share of a slain hero's max life dealt to heroes nearby (prestige power). */
export const CORPSE_BURST_SHARE = 0.15;

export function runUpgradeCost(def: RunUpgradeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

// ---------------------------------------------------------------------------
// Prestige upgrades (bought with Dread, permanent)

export type PrestigeId = 'blackHeart' | 'malice' | 'tithe' | 'wrath' | 'corpseBurst' | 'headStart';

export interface PrestigeDef {
  id: PrestigeId;
  name: string;
  desc: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
}

export const PRESTIGE_UPGRADES: PrestigeDef[] = [
  { id: 'blackHeart', name: 'Black Heart', desc: '+25% maximum life and regeneration per level.', baseCost: 2, costGrowth: 1.5 },
  { id: 'malice', name: 'Malice', desc: '+25% damage of all powers per level.', baseCost: 2, costGrowth: 1.5 },
  { id: 'tithe', name: 'Tithe', desc: '+20% gold per level.', baseCost: 3, costGrowth: 1.6 },
  { id: 'wrath', name: 'Wrath', desc: 'Below 50% life your aura deals double damage.', baseCost: 8, costGrowth: 1, maxLevel: 1 },
  { id: 'corpseBurst', name: 'Corpse Burst', desc: 'Slain heroes explode and hurt heroes nearby.', baseCost: 12, costGrowth: 1, maxLevel: 1 },
  { id: 'headStart', name: 'Head Start', desc: 'Each level starts runs 5 waves later, with gold to match.', baseCost: 6, costGrowth: 2.2, maxLevel: 10 },
];

export function prestigeCost(def: PrestigeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

export function dreadForWave(bestWave: number): number {
  return Math.floor(Math.pow(bestWave / 4, 1.6));
}
