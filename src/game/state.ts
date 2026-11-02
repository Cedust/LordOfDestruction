import { PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES, SIGIL_WAVES, type PactId, type PrestigeId, type RunUpgradeId } from './config';

export type RunLevels = Record<RunUpgradeId, number>;
export type PrestigeLevels = Record<PrestigeId, number>;
export type PactLevels = Record<PactId, number>;

export interface RunState {
  wave: number;
  gold: number;
  levels: RunLevels;
  lordHp: number;
  hitsTaken: number;
  /** How often Second Wind saved the lord this run. */
  secondWinds?: number;
  /** Last wave in which Martyrdom went off. */
  martyrdomWave?: number;
}

export interface SaveData {
  version: 1;
  dread: number;
  bestWave: number;
  runs: number;
  prestige: PrestigeLevels;
  sigils: number;
  pacts: PactLevels;
  /** The run in progress, resumed at the start of its current wave. */
  run: RunState | null;
  speed: number;
}

export function emptyRunLevels(): RunLevels {
  return Object.fromEntries(RUN_UPGRADES.map((u) => [u.id, 0])) as RunLevels;
}

export function emptyPrestige(): PrestigeLevels {
  return Object.fromEntries(PRESTIGE_UPGRADES.map((u) => [u.id, 0])) as PrestigeLevels;
}

export function emptyPacts(): PactLevels {
  return Object.fromEntries(PACTS.map((u) => [u.id, 0])) as PactLevels;
}

export function newSave(): SaveData {
  return { version: 1, dread: 0, bestWave: 0, runs: 0, prestige: emptyPrestige(), sigils: 0, pacts: emptyPacts(), run: null, speed: 1 };
}

/** Dread that saves from before the skill tree spent on what are now pacts. */
const OLD_DREAD_UNLOCKS: Record<string, number> = { wrath: 8, corpseBurst: 12 };

function pick<T extends Record<string, number>>(base: T, from: Record<string, number> | undefined): T {
  const out = { ...base };
  for (const k of Object.keys(base)) if (typeof from?.[k] === 'number') (out as Record<string, number>)[k] = from[k];
  return out;
}

const KEY = 'lod-save-v1';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newSave();
    const data = JSON.parse(raw) as SaveData;
    const base = newSave();
    const oldPrestige = (data.prestige ?? {}) as Record<string, number>;
    if (data.pacts === undefined) {
      // Save from before the skill tree: refund old Dread unlocks, grant Sigils for the record so far.
      for (const [id, cost] of Object.entries(OLD_DREAD_UNLOCKS)) data.dread += (oldPrestige[id] ?? 0) * cost;
      data.sigils = Math.floor((data.bestWave ?? 0) / SIGIL_WAVES);
    }
    return {
      ...base,
      ...data,
      prestige: pick(base.prestige, oldPrestige),
      pacts: pick(base.pacts, data.pacts),
      run: data.run ? { ...data.run, levels: { ...emptyRunLevels(), ...data.run.levels } } : null,
    };
  } catch {
    return newSave();
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage full or blocked: the game keeps running without saving.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
