// Gear: twelve slots on the Lord, three pieces for each. Pieces are forged at random with
// Spoils that Champions drop. A new piece is added at level 1; a piece forged again gains a level.
// Every piece gives a plain bonus; set pieces also count toward a set that boosts one build.

import type { BuildId } from './config';

export type SlotId =
  | 'helm'
  | 'shoulders'
  | 'chest'
  | 'gloves'
  | 'belt'
  | 'boots'
  | 'cloak'
  | 'sword'
  | 'amulet'
  | 'ring1'
  | 'ring2'
  | 'charm';

export interface SlotDef {
  id: SlotId;
  name: string;
}

/** In paperdoll order: the left column top to bottom, then the right column. */
export const SLOTS: SlotDef[] = [
  { id: 'helm', name: 'Helm' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'chest', name: 'Chest' },
  { id: 'belt', name: 'Belt' },
  { id: 'boots', name: 'Boots' },
  { id: 'cloak', name: 'Cloak' },
  { id: 'gloves', name: 'Gloves' },
  { id: 'sword', name: 'Sword' },
  { id: 'amulet', name: 'Amulet' },
  { id: 'ring1', name: 'Ring' },
  { id: 'ring2', name: 'Ring' },
  { id: 'charm', name: 'Charm' },
];

/** What a piece makes stronger. */
export type BonusKind = 'life' | 'regen' | 'damage' | 'shockwave' | 'gold' | 'xp' | 'spoils';

/** Bonus per piece level, e.g. 0.12 = +12% per level. */
export const BONUS_PER_LEVEL: Record<BonusKind, number> = {
  life: 0.12,
  regen: 0.15,
  damage: 0.08,
  shockwave: 0.15,
  gold: 0.08,
  xp: 0.05,
  spoils: 0.08,
};

export const BONUS_NAMES: Record<BonusKind, string> = {
  life: 'Life',
  regen: 'Regeneration',
  damage: 'All Damage',
  shockwave: 'Shockwave Damage',
  gold: 'Gold',
  xp: 'Experience',
  spoils: 'Spoils',
};

export interface ItemDef {
  id: string;
  name: string;
  slot: SlotId;
  bonus: BonusKind;
  /** Set pieces also count toward the set of this build. */
  set?: BuildId;
}

