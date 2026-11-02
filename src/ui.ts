import { BUILDS, HEROES, PACTS, PRESTIGE_UPGRADES, RANGES, RUN_UPGRADES, SIGIL_WAVES, type PrestigeId, type RunUpgradeId } from './game/config';
import { fmt, type Game } from './game/game';
import { computeStats, type LordStats } from './game/stats';
import { assetUrl } from './assets';
import { SIGIL, SkillTree } from './tree';

type Tab = 'powers' | 'dread' | 'pacts';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Upgrade icon from assets/icons/<id>.png. */
function iconHtml(id: string, name: string): string {
  const url = assetUrl(`icons/${id}`);
  return url ? `<img class="icon" alt="" src="${url}">` : `<span class="icon placeholder">${name[0]}</span>`;
}

/** Human-readable value of the stat an upgrade improves. */
function statText(id: RunUpgradeId, s: LordStats): string {
  switch (id) {
    case 'vitality':
      return `${fmt(s.maxHp)} life`;
    case 'hide':
      return `${Math.round(s.armor * 100)}% blocked`;
    case 'regen':
      return `${fmt(s.regen)}/s`;
    case 'aura':
      return RANGES.map((r, i) => `${r.name} ${fmt(s.auraDps[i])}`).join(' · ') + ' dmg/s';
    case 'thorns':
      return `${Math.round(s.thorns * 100)}% of each hit`;
    case 'lash':
      return `${fmt(s.maxHp * s.lash)} dmg per lash`;
    case 'shockwave':
      return s.shockwaveDamage > 0 ? `${fmt(s.shockwaveDamage)} dmg` : 'locked';
    case 'bloodPact':
      return s.bloodPact > 0 ? `${Math.round(s.bloodPact * 100)}% per kill` : 'none';
  }
}

export class UI {
  private runButtons = new Map<RunUpgradeId, HTMLButtonElement>();
  private trees: SkillTree[] = [];

