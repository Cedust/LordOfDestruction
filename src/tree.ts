import { BRANCHES, PACTS, type PactDef, type PactId } from './game/config';
import type { Game } from './game/game';
import { assetUrl } from './assets';

export const SIGIL = '✦';

export function sigilText(n: number): string {
  return `${n} ${SIGIL}`;
}

const BY_ID = new Map(PACTS.map((d) => [d.id, d]));

/** Badge for a tree node: the upgrade icon, or a lettered stand-in until the art exists. */
function badgeHtml(def: PactDef): string {
  const url = assetUrl(`icons/${def.id}`);
  if (url) return `<img class="node-icon" alt="" src="${url}">`;
  return `<span class="node-icon placeholder">${def.name[0]}</span>`;
}

/**
 * The "Dark Pacts" skill tree, bought with Sigils: three branches from root to capstone.
 * Tapping a node selects it; the panel below shows details and the buy button.
 */
export class SkillTree {
  private selected: PactId = PACTS[0].id;
  private nodes = new Map<PactId, HTMLButtonElement>();
  private detail: HTMLElement;
  private buy: HTMLButtonElement;

  constructor(private game: Game, root: HTMLElement, detailHost: HTMLElement, private onChange: () => void) {
    const grid = document.createElement('div');
    grid.className = 'tree';
    for (const branch of BRANCHES) {
      const col = document.createElement('div');
      col.className = 'branch';
      col.style.setProperty('--branch', branch.color);
      col.innerHTML = `<div class="branch-head"><span class="branch-name">${branch.name}</span><span class="branch-desc">${branch.desc}</span></div>`;
      for (const def of PACTS.filter((d) => d.branch === branch.id)) {
        const btn = document.createElement('button');
        btn.className = 'node';
        btn.innerHTML = `${badgeHtml(def)}<span class="node-name">${def.name}</span><span class="node-lvl"></span>`;
        btn.addEventListener('click', () => {
          this.selected = def.id;
          this.update();
        });
        col.appendChild(btn);
        this.nodes.set(def.id, btn);
      }
      grid.appendChild(col);
    }
    root.appendChild(grid);

    this.detail = document.createElement('div');
    this.detail.className = 'node-detail';
    this.detail.innerHTML = `
      <div class="detail-badge"></div>
      <div class="info"><span class="name"><span class="detail-name"></span> <span class="lvl"></span></span><span class="desc"></span><span class="req"></span></div>`;
    this.buy = document.createElement('button');
    this.buy.className = 'buy';
    this.buy.addEventListener('click', () => {
      if (this.game.buyPact(this.selected)) this.onChange();
    });
    this.detail.appendChild(this.buy);
    detailHost.appendChild(this.detail);
  }

  private levelText(id: PactId): string {
    const def = BY_ID.get(id)!;
    const level = this.game.save.pacts[id];
    if (def.maxLevel === 1) return level > 0 ? 'Owned' : '';
    return `${level}/${def.maxLevel}`;
  }

  update(): void {
    const g = this.game;
    for (const def of PACTS) {
      const btn = this.nodes.get(def.id)!;
      const level = g.save.pacts[def.id];
      const locked = g.isPactLocked(def.id);
      const maxed = g.isPactMaxed(def.id);
      btn.classList.toggle('owned', level > 0);
      btn.classList.toggle('locked', locked);
      btn.classList.toggle('ready', !locked && !maxed && g.save.sigils >= g.pactCost(def.id));
      btn.classList.toggle('selected', def.id === this.selected);
      btn.querySelector('.node-lvl')!.textContent = locked ? 'Locked' : this.levelText(def.id) || sigilText(g.pactCost(def.id));
    }

    const def = BY_ID.get(this.selected)!;
    const locked = g.isPactLocked(def.id);
    const maxed = g.isPactMaxed(def.id);
    const cost = g.pactCost(def.id);
    const branch = BRANCHES.find((b) => b.id === def.branch)!;
    this.detail.style.setProperty('--branch', branch.color);
    this.detail.querySelector('.detail-badge')!.innerHTML = badgeHtml(def);
    this.detail.querySelector('.detail-name')!.textContent = def.name;
    this.detail.querySelector('.lvl')!.textContent = this.levelText(def.id);
    this.detail.querySelector('.desc')!.textContent = def.desc;
    this.detail.querySelector('.req')!.textContent = locked ? `Requires ${BY_ID.get(def.requires!)!.name}` : '';
    this.buy.textContent = maxed ? (def.maxLevel === 1 ? 'Owned' : 'Max') : sigilText(cost);
    this.buy.disabled = maxed || locked || g.save.sigils < cost;
  }
}
