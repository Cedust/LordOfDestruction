import { HEROES, MILESTONE_EVERY, MILESTONE_MULT, PRESTIGE_UPGRADES, RUN_UPGRADES, type PrestigeId, type RunUpgradeId } from './game/config';
import { fmt, fmtBonus, fmtShare, type Game } from './game/game';
import { blockShare, computeStats, dreadMult, type LordStats } from './game/stats';
import { assetUrl } from './assets';
import { lockHtml, SkillTree } from './tree';
import { curHtml, GearPanel } from './gearui';

type Tab = 'powers' | 'dread' | 'pacts' | 'gear';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const $$ = <T extends HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

/** Upgrade icon from assets/icons/<id>.png. */
function iconHtml(id: string, name: string): string {
  const url = assetUrl(`icons/${id}`);
  return url ? `<img class="icon" alt="" src="${url}">` : `<span class="icon placeholder">${name[0]}</span>`;
}

/** Human-readable value of the stat an upgrade improves. */
function statText(id: RunUpgradeId, s: LordStats, wave: number): string {
  switch (id) {
    case 'vitality':
      return `${fmt(s.maxHp)} Max Life`;
    case 'hide':
      return `${Math.round(blockShare(s.armor, wave) * 100)}% Blocked`;
    case 'regen':
      return `${fmt(s.regen)} Life/s`;
    case 'shockwave':
      return `${fmt(s.shockwave)} Dmg to All`;
    case 'aura':
      return `${fmt(s.auraDps[1])} Dmg/s`;
    case 'thorns':
      return `${fmtShare(s.thorns)} of Each Hit`;
    case 'lash':
      return `${fmt(s.maxHp * s.lash)} Dmg per Lash`;
    case 'bloodPact':
      return s.bloodPact > 0 ? `${Math.round(s.bloodPact * 100)}% per Kill` : 'None';
  }
}

/** What a Dread upgrade gives at a level, in plain numbers. */
function dreadText(id: PrestigeId, lvl: number): string {
  const pct = fmtBonus;
  const m = dreadMult(id, lvl) - 1;
  switch (id) {
    case 'blackHeart':
      return `${pct(m)} Life and Regeneration`;
    case 'malice':
      return `${pct(m)} All Damage`;
    case 'gloom':
      return `${pct(m)} Aura Damage`;
    case 'barbs':
      return `${pct(m)} Thorns Damage`;
    case 'sanguine':
      return `${pct(m)} Lash Damage`;
    case 'tremor':
      return `${pct(m)} Shockwave Damage`;
    case 'tithe':
      return `${pct(m)} Gold`;
    case 'avarice':
      return `−${Math.round(5 * lvl)}% Power Cost`;
    case 'dreadHarvest':
      return `${pct(0.1 * lvl)} Experience`;
    case 'headStart':
      return `Start at Wave ${1 + 5 * lvl}`;
  }
}

interface PowerRow {
  root: HTMLElement;
  name: HTMLElement;
  line: HTMLElement;
  buy: HTMLButtonElement;
  info: boolean;
}

/**
 * The whole screen: HUD over the battle, the Lord strip, one tab panel whose content
 * scrolls inside itself, the tab bar, the run summary and the settings sheet.
 */
export class UI {
  private tab: Tab = 'powers';
  private rows = new Map<RunUpgradeId, PowerRow>();
  private dreadCells = new Map<PrestigeId, HTMLButtonElement>();
  private dreadSel: PrestigeId = 'blackHeart';
  private tree: SkillTree;
  private gear: GearPanel;
  private prestigeArmed = false;
  private prestigeTimer = 0;
  private restartArmed = false;
  private restartTimer = 0;
  /** The summary of the last run is shown until the player taps Continue. */
  private summaryOpen = false;
  private wasFallen = false;

