import { HEROES, PRESTIGE_UPGRADES, RUN_UPGRADES, dreadForWave, type PrestigeId, type RunUpgradeId } from './game/config';
import { fmt, type Game } from './game/game';
import { computeStats, type LordStats } from './game/stats';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

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
      return `${fmt(s.auraDps)} dmg/s`;
    case 'radius':
      return `reach ${Math.round(s.auraRadius)}`;
    case 'thorns':
      return `${Math.round(s.thorns * 100)}% reflected`;
    case 'shockwave':
      return s.shockwaveDamage > 0 ? `${fmt(s.shockwaveDamage)} dmg` : 'locked';
    case 'bloodPact':
      return s.bloodPact > 0 ? `${Math.round(s.bloodPact * 100)}% per kill` : 'none';
  }
}

export class UI {
  private runButtons = new Map<RunUpgradeId, HTMLButtonElement>();
  private prestigeButtons = new Map<PrestigeId, HTMLButtonElement>();

  constructor(private game: Game, private onSpeed: () => void) {
    this.buildRunList();
    this.buildPrestigeList($('#dread-list'));
    this.buildPrestigeList($('#fallen-dread-list'));
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) =>
      b.addEventListener('click', () => this.setTab(b.dataset.tab as 'powers' | 'dread')),
    );
    $('#speed').addEventListener('click', () => this.onSpeed());
    $('#rise').addEventListener('click', () => {
      this.game.rise();
      this.update();
    });
    this.setTab('powers');
  }

  private setTab(tab: 'powers' | 'dread'): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $('#powers-list').hidden = tab !== 'powers';
    $('#dread-list').hidden = tab !== 'dread';
  }

  private buildRunList(): void {
    const list = $('#powers-list');
    for (const def of RUN_UPGRADES) {
      const btn = document.createElement('button');
      btn.className = 'upgrade';
      btn.innerHTML = `
        <img class="icon" alt="" src="assets/icons/${def.id}.png" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'icon ph',textContent:'${def.name[0]}'}))">
        <span class="info"><span class="name">${def.name} <span class="lvl"></span></span><span class="desc">${def.desc}</span><span class="stat"></span></span>
        <span class="cost"></span>`;
      btn.addEventListener('click', () => {
        if (this.game.buyRunUpgrade(def.id)) this.update();
      });
      list.appendChild(btn);
      this.runButtons.set(def.id, btn);
    }
  }

  private buildPrestigeList(list: HTMLElement): void {
    for (const def of PRESTIGE_UPGRADES) {
      const btn = document.createElement('button');
      btn.className = 'upgrade dread';
      btn.dataset.id = def.id;
      btn.innerHTML = `
        <span class="icon ph dread-ph">${def.name[0]}</span>
        <span class="info"><span class="name">${def.name} <span class="lvl"></span></span><span class="desc">${def.desc}</span></span>
        <span class="cost"></span>`;
      btn.addEventListener('click', () => {
        if (this.game.buyPrestige(def.id)) {
          if (this.game.phase !== 'fallen') this.game.refreshStats();
          this.update();
        }
      });
      list.appendChild(btn);
      if (list.id === 'dread-list') this.prestigeButtons.set(def.id, btn);
    }
  }

  update(): void {
    const g = this.game;
    const s = g.stats;
    $('#wave').textContent = String(g.run.wave);
    $('#gold').textContent = fmt(Math.floor(g.run.gold));
    $('#dread').textContent = fmt(g.save.dread);
    $('#best').textContent = String(g.save.bestWave);
    $('#speed').textContent = `${g.save.speed}×`;

    const hpPct = Math.max(0, g.run.lordHp / s.maxHp) * 100;
    $('#hp-fill').style.width = `${hpPct}%`;
    $('#hp-text').textContent = `${fmt(Math.max(0, g.run.lordHp))} / ${fmt(s.maxHp)}`;
    const rally = g.phase === 'fighting' ? g.rallyMultiplier() : 1;
    const status = $('#status');
    if (g.phase === 'pause') status.textContent = `Wave ${g.run.wave} approaches…`;
    else if (g.phase === 'fighting') {
      const champ = g.heroes.some((h) => h.kind === 'champion');
      status.textContent = rally > 1 ? `The heroes rally! ×${rally.toFixed(1)} damage` : champ ? `A ${HEROES.champion.name} leads the charge!` : `${g.heroes.length} heroes remain`;
    } else status.textContent = 'You have fallen.';
    status.classList.toggle('warn', rally > 1);

    for (const def of RUN_UPGRADES) {
      const btn = this.runButtons.get(def.id)!;
      const level = g.run.levels[def.id];
      const maxed = g.isRunUpgradeMaxed(def.id);
      const cost = g.runUpgradeCost(def.id);
      const next = computeStats({ ...g.run.levels, [def.id]: level + 1 }, g.save.prestige);
      btn.querySelector('.lvl')!.textContent = `Lv ${level}`;
      btn.querySelector('.stat')!.textContent = maxed ? statText(def.id, s) + ' (max)' : `${statText(def.id, s)} → ${statText(def.id, next)}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)}g`;
      btn.disabled = maxed || g.run.gold < cost || g.phase === 'fallen';
    }

    document.querySelectorAll<HTMLButtonElement>('.upgrade.dread').forEach((btn) => {
      const id = btn.dataset.id as PrestigeId;
      const level = g.save.prestige[id];
      const maxed = g.isPrestigeMaxed(id);
      const cost = g.prestigeCost(id);
      btn.querySelector('.lvl')!.textContent = maxed && level === 1 ? 'Unlocked' : `Lv ${level}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)} ☠`;
      btn.disabled = maxed || g.save.dread < cost;
    });

    const overlay = $('#fallen');
    overlay.hidden = g.phase !== 'fallen';
    if (g.phase === 'fallen' && g.lastSummary) {
      const sum = g.lastSummary;
      $('#fallen-wave').textContent = String(sum.wave);
      $('#fallen-dread').textContent = fmt(sum.dread);
      $('#fallen-best').textContent = sum.newBest ? 'A new record!' : `Best: wave ${sum.bestWave}`;
      $('#fallen-total').textContent = fmt(g.save.dread);
    }
    $('#dread-preview').textContent = `If you fall at this wave: +${fmt(dreadForWave(g.run.wave))} ☠ Dread`;
  }
}
