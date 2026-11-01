// All balance numbers live here so they can be tuned in one place.

export type HeroKind = 'squire' | 'archer' | 'cutpurse' | 'battlemage' | 'champion';

export interface HeroDef {
  name: string;
  hp: number;
  damage: number;
  /** Seconds between attacks. */
  attackInterval: number;
  /** Walk speed in world units per second. */
  speed: number;
  /** Distance from the lord at which the hero stops and attacks. */
  stopDist: number;
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
  squire: { name: 'Squire', hp: 20, damage: 3, attackInterval: 1.2, speed: 70, stopDist: 58, gold: 6, fromWave: 1, weight: 5, ranged: false, color: '#7f9cc7', radius: 13 },
  archer: { name: 'Archer', hp: 13, damage: 2.4, attackInterval: 1.5, speed: 60, stopDist: 95, gold: 8, fromWave: 3, weight: 3, ranged: true, color: '#7fb07a', radius: 12 },
  cutpurse: { name: 'Cutpurse', hp: 10, damage: 3.6, attackInterval: 0.7, speed: 110, stopDist: 52, gold: 10, fromWave: 6, weight: 2, ranged: false, color: '#c9a35b', radius: 11 },
  battlemage: { name: 'Battlemage', hp: 12, damage: 6, attackInterval: 2.6, speed: 55, stopDist: 108, gold: 12, fromWave: 8, weight: 1.5, ranged: true, color: '#6fc3d8', radius: 12 },
  champion: { name: 'Champion', hp: 180, damage: 7, attackInterval: 1.4, speed: 45, stopDist: 66, gold: 120, fromWave: 10, weight: 0, ranged: false, color: '#f1c75b', radius: 20 },
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
export const LORD_X = 72;
export const LORD_Y = 195;
/** Vertical squash of the floor plane, so the battlefield reads as seen from the side. */
export const DEPTH = 0.45;
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
  { id: 'radius', name: 'Aura Reach', desc: 'The aura reaches further.', baseCost: 25, costGrowth: 1.4, maxLevel: 10 },
  { id: 'thorns', name: 'Thorns', desc: 'Reflects part of every hit back at the attacker.', baseCost: 20, costGrowth: 1.17 },
  { id: 'shockwave', name: 'Shockwave', desc: 'Every 10 hits taken, a wave strikes all heroes.', baseCost: 60, costGrowth: 1.18 },
  { id: 'bloodPact', name: 'Blood Pact', desc: 'Each slain hero heals you.', baseCost: 45, costGrowth: 1.28, maxLevel: 10 },
];

export const SHOCKWAVE_HITS = 10;
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