export const ITEMS: ItemDef[] = [
  { id: 'hornedHelm', name: 'Horned Helm', slot: 'helm', bonus: 'life', set: 'aura' },
  { id: 'ironVisor', name: 'Iron Visor', slot: 'helm', bonus: 'life' },
  { id: 'skullCap', name: 'Skull Cap', slot: 'helm', bonus: 'xp' },
  { id: 'spikedPauldrons', name: 'Spiked Pauldrons', slot: 'shoulders', bonus: 'life', set: 'thorns' },
  { id: 'boneMantle', name: 'Bone Mantle', slot: 'shoulders', bonus: 'regen' },
  { id: 'graveSpaulders', name: 'Grave Spaulders', slot: 'shoulders', bonus: 'damage' },
  { id: 'thornedCuirass', name: 'Thorned Cuirass', slot: 'chest', bonus: 'life', set: 'thorns' },
  { id: 'blackPlate', name: 'Black Plate', slot: 'chest', bonus: 'life' },
  { id: 'ashenHauberk', name: 'Ashen Hauberk', slot: 'chest', bonus: 'regen' },
  { id: 'briarBelt', name: 'Briar Belt', slot: 'belt', bonus: 'regen', set: 'thorns' },
  { id: 'gildedGirdle', name: 'Gilded Girdle', slot: 'belt', bonus: 'gold' },
  { id: 'chainSash', name: 'Chain Sash', slot: 'belt', bonus: 'life' },
  { id: 'bloodstepGreaves', name: 'Bloodstep Greaves', slot: 'boots', bonus: 'regen', set: 'blood' },
  { id: 'ironTreads', name: 'Iron Treads', slot: 'boots', bonus: 'life' },
  { id: 'ashenBoots', name: 'Ashen Boots', slot: 'boots', bonus: 'xp' },
  { id: 'shroudOfNight', name: 'Shroud of Night', slot: 'cloak', bonus: 'damage', set: 'aura' },
  { id: 'crimsonCloak', name: 'Crimson Cloak', slot: 'cloak', bonus: 'life' },
  { id: 'tatteredCape', name: 'Tattered Cape', slot: 'cloak', bonus: 'spoils' },
  { id: 'barbedGauntlets', name: 'Barbed Gauntlets', slot: 'gloves', bonus: 'damage', set: 'thorns' },
  { id: 'ironcladFists', name: 'Ironclad Fists', slot: 'gloves', bonus: 'damage' },
  { id: 'graveGloves', name: 'Grave Gloves', slot: 'gloves', bonus: 'shockwave' },
  { id: 'bloodletter', name: 'Bloodletter', slot: 'sword', bonus: 'damage', set: 'blood' },
  { id: 'dreadBlade', name: 'Dread Blade', slot: 'sword', bonus: 'damage' },
  { id: 'ironGreatsword', name: 'Iron Greatsword', slot: 'sword', bonus: 'shockwave' },
  { id: 'eyeOfDusk', name: 'Eye of Dusk', slot: 'amulet', bonus: 'damage', set: 'aura' },
  { id: 'boneAmulet', name: 'Bone Amulet', slot: 'amulet', bonus: 'xp' },
  { id: 'goldLocket', name: 'Gold Locket', slot: 'amulet', bonus: 'gold' },
  { id: 'ringOfGloom', name: 'Ring of Gloom', slot: 'ring1', bonus: 'damage', set: 'aura' },
  { id: 'ironBand', name: 'Iron Band', slot: 'ring1', bonus: 'shockwave' },
  { id: 'signetOfGreed', name: 'Signet of Greed', slot: 'ring1', bonus: 'gold' },
  { id: 'ringOfVeins', name: 'Ring of Veins', slot: 'ring2', bonus: 'life', set: 'blood' },
  { id: 'onyxRing', name: 'Onyx Ring', slot: 'ring2', bonus: 'damage' },
  { id: 'copperRing', name: 'Copper Ring', slot: 'ring2', bonus: 'spoils' },
  { id: 'bloodVial', name: 'Blood Vial', slot: 'charm', bonus: 'regen', set: 'blood' },
  { id: 'ravenFeather', name: 'Raven Feather', slot: 'charm', bonus: 'xp' },
  { id: 'luckyCoin', name: 'Lucky Coin', slot: 'charm', bonus: 'spoils' },
];

export interface SetDef {
  build: BuildId;
  name: string;
}

export const SETS: SetDef[] = [
  { build: 'aura', name: 'Regalia of Dusk' },
  { build: 'thorns', name: 'Briar Plate' },
  { build: 'blood', name: 'Bloodbound' },
];

/** Set bonus on the build's damage: with 2 pieces worn, and with all 4. */
export const SET_BONUS_2 = 1.5;
export const SET_BONUS_4 = 3;

/** Spoils a slain Champion drops: one for every 10 waves. */
export function spoilsForChampion(wave: number): number {
  return Math.max(1, Math.floor(wave / 10));
}

/** Spoils for the next forge after `forged` forges so far. */
export function forgeCost(forged: number): number {
  return 10 + 3 * forged;
}

export interface GearState {
  spoils: number;
  forged: number;
  /** Level of every piece owned (absent = not owned). */
  owned: Record<string, number>;
  equipped: Partial<Record<SlotId, string>>;
}

export function emptyGear(): GearState {
  return { spoils: 0, forged: 0, owned: {}, equipped: {} };
}

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

/** Multiplier from all worn pieces of one bonus kind. */
export function gearMult(gear: GearState | undefined, kind: BonusKind): number {
  if (!gear) return 1;
  let m = 1;
  for (const id of Object.values(gear.equipped)) {
    const def = id ? ITEM_BY_ID.get(id) : undefined;
    if (def && def.bonus === kind) m *= 1 + BONUS_PER_LEVEL[kind] * (gear.owned[def.id] ?? 0);
  }
  return m;
}

/** Worn pieces of a build's set. */
export function setPieces(gear: GearState | undefined, build: BuildId): number {
  if (!gear) return 0;
  return Object.values(gear.equipped).filter((id) => id && ITEM_BY_ID.get(id)?.set === build).length;
}

/** Multiplier the set gives its build's damage. */
export function setMult(gear: GearState | undefined, build: BuildId): number {
  const n = setPieces(gear, build);
  return n >= 4 ? SET_BONUS_4 : n >= 2 ? SET_BONUS_2 : 1;
}