  constructor(
    private game: Game,
    private onSpeed: (speed: number) => void,
    private onRestart: () => void,
    private onUpdate: () => void,
  ) {
    this.fillIcons();
    this.buildPowers();
    this.buildDread();
    this.tree = new SkillTree(game, $('#pacts-tree'), $('#pacts-detail'), () => this.update(), $('#pacts-branches'));
    this.gear = new GearPanel(game, $('#gear-list'), $('#forge'), $('#spoils'), () => this.update());

    $$<HTMLButtonElement>('.tab').forEach((b) => b.addEventListener('click', () => this.setTab(b.dataset.tab as Tab)));
    $$<HTMLButtonElement>('#buy-mode button').forEach((b) =>
      b.addEventListener('click', () => {
        this.game.save.buyMode = Number(b.dataset.mode);
        this.game.onPersist();
        this.update();
      }),
    );
    $$<HTMLButtonElement>('.reset-pacts').forEach((b) =>
      b.addEventListener('click', () => {
        this.game.resetPacts();
        this.update();
      }),
    );
    this.bindPanelResize();

    const prestige = $<HTMLButtonElement>('#prestige');
    prestige.addEventListener('click', () => {
      if (this.game.phase === 'fallen') {
        this.game.rise();
        this.setTab('powers');
        this.update();
        return;
      }
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
      }
      this.update();
    });
    $('#bars').addEventListener('click', () => this.setBarPercent(!this.game.save.barPercent));
    $('#sum-continue').addEventListener('click', () => {
      this.summaryOpen = false;
      this.setTab('dread');
      this.update();
    });

    $('#settings-btn').addEventListener('click', () => {
      $('#settings').hidden = false;
      this.update();
    });
    $('#settings-close').addEventListener('click', () => this.closeSettings());
    $('#settings').addEventListener('click', (e) => {
      if (e.target === $('#settings')) this.closeSettings();
    });
    // Fullscreen hides the browser bars. Not every browser allows it (iPhone Safari does not), so the row hides there.
    const root = document.documentElement;
    if (!root.requestFullscreen || !document.fullscreenEnabled) $('#set-fs-row').hidden = true;
    $$<HTMLButtonElement>('#set-fs button').forEach((b) =>
      b.addEventListener('click', () => {
        const on = b.dataset.v === '1';
        if (on && !document.fullscreenElement) root.requestFullscreen().catch(() => {});
        if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }),
    );
    document.addEventListener('fullscreenchange', () => this.update());
    // Saves and reloads the page, so a new build shows up without the "Leave site?" prompt.
    $('#set-update').addEventListener('click', () => {
      $('#set-update').textContent = 'Loading…';
      this.onUpdate();
    });
    // Wipes the whole save. Two taps, like Prestige, so a stray tap never costs any progress.
    const restart = $<HTMLButtonElement>('#set-restart');
    restart.addEventListener('click', () => {
      if (this.restartArmed) {
        this.onRestart();
        return;
      }
      this.armRestart(true);
      this.restartTimer = window.setTimeout(() => this.armRestart(false), 3000);
    });
    $$<HTMLButtonElement>('#set-bars button').forEach((b) => b.addEventListener('click', () => this.setBarPercent(b.dataset.v === '1')));
    $$<HTMLButtonElement>('#set-speed button').forEach((b) =>
      b.addEventListener('click', () => {
        this.onSpeed(Number(b.dataset.v));
        this.update();
      }),
    );

