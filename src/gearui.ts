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

/**
 * The Gear tab: a paperdoll with twelve slots around the Lord, the pieces of the selected
 * slot to wear, and the forge that turns Spoils into a random piece.
 */
export class GearPanel {
  private selected: SlotId = 'helm';
  private slotButtons = new Map<SlotId, HTMLButtonElement>();
  private pieces: HTMLElement;
  private forgeBtn: HTMLButtonElement;
  private result: HTMLElement;
  private last = '';
  private sets: HTMLElement;

  constructor(private game: Game, root: HTMLElement, private onChange: () => void) {
    const doll = document.createElement('div');
    doll.className = 'paperdoll';
    const left = document.createElement('div');
    left.className = 'doll-col';
    const right = document.createElement('div');
    right.className = 'doll-col';
    const lord = document.createElement('div');
    lord.className = 'doll-lord';
    const lordUrl = assetUrl('characters/lord');
    lord.innerHTML = lordUrl ? `<img alt="" src="${lordUrl}">` : '';
    SLOTS.forEach((slot, i) => {
      const btn = document.createElement('button');
      btn.className = 'doll-slot';
      btn.addEventListener('click', () => {
        this.selected = slot.id;
        this.update();
      });
      (i < 6 ? left : right).appendChild(btn);
      this.slotButtons.set(slot.id, btn);
    });
    doll.append(left, lord, right);
    root.appendChild(doll);

    this.sets = document.createElement('div');
    this.sets.className = 'gear-sets';
    root.appendChild(this.sets);

    this.pieces = document.createElement('div');
    this.pieces.className = 'list compact';
    root.appendChild(this.pieces);

    const forge = document.createElement('div');
    forge.className = 'forge';
    forge.innerHTML = `<div class="info"><span class="name">The Forge</span><span class="desc">Spend Spoils from Champions on a Random Piece. A Piece You Already Own Grows Stronger.</span><span class="stat forge-result"></span></div>`;
    this.forgeBtn = document.createElement('button');
    this.forgeBtn.className = 'buy';
    this.forgeBtn.addEventListener('click', () => {
      const r = this.game.forge();
      if (!r) return;
      this.selected = r.item.slot;
      this.last = r.isNew ? `New: ${r.item.name}` : `${r.item.name} Reaches Lv ${r.level}`;
      this.onChange();
    });
    forge.appendChild(this.forgeBtn);
    this.result = forge.querySelector('.forge-result')!;
    root.appendChild(forge);
  }

  update(): void {
    const gear = this.game.save.gear;
    for (const slot of SLOTS) {
      const btn = this.slotButtons.get(slot.id)!;
      const worn = gear.equipped[slot.id] ? ITEMS.find((i) => i.id === gear.equipped[slot.id]) : undefined;
      btn.classList.toggle('selected', slot.id === this.selected);
      btn.classList.toggle('empty', !worn);
      btn.style.setProperty('--set', worn?.set ? setColor(worn) : 'var(--line)');
      btn.innerHTML = `${itemIcon(worn, '')}<span class="doll-name">${worn ? `${worn.name}` : slot.name}</span><span class="doll-lvl">${worn ? `Lv ${gear.owned[worn.id]}` : ''}</span>`;
    }

    this.sets.innerHTML = SETS.map((set) => {
      const n = setPieces(gear, set.build);
      const color = BUILDS.find((b) => b.id === set.build)!.color;
      const bonus = n >= 4 ? `×${SET_BONUS_4}` : n >= 2 ? `×${SET_BONUS_2}` : '—';
      return `<span class="gear-set" style="--set:${color}">${set.name} ${n}/4 · ${bonus}</span>`;
    }).join('');

    const slot = SLOTS.find((s) => s.id === this.selected)!;
    const items = ITEMS.filter((i) => i.slot === this.selected);
    this.pieces.innerHTML = '';
    for (const item of items) {
      const level = gear.owned[item.id] ?? 0;
      const worn = gear.equipped[slot.id] === item.id;
      const row = document.createElement('button');
      row.className = 'upgrade gear-piece';
      row.disabled = level === 0 || worn;
      row.classList.toggle('worn', worn);
      row.style.setProperty('--set', level && item.set ? setColor(item) : 'var(--line)');
      const set = item.set ? SETS.find((s) => s.build === item.set)! : undefined;
      const bonus = `+${fmt(Math.round(BONUS_PER_LEVEL[item.bonus] * Math.max(1, level) * 100))}% ${BONUS_NAMES[item.bonus]}`;
      row.innerHTML = level
        ? `${itemIcon(item, '')}<span class="info"><span class="name">${item.name} <span class="lvl">Lv ${level}</span></span><span class="stat">${bonus}${set ? ` · ${set.name}` : ''}</span></span><span class="cost">${worn ? 'Worn' : 'Wear'}</span>`
        : `${itemIcon(undefined, '?')}<span class="info"><span class="name">Unknown ${slot.name}</span><span class="stat">Not Forged Yet</span></span><span class="cost"></span>`;
      row.addEventListener('click', () => {
        if (this.game.equip(item.id)) this.onChange();
      });
      this.pieces.appendChild(row);
    }

    const cost = this.game.forgeCost();
    this.forgeBtn.textContent = `${fmt(cost)} Spoils`;
    this.forgeBtn.disabled = gear.spoils < cost || !this.game.canForge();
    const owned = Object.keys(gear.owned).length;
    this.result.textContent = `${fmt(gear.spoils)} Spoils · ${owned}/${ITEMS.length} Found${this.last ? ` · ${this.last}` : ''}`;
  }
}
