import { BUILDS, PACTS, TIER_SIGILS, pactEffect, pactMaxLevel, type BuildId, type PactDef, type PactId } from './game/config';
import type { Game } from './game/game';
import { assetUrl } from './assets';

export const SIGIL = '✦';

/** Lock symbol for buttons that only work between runs. */
export function lockHtml(): string {
  const url = assetUrl('ui/lock');
  return url ? `<img class="cur" alt="" src="${url}">` : '🔒';
}

export function sigilText(n: number): string {
  return `${n} ${SIGIL}`;
}

/** The pact's own icon, or its stand-in icon until that exists. */
export function pactIconUrl(def: PactDef): string | undefined {
  return assetUrl(`icons/${def.id}`) ?? (def.icon ? assetUrl(`icons/${def.icon}`) : undefined);
}

const BY_ID = new Map(PACTS.map((d) => [d.id, d]));
const TIER_NAMES: Record<number, string> = { 1: 'Start Pact', 2: 'Tier 2', 3: 'Tier 3', 4: 'Tier 4', 5: 'Capstone' };

/** Badge for a tree node: its own icon, else the stand-in icon, else a letter until the art exists. */
function badgeHtml(def: PactDef): string {
  const url = pactIconUrl(def);
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

  constructor(private game: Game, root: HTMLElement, detailHost: HTMLElement, private onChange: () => void, tabsHost: HTMLElement = root) {
    const tabs = document.createElement('div');
    tabs.className = 'branch-tabs';
    tabsHost.appendChild(tabs);
    for (const build of BUILDS) {
      const tab = document.createElement('button');
      tab.className = 'branch-tab';
      tab.style.setProperty('--branch', build.color);
      tab.innerHTML = `<span class="branch-name">${build.name}</span><span class="branch-desc"></span>`;
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
    this.detail.className = 'detail';
    this.detail.innerHTML = `
      <div class="detail-badge"></div>
      <div class="info"><span class="name"><span class="detail-name"></span> <span class="lvl"></span></span><span class="desc"></span><span class="stat"></span><span class="req"></span></div>`;
    this.buy = document.createElement('button');
    this.buy.className = 'buy teal wide';
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
    for (const [id, tab] of this.tabs) {
      tab.classList.toggle('active', id === this.branch);
      const spent = g.branchSpent(id);
      tab.querySelector('.branch-desc')!.textContent = spent > 0 ? `${sigilText(spent)} Spent` : BUILDS.find((b) => b.id === id)!.desc;
    }
    for (const [id, page] of this.pages) page.hidden = id !== this.branch;
    for (const def of PACTS) {
      const btn = this.nodes.get(def.id)!;
      const level = g.save.pacts[def.id];
      const owned = level > 0;
      const maxed = g.isPactMaxed(def.id);
      const locked = g.isPactLocked(def.id);
      const max = pactMaxLevel(def);
      btn.classList.toggle('owned', owned);
      btn.classList.toggle('locked', locked);
      btn.classList.toggle('ready', !locked && !maxed && g.canSpend() && g.save.sigils >= g.pactCost(def.id));
      btn.classList.toggle('selected', def.id === this.selected);
      const branchStarted = PACTS.some((p) => p.branch === def.branch && p.tier === 1 && g.save.pacts[p.id] > 0);
      btn.querySelector('.node-lvl')!.textContent = maxed
        ? max > 1 ? `Lv ${level}/${max}` : 'Owned'
        : locked
          ? branchStarted ? `Opens at ${TIER_SIGILS[def.tier] ?? 0}` : 'Locked'
          : owned ? `Lv ${level}/${max}` : sigilText(g.pactCost(def.id));
    }

    const def = BY_ID.get(this.selected)!;
    const level = g.save.pacts[def.id];
    const owned = level > 0;
    const maxed = g.isPactMaxed(def.id);
    const max = pactMaxLevel(def);
    const locked = g.isPactLocked(def.id);
    const cost = g.pactCost(def.id);
    const branch = BUILDS.find((b) => b.id === def.branch)!;
    this.detail.style.setProperty('--branch', branch.color);
    this.detail.querySelector('.detail-badge')!.innerHTML = badgeHtml(def);
    this.detail.querySelector('.detail-name')!.textContent = def.name;
    this.detail.querySelector('.lvl')!.textContent = max > 1 ? `Lv ${level}/${max}` : owned ? 'Owned' : '';
    this.detail.querySelector('.desc')!.textContent = def.desc;
    this.detail.querySelector('.stat')!.textContent =
      max > 1 && owned && !maxed ? `${pactEffect(def, level)} → ${pactEffect(def, level + 1)}` : pactEffect(def, level);
    const need = TIER_SIGILS[def.tier] ?? 0;
    const startOwned = PACTS.some((p) => p.branch === def.branch && p.tier === 1 && g.save.pacts[p.id] > 0);
    this.detail.querySelector('.req')!.textContent = !locked
      ? ''
      : startOwned
        ? `Opens at ${sigilText(need)} Spent in This Branch (${g.branchSpent(def.branch)} Now)`
        : `Requires the ${BY_ID.get(PACTS.find((p) => p.branch === def.branch && p.tier === 1)!.id)!.name} Start Pact`;
    const nextLv = max > 1 ? `Lv ${level + 1}/${max}` : 'Unlock';
    this.buy.innerHTML = maxed
      ? max > 1 ? 'MAX' : 'Owned'
      : !g.canSpend()
        ? `${lockHtml()}<small>After Run</small>`
        : `${sigilText(cost)}<small>${nextLv}</small>`;
    this.buy.disabled = maxed || locked || g.save.sigils < cost || !g.canSpend();
  }
}
