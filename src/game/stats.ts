import {
  BOUNTY_PER_LEVEL,
  CORPSE_BURST_SHARE,
  ECHO_HITS,
  RANGES,
  SHOCKWAVE_HITS,
  VENGEANCE_PER_LEVEL,
  WITHERING_PER_LEVEL,
} from './config';
import type { PactLevels, PrestigeLevels, RunLevels } from './state';

export interface LordStats {
  maxHp: number;
  /** Share of incoming damage that is blocked, 0..1. */
  armor: number;
  regen: number;
  auraDps: number;
  /** Index of the farthest range the aura covers (0 = Near). */
  auraReach: number;
  /** Ranges the aura reaches for free (Creeping Dread). */
  auraReachBonus: number;
  /** Share of each hit reflected to the attacker. */
  thorns: number;
  shockwaveDamage: number;
  /** Hits taken between two shockwaves. */
  shockwaveHits: number;
  /** Share of max HP healed per kill. */
  bloodPact: number;
  wrath: boolean;
  /** Share of a slain hero's max life dealt by Corpse Burst; 0 if not owned. */
  corpseBurst: number;
  /** Share of damage heroes inside the aura no longer deal. */
  withering: number;
  doom: boolean;
  martyrdom: boolean;
  /** How often per run Second Wind can save the lord. */
  secondWinds: number;
  goldMult: number;
  dreadMult: number;
}

/** Compute the lord's current stats from run levels, Dread upgrades and pacts. */
export function computeStats(run: RunLevels, p: PrestigeLevels, pacts: PactLevels): LordStats {
  const malice = 1 + 0.25 * p.malice;
  const heart = 1 + 0.25 * p.blackHeart;
  const reachBonus = pacts.creepingDread > 0 ? 1 : 0;
  return {
    maxHp: 100 * (1 + 0.22 * run.vitality) * Math.pow(1.05, run.vitality) * heart,
    armor: 0.6 * (1 - Math.pow(0.95, run.hide)),
    regen: (1 + 0.8 * run.regen) * Math.pow(1.05, run.regen) * heart,
    auraDps: 9 * (1 + 0.35 * run.aura) * Math.pow(1.06, run.aura) * malice,
    auraReach: Math.min(RANGES.length - 1, run.radius + reachBonus),
    auraReachBonus: reachBonus,
    thorns: (1 + 0.25 * run.thorns) * malice * (1 + 0.25 * p.barbs),
    shockwaveDamage: run.shockwave > 0 ? 12 * (1 + 0.5 * (run.shockwave - 1)) * Math.pow(1.08, run.shockwave - 1) * malice : 0,
    shockwaveHits: pacts.echo > 0 ? ECHO_HITS : SHOCKWAVE_HITS,
    bloodPact: 0.02 * run.bloodPact * (pacts.bloodPrice > 0 ? 2 : 1),
    wrath: pacts.wrath > 0,
    corpseBurst: pacts.corpseBurst > 0 ? CORPSE_BURST_SHARE + VENGEANCE_PER_LEVEL * pacts.vengeance : 0,
    withering: WITHERING_PER_LEVEL * pacts.withering,
    doom: pacts.doom > 0,
    martyrdom: pacts.martyrdom > 0,
    secondWinds: pacts.secondWind > 0 ? (pacts.undying > 0 ? 2 : 1) : 0,
    goldMult: 1 + 0.2 * p.tithe,
    dreadMult: 1 + BOUNTY_PER_LEVEL * pacts.bounty,
  };
}
