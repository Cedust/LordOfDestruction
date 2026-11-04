import { BUILDS } from './game/config';
import { fmt, type Game } from './game/game';
import { BONUS_NAMES, BONUS_PER_LEVEL, ITEMS, SETS, SET_BONUS_2, SET_BONUS_4, SLOTS, setPieces, type ItemDef, type SlotId } from './game/gear';
import { assetUrl } from './assets';

function itemIcon(item: ItemDef | undefined, fallback: string): string {
  const url = item ? assetUrl(`equipment/${item.id}`) : undefined;
  if (url) return `<img class="gear-icon" alt="" src="${url}">`;
  return `<span class="gear-icon placeholder">${item ? item.name[0] : fallback}</span>`;
}

function setColor(item: ItemDef): string {
  return BUILDS.find((b) => b.id === item.set)?.color ?? 'var(--muted)';
}

/** A plain piece per slot whose shape stands in for an empty slot. */
const PLACEHOLDER: Record<SlotId, string> = {
  helm: 'ironVisor', shoulders: 'boneMantle', chest: 'blackPlate', belt: 'gildedGirdle', boots: 'ironTreads', cloak: 'crimsonCloak',
  gloves: 'ironcladFists', sword: 'ironGreatsword', amulet: 'goldLocket', ring1: 'ironBand', ring2: 'onyxRing', charm: 'luckyCoin',
};

/** Empty slot: its outline icon (assets/ui/slots/), else a dimmed piece that fits there, else the slot's name. */
function slotPlaceholder(id: SlotId, name: string): string {
  const outline = assetUrl(`ui/slots/${id === 'ring1' || id === 'ring2' ? 'ring' : id}`);
  if (outline) return `<img class="gear-icon outline" alt="${name}" src="${outline}">`;
  const url = assetUrl(`equipment/${PLACEHOLDER[id]}`);
  return url ? `<img class="gear-icon ghost" alt="${name}" src="${url}">` : name;
}

/** Icon for a piece not forged yet: the outline bundle, else a question mark. */
function unknownIcon(): string {
  const url = assetUrl('ui/slots/unknown');
  return url ? `<img class="gear-icon outline" alt="" src="${url}">` : itemIcon(undefined, '?');
}

/**
 * Where each slot sits on the doll (row / column / row end / column end), laid out like
 * the body: shoulders, helm and amulet on top; gloves, chest and cloak; the rings; belt
 * and boots at the bottom; sword and charm as tall weapon slots on either side.
 */
const AREAS: Record<SlotId, string> = {
  shoulders: '1/1/2/2', helm: '1/2/2/3', amulet: '1/3/2/4',
  gloves: '2/1/3/2', chest: '2/2/4/3', cloak: '2/3/3/4',
  ring1: '3/1/4/2', ring2: '3/3/4/4',
  sword: '4/1/6/2', belt: '4/2/5/3', charm: '4/3/6/4',
  boots: '5/2/6/3',
};

/**
 * The Gear tab: the slots laid out like a body, the pieces of the selected slot to wear,
 * the set progress, and the forge button in the panel header.
 */
export class GearPanel {
  private selected: SlotId = 'helm';
  private slotButtons = new Map<SlotId, HTMLButtonElement>();
  private pieces: HTMLElement;
  private slotName: HTMLElement;
  private sets: HTMLElement;
  private result: HTMLElement;
  private last = '';

  constructor(private game: Game, root: HTMLElement, private forgeBtn: HTMLButtonElement, private spoilsEl: HTMLElement, private onChange: () => void) {
    const wrap = document.createElement('div');
    wrap.className = 'gearwrap';
    const doll = document.createElement('div');
    doll.className = 'd3';
    for (const slot of SLOTS) {
      const btn = document.createElement('button');
      btn.className = 'dslot';
      btn.style.gridArea = AREAS[slot.id];
      btn.setAttribute('aria-label', slot.name);
      btn.addEventListener('click', () => {
        this.selected = slot.id;
        this.update();
      });
      doll.appendChild(btn);
      this.slotButtons.set(slot.id, btn);
    }
    const side = document.createElement('div');
    side.className = 'gside';
    side.innerHTML = `<div class="sub-h slot-name"></div><div class="plist"></div><div class="forge-result"></div><div class="sub-h">Sets</div><div class="sets"></div>`;
    wrap.append(doll, side);
    root.appendChild(wrap);
    this.slotName = side.querySelector('.slot-name')!;
    this.pieces = side.querySelector('.plist')!;
    this.result = side.querySelector('.forge-result')!;
    this.sets = side.querySelector('.sets')!;

    this.forgeBtn.addEventListener('click', () => {
      const r = this.game.forge();
      if (!r) return;
      this.selected = r.item.slot;
      this.last = r.isNew ? `New: ${r.item.name}` : `${r.item.name} Reaches Lv ${r.level}`;
      this.onChange();
    });
  }

