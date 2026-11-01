import type { PrestigeLevels, RunLevels } from './state';

export interface LordStats {
  maxHp: number;
  /** Share of incoming damage that is blocked, 0..1. */
  armor: number;
  regen: number;
  auraDps: number;
  auraRadius: number;
  /** Share of each hit reflected to the attacker. */
  thorns: number;
  shockwaveDamage: number;
  /** Share of max HP healed per kill. */
  bloodPact: number;
  wrath: boolean;
  corpseBurst: boolean;
  goldMult: number;
}

/** Compute the lord's current stats from run levels and prestige levels. */
export function computeStats(run: RunLevels, p: PrestigeLevels): LordStats {
  const malice = 1 + 0.25 * p.malice;
  const heart = 1 + 0.25 * p.blackHeart;
  return {
    maxHp: 100 * (1 + 0.22 * run.vitality) * Math.pow(1.05, run.vitality) * heart,
    armor: 0.6 * (1 - Math.pow(0.95, run.hide)),
    regen: (1 + 0.8 * run.regen) * Math.pow(1.05, run.regen) * heart,
    auraDps: 9 * (1 + 0.35 * run.aura) * Math.pow(1.06, run.aura) * malice,
    auraRadius: 70 + 8 * run.radius,
    thorns: (1 + 0.25 * run.thorns) * malice,
    shockwaveDamage: run.shockwave > 0 ? 12 * (1 + 0.5 * (run.shockwave - 1)) * Math.pow(1.08, run.shockwave - 1) * malice : 0,
    bloodPact: 0.02 * run.bloodPact,
    wrath: p.wrath > 0,
    corpseBurst: p.corpseBurst > 0,
    goldMult: 1 + 0.2 * p.tithe,
  };
}