    this.setTab('powers');
  }

  private armRestart(on: boolean): void {
    this.restartArmed = on;
    clearTimeout(this.restartTimer);
    const b = $<HTMLButtonElement>('#set-restart');
    b.classList.toggle('confirm', on);
    b.textContent = on ? 'Tap Again to Erase Everything' : 'Restart Game';
  }

  private closeSettings(): void {
    $('#settings').hidden = true;
    this.armRestart(false);
  }

  private setBarPercent(on: boolean): void {
    this.game.save.barPercent = on;
    this.game.onPersist();
    this.update();
  }

  /** Currency symbols, tab icons and the settings cog: real art where it exists. */
  private fillIcons(): void {
    $$('[data-cur]').forEach((el) => {
      el.outerHTML = curHtml(el.dataset.cur!);
    });
    const tabIcons: Record<Tab, string> = { powers: 'icons/shockwave', dread: 'icons/malice', pacts: 'icons/aura', gear: 'equipment/hornedHelm' };
    $$<HTMLButtonElement>('.tab').forEach((b) => {
      const url = assetUrl(tabIcons[b.dataset.tab as Tab]);
      if (url) b.querySelector('.tab-icon')!.innerHTML = `<img alt="" src="${url}">`;
    });
    const lord = assetUrl('characters/lord');
    if (lord) $<HTMLImageElement>('#sum-lord').src = lord;
    else $('#sum-lord').hidden = true;
  }

  /** Tap a grip to pull the panel up over the battle, tap again to drop it. A swipe on a header works too. */
  private bindPanelResize(): void {
    const app = $('#app');
    const set = (on: boolean) => {
      app.classList.toggle('expanded', on);
      window.dispatchEvent(new Event('resize'));
    };
    $$('.grip').forEach((g) => g.addEventListener('click', () => set(!app.classList.contains('expanded'))));
    $$('.ph').forEach((ph) => {
      let y0 = -1;
      ph.addEventListener('pointerdown', (e) => (y0 = e.clientY));
      ph.addEventListener('pointerup', (e) => {
        if (y0 < 0) return;
        const dy = e.clientY - y0;
        y0 = -1;
        if (dy < -30) set(true);
        else if (dy > 30) set(false);
      });
    });
  }

  private setTab(tab: Tab): void {
    this.tab = tab;
    $$<HTMLButtonElement>('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.page').forEach((p) => (p.hidden = p.dataset.page !== tab));
  }

  private buildPowers(): void {
    const list = $('#powers-list');
    for (const def of RUN_UPGRADES) {
      const root = document.createElement('div');
      root.className = 'row';
      root.innerHTML = `
        <button class="ico" aria-label="About ${def.name}">${iconHtml(def.id, def.name)}</button>
        <div class="txt"><span class="nm"></span><span class="line"></span></div>
        <button class="buy"></button>`;
      const row: PowerRow = { root, name: root.querySelector('.nm')!, line: root.querySelector('.line')!, buy: root.querySelector('.buy')!, info: false };
      root.querySelector('.ico')!.addEventListener('click', () => {
        row.info = !row.info;
        this.update();
      });
      row.buy.addEventListener('click', () => {
        if (this.game.buyRunUpgradeBulk(def.id, this.buyMax()) > 0) this.update();
      });
      list.appendChild(root);
      this.rows.set(def.id, row);
    }
  }

  private buyMax(): number {
    const m = this.game.save.buyMode ?? 1;
    return m === 0 ? Infinity : m;
  }

  private buildDread(): void {
    const grid = $('#dread-grid');
    for (const def of PRESTIGE_UPGRADES) {
      const btn = document.createElement('button');
      btn.className = 'dcell';
      btn.innerHTML = `${iconHtml(def.id, def.name)}<span class="dt"><span class="cn">${def.name}</span><span class="cl"></span></span><span class="cc"></span>`;
      btn.addEventListener('click', () => {
        this.dreadSel = def.id;
        this.update();
      });
      grid.appendChild(btn);
      this.dreadCells.set(def.id, btn);
    }
    const detail = $('#dread-detail');
    detail.innerHTML = `<span class="d-icon"></span><div class="txt"><span class="nm"><span class="d-name"></span><em class="d-lvl"></em></span><span class="ds d-desc"></span><span class="st d-stat"></span></div><button class="buy purple wide d-buy"></button>`;
    detail.querySelector('.d-buy')!.addEventListener('click', () => {
      if (this.game.buyPrestige(this.dreadSel)) this.update();
    });
  }

  update(): void {
    const g = this.game;
    const s = g.stats;
    const between = g.phase === 'fallen';
    if (between && !this.wasFallen && g.lastSummary) this.summaryOpen = true;
    this.wasFallen = between;
    if (!between) this.summaryOpen = false;

    // HUD
    $('#hud-gold').hidden = between;
    $('#hud-dread').hidden = !between;
    $('#hud-sigil').hidden = !between;
    $('#wave-box').classList.toggle('off', between);
    $('#gold').textContent = fmt(Math.floor(g.run.gold));
    $$('.dread-count').forEach((e) => (e.textContent = fmt(g.save.dread)));
    $$('.sigil-count').forEach((e) => (e.textContent = String(g.save.sigils)));
    $('#wave').textContent = String(g.run.wave);
    const left = g.phase === 'fighting' && g.waveTotal > 0 ? 1 - g.heroes.length / g.waveTotal : 0;
    $('#wave-prog').style.width = `${left * 100}%`;
    const champ = g.phase === 'fighting' && g.heroes.some((h) => h.kind === 'champion');
    const best = $('#best');
    best.textContent = champ ? `${HEROES.champion.name} Wave` : `Best ${g.save.bestWave}`;
    best.classList.toggle('champ', champ);
    $('#battle-wrap').classList.toggle('dim', between);
    const banner = $('#banner');
    banner.hidden = !(between || g.phase === 'pause');
    $('#banner-title').textContent = between ? 'Between Runs' : `Wave ${g.run.wave}`;
    $('#banner-sub').textContent = between ? `Best Wave ${g.save.bestWave}` : 'Approaches…';

    // Lord strip
    const hpPct = Math.max(0, g.run.lordHp / s.maxHp) * 100;
    $('#hp-bar').hidden = between;
    $('#hp-fill').style.width = `${hpPct}%`;
    const pct = g.save.barPercent;
    $('#hp-text').textContent = pct ? `${Math.floor(hpPct)}%` : `${fmt(Math.max(0, g.run.lordHp))} / ${fmt(s.maxHp)}`;
    const lvl = g.levelProgress();
    $('#level-fill').style.width = `${(lvl.into / lvl.need) * 100}%`;
    $('#level-text').textContent = pct ? `${Math.floor((lvl.into / lvl.need) * 100)}% XP` : `${fmt(Math.floor(lvl.into))} / ${fmt(lvl.need)} XP`;
    $('#level-num').textContent = String(lvl.level);
    const flash = g.time - g.levelUpTime < 1.2;
    $('#level-box').classList.toggle('flash', flash);
    $('#level-bar').classList.toggle('flash', flash);
    const prestige = $<HTMLButtonElement>('#prestige');
    if (between) {
      this.prestigeArmed = false;
      prestige.className = 'big-btn start';
      prestige.disabled = false;
      prestige.innerHTML = `Start<small>Wave ${1 + 5 * g.save.prestige.headStart}</small>`;
    } else {
      prestige.disabled = !g.canPrestige();
      if (prestige.disabled) this.prestigeArmed = false;
      prestige.className = `big-btn prestige${this.prestigeArmed ? ' confirm' : ''}`;
      prestige.textContent = this.prestigeArmed ? 'Confirm' : 'Prestige';
    }

    // Tabs: Powers belong to a run and are hidden between runs.
    const powersTab = $('.tab[data-tab="powers"]');
    powersTab.hidden = between;
    if (between && this.tab === 'powers') this.setTab('dread');
    let powersReady = false;
    let dreadReady = 0;
    let pactsReady = 0;

    // Powers
    const mode = g.save.buyMode ?? 1;
    $$<HTMLButtonElement>('#buy-mode button').forEach((b) => b.classList.toggle('on', Number(b.dataset.mode) === mode));
    for (const def of RUN_UPGRADES) {
      const row = this.rows.get(def.id)!;
      row.root.hidden = !g.isRunUpgradeAvailable(def.id);
      if (row.root.hidden) continue;
      const shown = g.runUpgradeLevel(def.id);
      const maxed = g.isRunUpgradeMaxed(def.id);
      const isNew = shown === 0;
      row.root.classList.toggle('new', isNew);
      const milestone = def.maxLevel === undefined ? `<span class="msc">×${MILESTONE_MULT} at Lv ${(Math.floor(shown / MILESTONE_EVERY) + 1) * MILESTONE_EVERY}</span>` : '';
      row.name.innerHTML = `${def.name}<em>Lv ${shown}</em>${isNew ? '<span class="new-tag">NEW</span>' : milestone}`;
      const bulk = g.runUpgradeBulk(def.id, mode === 0 ? Infinity : mode);
      const next = computeStats({ ...g.run.levels, [def.id]: g.run.levels[def.id] + Math.max(1, bulk.count) }, g.save.prestige, g.save.pacts, g.save.gear);
      const stat = maxed ? `${statText(def.id, s, g.run.wave)} (Max)` : `${statText(def.id, s, g.run.wave)} → <b>${statText(def.id, next, g.run.wave)}</b>`;
      // Lv 0 explains what the power does; after that the values, with the text one tap away.
      row.line.innerHTML = isNew ? `<span class="ds">${def.desc}</span>` : row.info ? `<span class="ds">${def.desc}</span><br><span class="st">${stat}</span>` : `<span class="st">${stat}</span>`;
      const afford = !maxed && bulk.count > 0 && g.run.gold >= bulk.cost;
      const boost = !maxed && g.isMilestoneNext(def.id);
      row.buy.classList.toggle('boost', boost);
      row.buy.innerHTML = maxed ? 'MAX' : boost ? `${fmt(bulk.cost)}g<small>×${MILESTONE_MULT} Boost</small>` : `${fmt(bulk.cost)}g<small>+${Math.max(1, bulk.count)} Lv</small>`;
      row.buy.disabled = !afford || between;
      if (afford) powersReady = true;
    }

    // Dread
    for (const def of PRESTIGE_UPGRADES) {
      const cell = this.dreadCells.get(def.id)!;
      const level = g.save.prestige[def.id];
      const maxed = g.isPrestigeMaxed(def.id);
      const cost = g.prestigeCost(def.id);
      const ready = g.canSpend() && !maxed && g.save.dread >= cost;
      if (ready) dreadReady++;
      cell.classList.toggle('ready', ready);
      cell.classList.toggle('sel', def.id === this.dreadSel);
      cell.querySelector('.cl')!.textContent = `Lv ${level}`;
      cell.querySelector('.cc')!.innerHTML = maxed ? 'MAX' : `${fmt(cost)} ${curHtml('dread').replace('class="cur"', 'class="cur inline-cur"')}`;
    }
    const d = PRESTIGE_UPGRADES.find((u) => u.id === this.dreadSel)!;
    const dLevel = g.save.prestige[d.id];
    const dMaxed = g.isPrestigeMaxed(d.id);
    const dCost = g.prestigeCost(d.id);
    const detail = $('#dread-detail');
    detail.querySelector('.d-icon')!.innerHTML = iconHtml(d.id, d.name);
    detail.querySelector('.d-name')!.textContent = d.name;
    detail.querySelector('.d-lvl')!.textContent = `Lv ${dLevel}`;
    detail.querySelector('.d-desc')!.textContent = d.desc;
    detail.querySelector('.d-stat')!.textContent = dMaxed ? `${dreadText(d.id, dLevel)} (Max)` : `${dreadText(d.id, dLevel)} → ${dreadText(d.id, dLevel + 1)}`;
    const dBuy = detail.querySelector<HTMLButtonElement>('.d-buy')!;
    dBuy.innerHTML = dMaxed ? 'MAX' : !g.canSpend() ? `${lockHtml()}<small>After Run</small>` : `${fmt(dCost)} ☠<small>+1 Lv</small>`;
    dBuy.disabled = dMaxed || !g.canSpend() || g.save.dread < dCost;

    // Pacts and gear
    this.tree.update();
    this.gear.update();
    pactsReady = g.canSpend() ? document.querySelectorAll('#pacts-tree .node.ready').length : 0;
    const spent = g.sigilsSpent();
    $$<HTMLButtonElement>('.reset-pacts').forEach((b) => {
      b.disabled = spent === 0 || !between;
      b.textContent = spent > 0 && between ? `Reset (+${spent})` : 'Reset';
    });

    // Badges on the tab bar
    const setBadge = (tab: Tab, value: number | boolean) => {
      const b = $(`.tab[data-tab="${tab}"] .badge`);
      b.hidden = !value;
      b.classList.toggle('dot', value === true);
      b.textContent = typeof value === 'number' ? String(value) : '';
    };
    setBadge('powers', powersReady && this.tab !== 'powers');
    setBadge('dread', dreadReady);
    setBadge('pacts', pactsReady);
    setBadge('gear', g.save.gear.spoils >= g.forgeCost() && g.canForge() && this.tab !== 'gear');

    // Run summary
    $('#summary').hidden = !this.summaryOpen;
    if (this.summaryOpen && g.lastSummary) {
      const sum = g.lastSummary;
      $('#sum-title').textContent = sum.manual ? 'You Withdraw' : 'You Have Fallen';
      $('#sum-run').textContent = `Run ${g.save.runs}`;
      $('#sum-wave').textContent = String(sum.wave);
      const rec = $('#sum-record');
      rec.textContent = sum.newBest ? '★ New Record' : `Best: Wave ${sum.bestWave}`;
      rec.classList.toggle('new', sum.newBest);
      const gains: string[] = [];
      const gain = (label: string, kind: string, value: number) =>
        gains.push(`<div class="gain"><span class="l">${label}</span><span class="pill ${kind}">${curHtml(kind)}<b>+${fmt(value)}</b></span></div>`);
      gain(sum.levels > 0 ? `Level ${g.level() - sum.levels} → ${g.level()}` : `Level ${g.level()}`, 'dread', sum.dread);
      if (sum.sigils > 0) gain('Sigils Earned', 'sigil', sum.sigils);
      if (sum.spoils > 0) gain('Spoils from Champions', 'spoils', sum.spoils);
      $('#sum-gains').innerHTML = gains.join('');
    }

    // Settings
    $$<HTMLButtonElement>('#set-bars button').forEach((b) => b.classList.toggle('on', (b.dataset.v === '1') === !!g.save.barPercent));
    $$<HTMLButtonElement>('#set-speed button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === g.save.speed));
    $$<HTMLButtonElement>('#set-fs button').forEach((b) => b.classList.toggle('on', (b.dataset.v === '1') === !!document.fullscreenElement));
  }
}