  update(): void {
    const gear = this.game.save.gear;
    for (const slot of SLOTS) {
      const btn = this.slotButtons.get(slot.id)!;
      const worn = gear.equipped[slot.id] ? ITEMS.find((i) => i.id === gear.equipped[slot.id]) : undefined;
      btn.classList.toggle('selected', slot.id === this.selected);
      btn.classList.toggle('empty', !worn);
      btn.style.setProperty('--set', worn?.set ? setColor(worn) : 'var(--line)');
      btn.innerHTML = worn ? `${itemIcon(worn, '')}<span class="lv">${gear.owned[worn.id]}</span>` : slotPlaceholder(slot.id, slot.name);
    }

    const slot = SLOTS.find((s) => s.id === this.selected)!;
    const items = ITEMS.filter((i) => i.slot === this.selected);
    const found = items.filter((i) => gear.owned[i.id]).length;
    this.slotName.textContent = `${slot.name} · ${found}/${items.length} Found`;
    this.pieces.innerHTML = '';
    for (const item of items) {
      const level = gear.owned[item.id] ?? 0;
      const worn = gear.equipped[slot.id] === item.id;
      const row = document.createElement('button');
      row.className = 'prow2';
      row.disabled = level === 0 || worn;
      row.classList.toggle('unk', level === 0);
      row.style.setProperty('--set', level && item.set ? setColor(item) : 'var(--line)');
      const bonus = `+${fmt(Math.round(BONUS_PER_LEVEL[item.bonus] * Math.max(1, level) * 100))}% ${BONUS_NAMES[item.bonus]}`;
      row.innerHTML = level
        ? `${itemIcon(item, '')}<span class="dt"><span class="cn">${item.name}</span><span class="cl">${bonus} · Lv ${level}</span></span><span class="tag ${worn ? '' : 'wear'}">${worn ? 'Worn' : 'Wear'}</span>`
        : `${unknownIcon()}<span class="dt"><span class="cn">Unknown</span><span class="cl">Not Forged Yet</span></span>`;
      row.addEventListener('click', () => {
        if (this.game.equip(item.id)) this.onChange();
      });
      this.pieces.appendChild(row);
    }

    this.sets.innerHTML = SETS.map((set) => {
      const n = setPieces(gear, set.build);
      const color = BUILDS.find((b) => b.id === set.build)!.color;
      const bonus = n >= 4 ? ` ×${SET_BONUS_4}` : n >= 2 ? ` ×${SET_BONUS_2}` : '';
      const pips = [0, 1, 2, 3].map((i) => `<i class="${i < n ? 'f' : ''}"></i>`).join('');
      return `<div class="set" style="--c:${color}">${set.name}${bonus}<span class="pips">${pips}</span></div>`;
    }).join('');

    const cost = this.game.forgeCost();
    this.forgeBtn.innerHTML = `Forge · ${fmt(cost)} ${curHtml('spoils')}`;
    this.forgeBtn.disabled = gear.spoils < cost || !this.game.canForge();
    this.spoilsEl.textContent = fmt(gear.spoils);
    this.result.textContent = this.last;
  }
}

const CUR_SYMBOL: Record<string, string> = { gold: 'g', dread: '☠', sigil: '✦', spoils: '◆', settings: '⚙' };

/** A currency symbol: the UI icon when it exists, else a drawn coin with a letter. */
export function curHtml(kind: string): string {
  const url = assetUrl(`ui/${kind}`);
  return url ? `<img class="cur" alt="" src="${url}">` : `<span class="cur" data-cur="${kind}">${CUR_SYMBOL[kind] ?? ''}</span>`;
}
