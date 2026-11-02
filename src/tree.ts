import { BUILDS, PACTS, type BuildId, type PactDef, type PactId } from './game/config';
import type { Game } from './game/game';
import { assetUrl } from './assets';

export const SIGIL = '✦';

export function sigilText(n: number): string {
  return `${n} ${SIGIL}`;
}

const BY_ID = new Map(PACTS.map((d) => [d.id, d]));
const TIER_NAMES: Record<number, string> = { 1: 'Start pact', 2: 'Tier 2', 3: 'Tier 3', 5: 'Capstone' };

/** Badge for a tree node: the upgrade icon, or a lettered stand-in until the art exists. */
function badgeHtml(def: PactDef): string {
  const url = assetUrl(`icons/${def.icon ?? def.id}`);
  if (url) return `<img class="node-icon" alt="" src="${url}">`;
  return `<span class="node-icon placeholder">${def.name[0]}</span>`;
}

/**
 * The "Dark Pacts" skill tree, bought with Sigils. One branch is shown at a time,
 * from the start pact down to the capstone; any one pact of a tier opens the next.
 * Tapping a node selects it; the detail panel shows it and the buy button.
 */
export class SkillTree {
  private branch: BuildId = 'aura';
  /** The player opened a branch themselves; until then follow the owned build. */
  private picked = false;
  private selected: PactId = 'pactAura';
  private tabs = new Map<BuildId, HTMLButtonElement>();
  private pages = new Map<BuildId, HTMLElement>();
  private nodes = new Map<PactId, HTMLButtonElement>();
  private detail: HTMLElement;
  private buy: HTMLButtonElement;

  constructor(private game: Game, root: HTMLElement, detailHost: HTMLElement, private onChange: () => void) {
    const tabs = document.createElement('div');
    tabs.className = 'branch-tabs';
    root.appendChild(tabs);
    for (const build of BUILDS) {
      const tab = document.createElement('button');
      tab.className = 'branch-tab';
      tab.style.setProperty('--branch', build.color);
      tab.innerHTML = `<span class="branch-name">${build.name}</span><span class="branch-desc">${build.desc}</span>`;
      tab.addEventListener('click', () => {
        this.picked = true;
        this.show(build.id);
      });
      tabs.appendChild(tab);
      this.tabs.set(build.id, tab);

      const page = document.createElement('div');
      page.className = 'tree';
      page.style.setProperty('--branch', build.color);
      const tiers = [...new Set(PACTS.filter((d) => d.branch === build.id).map((d) => d.tier))];
      for (const tier of tiers) {
        const row = document.createElement('div');
        row.className = 'tier';
        row.innerHTML = `<span class="tier-name">${TIER_NAMES[tier] ?? `Tier ${tier}`}</span>`;
        const nodes = document.createElement('div');
        nodes.className = 'tier-nodes';
        for (const def of PACTS.filter((d) => d.branch === build.id && d.tier === tier)) {
          const btn = document.createElement('button');
          btn.className = 'node';
          btn.innerHTML = `${badgeHtml(def)}<span class="node-name">${def.name}</span><span class="node-lvl"></span>`;
          btn.addEventListener('click', () => {
            this.selected = def.id;
            this.update();
          });
          nodes.appendChild(btn);
          this.nodes.set(def.id, btn);
        }
        row.appendChild(nodes);
        page.appendChild(row);
      }
      root.appendChild(page);
      this.pages.set(build.id, page);
    }

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

    this.show(this.ownedBranch() ?? 'aura');
  }

  /** First branch whose start pact is owned. */
  private ownedBranch(): BuildId | undefined {
    return BUILDS.find((b) => PACTS.some((p) => p.branch === b.id && p.tier === 1 && this.game.save.pacts[p.id] > 0))?.id;
  }

  private show(branch: BuildId): void {
    this.branch = branch;
    this.selected = PACTS.find((p) => p.branch === branch)!.id;
    this.update();
  }

  update(): void {
    const g = this.game;
    const followed = this.ownedBranch();
    if (!this.picked && followed && followed !== this.branch) this.show(followed);
    for (const [id, tab] of this.tabs) tab.classList.toggle('active', id === this.branch);
    for (const [id, page] of this.pages) page.hidden = id !== this.branch;
    for (const def of PACTS) {
      const btn = this.nodes.get(def.id)!;
      const owned = g.save.pacts[def.id] > 0;
      const locked = g.isPactLocked(def.id);
      btn.classList.toggle('owned', owned);
      btn.classList.toggle('locked', locked);
      btn.classList.toggle('ready', !locked && !owned && g.save.sigils >= g.pactCost(def.id));
      btn.classList.toggle('selected', def.id === this.selected);
      btn.querySelector('.node-lvl')!.textContent = owned ? 'Owned' : locked ? 'Locked' : sigilText(def.cost);
    }

    const def = BY_ID.get(this.selected)!;
    const owned = g.save.pacts[def.id] > 0;
    const locked = g.isPactLocked(def.id);
    const branch = BUILDS.find((b) => b.id === def.branch)!;
    this.detail.style.setProperty('--branch', branch.color);
    this.detail.querySelector('.detail-badge')!.innerHTML = badgeHtml(def);
    this.detail.querySelector('.detail-name')!.textContent = def.name;
    this.detail.querySelector('.lvl')!.textContent = owned ? 'Owned' : '';
    this.detail.querySelector('.desc')!.textContent = def.desc;
    const names = (def.requires ?? []).map((r) => BY_ID.get(r)!.name);
    this.detail.querySelector('.req')!.textContent = locked ? `Requires ${names.join(' or ')}` : '';
    this.buy.textContent = owned ? 'Owned' : sigilText(def.cost);
    this.buy.disabled = owned || locked || g.save.sigils < def.cost;
  }
}
