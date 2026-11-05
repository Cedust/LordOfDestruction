import { emptyGear, type GearState } from './gear';
import { PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES, SIGIL_LEVELS, SIGIL_WAVES, START_SIGILS, levelForXp, type PactId, type PrestigeId, type RunUpgradeId } from './config';

export type RunLevels = Record<RunUpgradeId, number>;
export type PrestigeLevels = Record<PrestigeId, number>;
export type PactLevels = Record<PactId, number>;

export interface RunState {
  wave: number;
  gold: number;
  levels: RunLevels;
  lordHp: number;
  hitsTaken: number;
  /** Blood Moon shield. */
  shield?: number;
  /** Lord level when the run began, and Dread points gained since, for the run summary. */
  startLevel?: number;
  dreadGained?: number;
  /** Sigils earned from Lord levels during this run, for the run summary. */
  levelSigils?: number;
  /** Spoils earned during this run, for the run summary. */
  spoilsGained?: number;
  /** First wave of this run in which the Lord lost a real share of life. */
  firstHurt?: number;
}

export interface SaveData {
  version: 1;
  /** Unspent Dread points, earned by levelling up. */
  dread: number;
  /** Total experience ever earned. The Lord's level comes from it and is never lost. */
  xp: number;
  bestWave: number;
  /** Where the last run first got dangerous; the next run starts a little before it. */
  fightWave?: number;
  runs: number;
  prestige: PrestigeLevels;
  sigils: number;
  pacts: PactLevels;
  /** Version of the pact tree the save was made with. */
  treeVersion?: number;
  /** The run in progress, resumed at the start of its current wave. */
  run: RunState | null;
  speed: number;
  /** Show the life and level bars in percent instead of numbers. */
  barPercent?: boolean;
  /** Buy amount in the Powers tab: 1, 10 or 0 for as many as affordable. */
  buyMode?: number;
  /** Forged gear, worn pieces and unspent Spoils. */
  gear: GearState;
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
  return { version: 1, dread: 0, xp: 0, bestWave: 0, runs: 0, prestige: emptyPrestige(), sigils: START_SIGILS, pacts: emptyPacts(), treeVersion: TREE_VERSION, run: null, speed: 1, gear: emptyGear() };
}

/** Bumped whenever the pact tree changes; older trees are refunded in Sigils. */
export const TREE_VERSION = 4;

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
      // Save from before the skill tree: refund the old Dread unlocks.
      for (const [id, cost] of Object.entries(OLD_DREAD_UNLOCKS)) data.dread += (oldPrestige[id] ?? 0) * cost;
    }
    if (data.treeVersion !== TREE_VERSION) {
      // Older or no tree: start the new tree fresh with every Sigil the record has earned.
      data.pacts = emptyPacts();
      data.sigils =
        START_SIGILS + Math.floor((data.bestWave ?? 0) / SIGIL_WAVES) + Math.floor(levelForXp(data.xp ?? 0).level / SIGIL_LEVELS);
      data.treeVersion = TREE_VERSION;
      data.run = null;
    }
    return {
      ...base,
      ...data,
      prestige: pick(base.prestige, oldPrestige),
      pacts: pick(base.pacts, data.pacts),
      gear: { ...emptyGear(), ...(data.gear ?? {}) },
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
