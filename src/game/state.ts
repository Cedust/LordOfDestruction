import { PRESTIGE_UPGRADES, RUN_UPGRADES, type PrestigeId, type RunUpgradeId } from './config';

export type RunLevels = Record<RunUpgradeId, number>;
export type PrestigeLevels = Record<PrestigeId, number>;

export interface RunState {
  wave: number;
  gold: number;
  levels: RunLevels;
  lordHp: number;
  hitsTaken: number;
}

export interface SaveData {
  version: 1;
  dread: number;
  bestWave: number;
  runs: number;
  prestige: PrestigeLevels;
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

export function newSave(): SaveData {
  return { version: 1, dread: 0, bestWave: 0, runs: 0, prestige: emptyPrestige(), run: null, speed: 1 };
}

const KEY = 'lod-save-v1';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newSave();
    const data = JSON.parse(raw) as SaveData;
    const base = newSave();
    return {
      ...base,
      ...data,
      prestige: { ...base.prestige, ...data.prestige },
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
