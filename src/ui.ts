import { BUILDS, HEROES, PACTS, PRESTIGE_UPGRADES, RUN_UPGRADES, SHOCKWAVE_HITS, SIGIL_WAVES, type PrestigeId, type RunUpgradeId } from './game/config';
import { fmt, type Game } from './game/game';
import { computeStats, type LordStats } from './game/stats';
import { assetUrl } from './assets';
import { SIGIL, SkillTree, pactIconUrl } from './tree';

type Tab = 'powers' | 'dread' | 'pacts';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Upgrade icon from assets/icons/<id>.png. */
function iconHtml(id: string, name: string): string {
  return iconTag(assetUrl(`icons/${id}`), name);
}

function iconTag(url: string | undefined, name: string): string {
  return url ? `<img class="icon" alt="" src="${url}">` : `<span class="icon placeholder">${name[0]}</span>`;
}

/** Human-readable value of the stat an upgrade improves. */
function statText(id: RunUpgradeId, s: LordStats): string {
  switch (id) {
    case 'vitality':
      return `${fmt(s.maxHp)} Life`;
    case 'hide':
      return `${Math.round(s.armor * 100)}% Blocked`;
    case 'regen':
      return `${fmt(s.regen)}/s`;
    case 'aura':
      return `${fmt(s.auraDps[1])} Dmg/s`;
    case 'thorns':
      return `${Math.round(s.thorns * 100)}% of Each Hit`;
    case 'lash':
      return `${fmt(s.maxHp * s.lash)} Dmg per Lash`;
    case 'shockwave':
      return s.shockwaveDamage > 0 ? `${fmt(s.shockwaveDamage)} Dmg Every ${SHOCKWAVE_HITS} Hits` : 'None';
    case 'bloodPact':
      return s.bloodPact > 0 ? `${Math.round(s.bloodPact * 100)}% per Kill` : 'None';
  }
}

/** What a Dread upgrade gives at a level, in plain numbers. */
function dreadText(id: PrestigeId, lvl: number): string {
  const pct = (n: number) => `+${Math.round(n * 100)}%`;
  switch (id) {
    case 'blackHeart':
      return `${pct(0.25 * lvl)} Life and Regeneration`;
    case 'malice':
      return `${pct(0.15 * lvl)} All Damage`;
    case 'gloom':
      return `${pct(0.4 * lvl)} Aura Damage`;
    case 'barbs':
      return `${pct(0.4 * lvl)} Thorns Damage`;
    case 'sanguine':
      return `${pct(0.4 * lvl)} Lash Damage`;
    case 'tremor':
      return `${pct(0.4 * lvl)} Shockwave Damage`;
    case 'tithe':
      return `${pct(0.2 * lvl)} Gold`;
    case 'avarice':
      return `−${Math.round(5 * lvl)}% Power Cost`;
    case 'dreadHarvest':
      return `${pct(0.1 * lvl)} Experience`;
    case 'headStart':
      return `Start at Wave ${1 + 5 * lvl}`;
  }
}