  constructor(private game: Game, private onSpeed: () => void) {
    this.buildRunList();
    this.buildPrestigeList($('#dread-upgrades'));
    this.buildPrestigeList($('#fallen-dread'));
    this.trees = [
      new SkillTree(game, $('#pacts-tree'), $('#pacts-tree'), () => this.update()),
      new SkillTree(game, $('#fallen-tree'), $('#fallen-detail'), () => this.update()),
    ];
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) =>
      b.addEventListener('click', () => this.setTab(b.dataset.tab as Tab)),
    );
    document.querySelectorAll<HTMLButtonElement>('.seg').forEach((b) =>
      b.addEventListener('click', () => this.setFallenView(b.dataset.view as 'dread' | 'pacts')),
    );
    document.querySelectorAll<HTMLButtonElement>('.reset-pacts').forEach((b) =>
      b.addEventListener('click', () => {
        this.game.resetPacts();
        this.update();
      }),
    );
    $('#speed').addEventListener('click', () => this.onSpeed());
    this.buildChooser();
    $('#rise').addEventListener('click', () => {
      this.game.rise();
      this.update();
    });
    this.setFallenView('dread');
    this.setTab('powers');
  }

  private setTab(tab: Tab): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $('#powers-list').hidden = tab !== 'powers';
    $('#dread-list').hidden = tab !== 'dread';
    $('#pacts-list').hidden = tab !== 'pacts';
  }

  /** The fallen screen shows either the Dread upgrades or the pact tree. */
  private setFallenView(view: 'dread' | 'pacts'): void {
    document.querySelectorAll<HTMLButtonElement>('.seg').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    $('#fallen-dread').hidden = view !== 'dread';
    $('#fallen-pacts').hidden = view !== 'pacts';
    $('#fallen-detail').hidden = view !== 'pacts';
  }

  private buildPrestigeList(list: HTMLElement): void {
    for (const def of PRESTIGE_UPGRADES) {
      const btn = document.createElement('button');
      btn.className = 'upgrade dread';
      btn.dataset.id = def.id;
      btn.innerHTML = `
        ${iconHtml(def.id, def.name)}
        <span class="info"><span class="name">${def.name} <span class="lvl"></span></span><span class="desc">${def.desc}</span></span>
        <span class="cost"></span>`;
      btn.addEventListener('click', () => {
        if (this.game.buyPrestige(def.id)) this.update();
      });
      list.appendChild(btn);
    }
  }

  /** Start pact picker, shown while no build is owned (first game, or after a reset). */
  private buildChooser(): void {
    const list = $('#choose-list');
    for (const build of BUILDS) {
      const pact = PACTS.find((p) => p.branch === build.id && p.tier === 1)!;
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.style.setProperty('--branch', build.color);
      btn.innerHTML = `
        ${iconHtml(pact.icon ?? pact.id, pact.name)}
        <span class="info"><span class="name">${build.name}</span><span class="tag">${build.desc}</span><span class="desc">${pact.desc.replace('Start pact. ', '')}</span></span>`;
      btn.addEventListener('click', () => {
        if (this.game.chooseBuild(build.id)) this.update();
      });
      list.appendChild(btn);
    }
  }

  private buildRunList(): void {
    const list = $('#powers-list');
    for (const def of RUN_UPGRADES) {
      const btn = document.createElement('button');
      btn.className = 'upgrade';
      btn.innerHTML = `
        ${iconHtml(def.id, def.name)}
        <span class="info"><span class="name">${def.name} <span class="lvl"></span></span><span class="desc">${def.desc}</span><span class="stat"></span></span>
        <span class="cost"></span>`;
      btn.addEventListener('click', () => {
        if (this.game.buyRunUpgrade(def.id)) this.update();
      });
      list.appendChild(btn);
      this.runButtons.set(def.id, btn);
    }
  }

  update(): void {
    const g = this.game;
    const s = g.stats;
    $('#wave').textContent = String(g.run.wave);
    $('#gold').textContent = fmt(Math.floor(g.run.gold));
    $('#dread').textContent = fmt(g.save.dread);
    $('#best').textContent = String(g.save.bestWave);
    $('#sigils').textContent = String(g.save.sigils);
    $('#speed').textContent = `${g.save.speed}×`;

    const hpPct = Math.max(0, g.run.lordHp / s.maxHp) * 100;
    $('#hp-fill').style.width = `${hpPct}%`;
    $('#hp-text').textContent = `${fmt(Math.max(0, g.run.lordHp))} / ${fmt(s.maxHp)}`;
    const status = $('#status');
    if (g.phase === 'pause') status.textContent = `Wave ${g.run.wave} approaches…`;
    else if (g.phase === 'fighting') {
      const champ = g.heroes.some((h) => h.kind === 'champion');
      status.textContent = champ ? `A ${HEROES.champion.name} leads the charge!` : `${g.heroes.length} heroes remain`;
    } else status.textContent = 'You have fallen.';

    for (const def of RUN_UPGRADES) {
      const btn = this.runButtons.get(def.id)!;
      btn.hidden = !g.isRunUpgradeAvailable(def.id);
      if (btn.hidden) continue;
      const level = g.run.levels[def.id];
      const maxed = g.isRunUpgradeMaxed(def.id);
      const cost = g.runUpgradeCost(def.id);
      const next = computeStats({ ...g.run.levels, [def.id]: level + 1 }, g.save.prestige, g.save.pacts);
      btn.querySelector('.lvl')!.textContent = `Lv ${g.runUpgradeLevel(def.id)}`;
      btn.querySelector('.stat')!.textContent = maxed ? statText(def.id, s) + ' (max)' : `${statText(def.id, s)} → ${statText(def.id, next)}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)}g`;
      btn.disabled = maxed || g.run.gold < cost || g.phase === 'fallen';
    }

    document.querySelectorAll<HTMLButtonElement>('.upgrade.dread').forEach((btn) => {
      const id = btn.dataset.id as PrestigeId;
      const level = g.save.prestige[id];
      const maxed = g.isPrestigeMaxed(id);
      const cost = g.prestigeCost(id);
      btn.querySelector('.lvl')!.textContent = `Lv ${level}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)} ☠`;
      btn.disabled = maxed || g.save.dread < cost;
    });

    for (const tree of this.trees) tree.update();
    const spent = g.sigilsSpent();
    document.querySelectorAll<HTMLButtonElement>('.reset-pacts').forEach((b) => {
      b.disabled = spent === 0 || g.phase !== 'fallen';
      b.textContent = spent > 0 ? `Reset pacts (+${spent} ${SIGIL})` : 'Reset pacts';
    });
    const nextRecord = (Math.floor(g.save.bestWave / SIGIL_WAVES) + 1) * SIGIL_WAVES;
    const sigilHint = `${g.save.sigils} ${SIGIL} Sigils. Fall at wave ${nextRecord} or later for the next one.`;
    $('#pacts-preview').textContent = sigilHint;
    $('#fallen-sigil-hint').textContent = sigilHint;

    $('#choose').hidden = !(g.phase === 'pause' && !g.hasBuild());
    $('#choose-sigils').textContent = `${g.save.sigils} ${SIGIL}`;

    const overlay = $('#fallen');
    overlay.hidden = g.phase !== 'fallen';
    if (g.phase === 'fallen' && g.lastSummary) {
      const sum = g.lastSummary;
      $('#fallen-wave').textContent = String(sum.wave);
      $('#fallen-dread-gain').textContent = fmt(sum.dread);
      $('#fallen-sigils').textContent = sum.sigils > 0 ? `+${sum.sigils} ${SIGIL} Sigil${sum.sigils > 1 ? 's' : ''} for the new record` : '';
      $('#fallen-bonus').textContent = sum.dreadBonus > 0 ? `incl. +${fmt(sum.dreadBonus)} from Dread Harvest` : '';
      $('#fallen-runs').textContent = `Fall ${g.save.runs}`;
      $('#fallen-best').textContent = sum.newBest ? 'A new record!' : `Best: wave ${sum.bestWave}`;
      $('#fallen-total').textContent = fmt(g.save.dread);
    }
    $('#dread-preview').textContent = `If you fall at this wave: +${fmt(g.dreadForFall(g.run.wave))} ☠ Dread.`;
  }
}