export class UI {
  private runButtons = new Map<RunUpgradeId, HTMLButtonElement>();
  private trees: SkillTree[] = [];
  private prestigeArmed = false;
  private prestigeTimer = 0;

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
    const prestige = $<HTMLButtonElement>('#prestige');
    prestige.addEventListener('click', () => {
      // Two taps, so a stray tap never ends a run.
      if (!this.prestigeArmed) {
        this.prestigeArmed = true;
        clearTimeout(this.prestigeTimer);
        this.prestigeTimer = window.setTimeout(() => {
          this.prestigeArmed = false;
          this.update();
        }, 3000);
      } else {
        this.prestigeArmed = false;
        this.game.prestige();
        this.setFallenView('dread');
      }
      this.update();
    });
    $('.bars').addEventListener('click', () => {
      this.game.save.barPercent = !this.game.save.barPercent;
      this.game.onPersist();
      this.update();
    });
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
        <span class="info"><span class="name">${def.name} <span class="lvl"></span></span><span class="desc">${def.desc}</span><span class="stat"></span></span>
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
        ${iconTag(pactIconUrl(pact), pact.name)}
        <span class="info"><span class="name">${build.name}</span><span class="tag">${build.desc}</span><span class="desc">${pact.desc}</span></span>`;
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
    const pct = g.save.barPercent;
    $('#hp-text').textContent = pct ? `${Math.floor(hpPct)}%` : `${fmt(Math.max(0, g.run.lordHp))} / ${fmt(s.maxHp)}`;
    const lvl = g.levelProgress();
    $('#level-fill').style.width = `${(lvl.into / lvl.need) * 100}%`;
    $('#level-text').textContent = pct ? `${Math.floor((lvl.into / lvl.need) * 100)}% XP` : `${fmt(Math.floor(lvl.into))} / ${fmt(lvl.need)} XP`;
    $('#level-num').textContent = String(lvl.level);
    $('#level-box').classList.toggle('flash', g.time - g.levelUpTime < 1.2);
    $('#level-bar').classList.toggle('flash', g.time - g.levelUpTime < 1.2);
    const prestige = $<HTMLButtonElement>('#prestige');
    prestige.disabled = !g.canPrestige();
    if (prestige.disabled) this.prestigeArmed = false;
    prestige.classList.toggle('confirm', this.prestigeArmed);
    prestige.textContent = this.prestigeArmed ? 'Confirm' : 'Prestige';
    const status = $('#status');
    if (g.phase === 'pause') status.textContent = `Wave ${g.run.wave} Approaches…`;
    else if (g.phase === 'fighting') {
      const champ = g.heroes.some((h) => h.kind === 'champion');
      status.textContent = champ ? `A ${HEROES.champion.name} Leads the Charge!` : `${g.heroes.length} Heroes Remain`;
    } else status.textContent = 'You Have Fallen.';

    for (const def of RUN_UPGRADES) {
      const btn = this.runButtons.get(def.id)!;
      btn.hidden = !g.isRunUpgradeAvailable(def.id);
      if (btn.hidden) continue;
      const level = g.run.levels[def.id];
      const maxed = g.isRunUpgradeMaxed(def.id);
      const cost = g.runUpgradeCost(def.id);
      const next = computeStats({ ...g.run.levels, [def.id]: level + 1 }, g.save.prestige, g.save.pacts);
      btn.querySelector('.lvl')!.textContent = `Lv ${g.runUpgradeLevel(def.id)}`;
      btn.querySelector('.stat')!.textContent = maxed ? statText(def.id, s) + ' (Max)' : `${statText(def.id, s)} → ${statText(def.id, next)}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)}g`;
      btn.disabled = maxed || g.run.gold < cost || g.phase === 'fallen';
    }

    document.querySelectorAll<HTMLButtonElement>('.upgrade.dread').forEach((btn) => {
      const id = btn.dataset.id as PrestigeId;
      const level = g.save.prestige[id];
      const maxed = g.isPrestigeMaxed(id);
      const cost = g.prestigeCost(id);
      btn.querySelector('.lvl')!.textContent = `Lv ${level}`;
      btn.querySelector('.stat')!.textContent = maxed ? dreadText(id, level) + ' (Max)' : `${dreadText(id, level)} → ${dreadText(id, level + 1)}`;
      btn.querySelector('.cost')!.textContent = maxed ? 'MAX' : `${fmt(cost)} ☠`;
      btn.disabled = maxed || g.save.dread < cost || !g.canSpend();
    });

    for (const tree of this.trees) tree.update();
    const spent = g.sigilsSpent();
    document.querySelectorAll<HTMLButtonElement>('.reset-pacts').forEach((b) => {
      b.disabled = spent === 0 || g.phase !== 'fallen';
      b.textContent = spent > 0 ? `Reset Pacts (+${spent} ${SIGIL})` : 'Reset Pacts';
    });
    const nextRecord = (Math.floor(g.save.bestWave / SIGIL_WAVES) + 1) * SIGIL_WAVES;
    const sigilHint = `${g.save.sigils} ${SIGIL} Sigils · Next at Wave ${nextRecord}`;
    $('#pacts-preview').textContent = g.canSpend() ? sigilHint : `${sigilHint} · Spend Them After You Prestige`;
    $('#pacts-preview').classList.toggle('locked-hint', !g.canSpend());
    $('#fallen-sigil-hint').textContent = sigilHint;

    $('#choose').hidden = !(g.phase === 'pause' && !g.hasBuild());

    const overlay = $('#fallen');
    overlay.hidden = g.phase !== 'fallen';
    if (g.phase === 'fallen' && g.lastSummary) {
      const sum = g.lastSummary;
      $('#fallen-title').textContent = sum.manual ? 'You Withdraw' : 'You Have Fallen';
      $('#fallen-wave').textContent = String(sum.wave);
      $('#fallen-level').textContent =
        sum.levels > 0
          ? `Level ${g.level()} · +${sum.levels} Level${sum.levels > 1 ? 's' : ''} This Run`
          : `Level ${g.level()}`;
      $('#fallen-sigils').textContent = sum.sigils > 0 ? `+${sum.sigils} ${SIGIL} Sigil${sum.sigils > 1 ? 's' : ''}` : '';
      $('#fallen-runs').textContent = `Run ${g.save.runs}`;
      $('#fallen-best').textContent = sum.newBest ? 'A New Record!' : `Best: Wave ${sum.bestWave}`;
      $('#fallen-total').textContent = fmt(g.save.dread);
    }
    const dreadHint = `Level ${lvl.level} · Every Level Gives +${g.nextLevelDread()} ☠ Dread`;
    $('#dread-preview').textContent = g.canSpend() ? dreadHint : `${dreadHint} · Spend It After You Prestige`;
    $('#dread-preview').classList.toggle('locked-hint', !g.canSpend());
  }
}
