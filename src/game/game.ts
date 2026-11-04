import {
  BLACK_SUN_EVERY,
  CHAMPION_AURA_REDUCTION,
  CHAMPION_EVERY,
  DESPAIR_BELOW,
  DOOM_PER_SECOND,
  HEROES,
  IRON_MAIDEN_BELOW,
  LASH_COST,
  LASH_INTERVAL,
  BLEED_SECONDS,
  BRAMBLE_EVERY,
  TIER_SIGILS,
  TWIN_LASH_EVERY,
  SHOCKWAVE_INTERVAL,
  LORD_CHEST,
  LORD_X,
  LORD_Y,
  PACTS,
  PRESTIGE_UPGRADES,
  QUEUE_GAP,
  RANGES,
  RETALIATION_EVERY,
  RUN_UPGRADES,
  SCALE,
  SPAWN_DIST,
  THORN_BURST_RADIUS,
  WAVE_PAUSE,
  EXTRA_BUILD_COST,
  SIGIL_LEVELS,
  dreadForLevel,
  pactLevelCost,
  pactMaxLevel,
  pactValue,
  levelForXp,
  xpForKill,
  heroCountForWave,
  prestigeCost,
  rangeIndex,
  runUpgradeCost,
  sigilsForRecord,
  type BuildId,
  type HeroKind,
  type PactId,
  type PrestigeId,
  type RangeId,
  type RunUpgradeId,
} from './config';
import { computeStats, powerLevel, type LordStats } from './stats';
import { emptyPacts, emptyRunLevels, type RunState, type SaveData } from './state';
import { fieldPos } from './config';

const PACT_BY_ID = new Map(PACTS.map((p) => [p.id, p]));

export interface Hero {
  id: number;
  kind: HeroKind;
  angle: number;
  dist: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackTimer: number;
  gold: number;
  /** Seconds since the last time this hero took damage, for hit flashes. */
  hurt: number;
  /** Walk/attack animation clock. */
  anim: number;
  /** Index of the spot the hero holds in its range, or -1 while waiting for one. */
  slot: number;
  /** Seconds spent inside the aura (for Doom). */
  auraTime: number;
  /** What dealt the last damage, for on-kill effects. */
  lastHit: DamageSource;
  /** Bleeding (Open Wounds, Bloodletting): damage per second, seconds left and who caused it. */
  bleed: number;
  bleedTime: number;
  bleedSource: DamageSource;
  /** Has already stepped on Barbed Ground. */
  stepped: boolean;
}

export type DamageSource = 'aura' | 'thorns' | 'lash' | 'shockwave' | 'burst' | 'sun';

export type Effect =
  | { type: 'text'; x: number; y: number; text: string; color: string; t: number; ttl: number }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number; color: string; t: number; ttl: number }
  | { type: 'ring'; x: number; y: number; r: number; color: string; t: number; ttl: number }
  | { type: 'thorn'; x: number; y: number; t: number; ttl: number };

export type Phase = 'pause' | 'fighting' | 'fallen';

export interface RunSummary {
  wave: number;
  /** True when the player chose to prestige; false when the Lord fell. */
  manual: boolean;
  /** Levels and Dread points gained during the run. */
  levels: number;
  dread: number;
  /** Sigils earned for a new record. */
  sigils: number;
  bestWave: number;
  newBest: boolean;
}

export function heroPos(h: Hero): { x: number; y: number } {
  return fieldPos(h.dist, h.angle);
}

/** Range a hero stands in (0 Near .. 2 Far), or -1 while still outside the field. */
export function heroRange(h: Hero): number {
  return RANGES.findIndex((r) => h.dist <= r.edge);
}

export class Game {
  save: SaveData;
  run: RunState;
  stats!: LordStats;
  heroes: Hero[] = [];
  effects: Effect[] = [];
  phase: Phase = 'pause';
  pauseTimer = 2.5;
  lordHurt = 99;
  time = 0;
  lastSummary: RunSummary | null = null;
  /** Gold earned during the current wave; not saved, so a reload replays the wave fairly. */
  private waveGold = 0;
  /** Experience and Dread from levels earned during the current wave; left out of saves like `waveGold`. */
  private waveXp = 0;
  private waveDread = 0;
  private waveSigils = 0;
  private nextId = 1;
  private lashTimer = LASH_INTERVAL;
  private sunTimer = BLACK_SUN_EVERY;
  private shockTimer = SHOCKWAVE_INTERVAL;
  private brambleTimer = BRAMBLE_EVERY;
  private lashCount = 0;
  /** Kills this wave for Soul Harvest, Barbed Fury and Bloodlust. */
  private stacks = { aura: 0, thorns: 0, lash: 0 };
  private rng: () => number;
  /** Called whenever something worth persisting changed. */
  onPersist: () => void = () => {};

  constructor(save: SaveData, rng: () => number = Math.random) {
    this.save = save;
    this.rng = rng;
    this.run = save.run ?? this.freshRun();
    this.save.run = this.run;
    this.refreshStats();
    if (this.run.lordHp <= 0) this.run.lordHp = this.stats.maxHp;
  }

  private freshRun(): RunState {
    const head = this.save.prestige.headStart;
    const startWave = 1 + 5 * head;
    let gold = 0;
    for (let w = 1; w < startWave; w++) gold += heroCountForWave(w) * 7 * Math.pow(SCALE.gold, w - 1) * 0.7;
    const run: RunState = { wave: startWave, gold: Math.floor(gold), levels: emptyRunLevels(), lordHp: 0, hitsTaken: 0, startLevel: this.level(), dreadGained: 0 };
    return run;
  }

  refreshStats(): void {
    const prevMax = this.stats?.maxHp;
    this.stats = computeStats(this.run.levels, this.save.prestige, this.save.pacts);
    if (prevMax !== undefined && this.stats.maxHp > prevMax) {
      // Gaining max life also grants that life.
      this.run.lordHp += this.stats.maxHp - prevMax;
    }
    this.run.lordHp = Math.min(this.run.lordHp, this.stats.maxHp);
  }

  private pact(id: PactId): boolean {
    return this.save.pacts[id] > 0;
  }

  /** The pact's number at its current level, 0 while not owned. */
  private pv(id: PactId): number {
    return pactValue(PACT_BY_ID.get(id)!, this.save.pacts[id]);
  }

  // ---------------------------------------------------------------------------
  // Shop

  /** A build power is only offered while its build's start pact is owned. */
  isRunUpgradeAvailable(id: RunUpgradeId): boolean {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return !def.build || this.stats.builds[def.build];
  }

  /** Level shown in the shop: build powers count their free first level. */
  runUpgradeLevel(id: RunUpgradeId): number {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return powerLevel(id, this.run.levels, def.free || (def.build ? this.stats.builds[def.build] : false));
  }

  runUpgradeCost(id: RunUpgradeId): number {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return Math.ceil(runUpgradeCost(def, this.run.levels[id]) * this.stats.costMult);
  }

  isRunUpgradeMaxed(id: RunUpgradeId): boolean {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return def.maxLevel !== undefined && this.run.levels[id] >= def.maxLevel;
  }

  buyRunUpgrade(id: RunUpgradeId): boolean {
    if (this.phase === 'fallen' || this.isRunUpgradeMaxed(id) || !this.isRunUpgradeAvailable(id)) return false;
    const cost = this.runUpgradeCost(id);
    if (this.run.gold < cost) return false;
    this.run.gold -= cost;
    this.run.levels[id]++;
    this.refreshStats();
    this.onPersist();
    return true;
  }

  prestigeCost(id: PrestigeId): number {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id)!;
    return prestigeCost(def, this.save.prestige[id]);
  }

  isPrestigeMaxed(id: PrestigeId): boolean {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id)!;
    return def.maxLevel !== undefined && this.save.prestige[id] >= def.maxLevel;
  }

  /** Dread and Sigils can only be spent between runs, after a prestige or a fall. */
  canSpend(): boolean {
    return this.phase === 'fallen';
  }

  buyPrestige(id: PrestigeId): boolean {
    if (!this.canSpend() || this.isPrestigeMaxed(id)) return false;
    const cost = this.prestigeCost(id);
    if (this.save.dread < cost) return false;
    this.save.dread -= cost;
    this.save.prestige[id]++;
    if (this.phase !== 'fallen') this.refreshStats();
    this.onPersist();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Dark Pacts (skill tree, bought with Sigils)

  /** None of the pacts this one needs is owned yet. */
  isPactLocked(id: PactId): boolean {
    const def = PACT_BY_ID.get(id)!;
    if (def.tier === 1) return false;
    return this.branchSpent(def.branch) < TIER_SIGILS[def.tier];
  }

  /** Sigils spent in a branch, counting its start pact as one; 0 without the start pact. */
  branchSpent(branch: BuildId): number {
    const start = PACTS.find((p) => p.branch === branch && p.tier === 1)!;
    if (this.save.pacts[start.id] === 0) return 0;
    let sum = 1;
    for (const def of PACTS) {
      if (def.branch !== branch || def.tier === 1) continue;
      for (let l = 0; l < this.save.pacts[def.id]; l++) sum += pactLevelCost(def, l);
    }
    return sum;
  }

  isPactMaxed(id: PactId): boolean {
    return this.save.pacts[id] >= pactMaxLevel(PACT_BY_ID.get(id)!);
  }

  /** Start pacts owned right now. */
  private startPactsOwned(): number {
    return PACTS.filter((p) => p.tier === 1 && this.save.pacts[p.id] > 0).length;
  }

  /** Sigils for the pact's next level. A second or third start pact costs extra. */
  pactCost(id: PactId): number {
    const def = PACT_BY_ID.get(id)!;
    if (def.tier === 1) return def.cost + EXTRA_BUILD_COST * this.startPactsOwned();
    return pactLevelCost(def, this.save.pacts[id]);
  }

  buyPact(id: PactId): boolean {
    if (!this.canSpend()) return false;
    return this.takePact(id);
  }

  private takePact(id: PactId): boolean {
    if (this.isPactMaxed(id) || this.isPactLocked(id)) return false;
    const cost = this.pactCost(id);
    if (this.save.sigils < cost) return false;
    this.save.sigils -= cost;
    this.save.pacts[id]++;
    if (this.phase !== 'fallen') this.refreshStats();
    this.onPersist();
    return true;
  }

  /** Sigils spent on pacts so far. */
  sigilsSpent(): number {
    let sum = 0;
    for (const def of PACTS) {
      if (def.tier === 1) continue;
      for (let l = 0; l < this.save.pacts[def.id]; l++) sum += pactLevelCost(def, l);
    }
    const starts = this.startPactsOwned();
    for (let i = 0; i < starts; i++) sum += 1 + EXTRA_BUILD_COST * i;
    return sum;
  }

  /** Give back every Sigil and clear the tree. Only between runs. */
  resetPacts(): void {
    if (this.phase !== 'fallen') return;
    this.save.sigils += this.sigilsSpent();
    this.save.pacts = emptyPacts();
    this.onPersist();
  }

  /** Start a new run after falling. */
  rise(): void {
    this.run = this.freshRun();
    this.save.run = this.run;
    this.stats = computeStats(this.run.levels, this.save.prestige, this.save.pacts);
    this.run.lordHp = this.stats.maxHp;
    this.heroes = [];
    this.effects = [];
    this.waveGold = 0;
    this.waveXp = 0;
    this.waveDread = 0;
    this.waveSigils = 0;
    this.phase = 'pause';
    this.pauseTimer = 2.5;
    this.lastSummary = null;
    this.onPersist();
  }

  /** Gold to store in a save: what we had when the current wave began, minus nothing spent since. */
  savedGold(): number {
    return Math.max(0, this.run.gold - this.waveGold);
  }

  // ---------------------------------------------------------------------------
  // Simulation

  update(dt: number): void {
    this.time += dt;
    this.lordHurt += dt;
    for (const e of this.effects) e.t += dt;
    this.effects = this.effects.filter((e) => e.t < e.ttl);
    if (this.phase === 'fallen') return;

    if (this.phase === 'pause') {
      this.regen(dt);
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.startWave();
      return;
    }

    this.regen(dt);
    this.moveAndAttack(dt);
    this.applyAura(dt);
    this.blackSun(dt);
    this.shockwave(dt);
    this.brambles(dt);
    this.bleeding(dt);
    this.bloodLash(dt);
    this.removeDead();

    if (this.run.lordHp <= 0) {
      this.endRun(false);
      return;
    }
    if (this.heroes.length === 0) {
      this.run.wave++;
      this.waveGold = 0;
      this.waveXp = 0;
      this.waveDread = 0;
      this.waveSigils = 0;
      this.phase = 'pause';
      this.pauseTimer = WAVE_PAUSE;
      this.onPersist();
    }
  }

  /** Heal the lord; with Blood Moon, healing beyond the maximum becomes a shield. */
  private heal(amount: number): void {
    const room = this.stats.maxHp - this.run.lordHp;
    if (amount <= room) {
      this.run.lordHp += amount;
      return;
    }
    this.run.lordHp = this.stats.maxHp;
    if (this.pact('bloodMoon')) {
      const cap = this.stats.maxHp * this.pv('bloodMoon');
      this.run.shield = Math.min(cap, (this.run.shield ?? 0) + amount - room);
    }
  }

  private regen(dt: number): void {
    this.heal(this.stats.regen * dt);
  }

  private startWave(): void {
    const wave = this.run.wave;
    const count = heroCountForWave(wave);
    const kinds: HeroKind[] = [];
    const isChampion = wave % CHAMPION_EVERY === 0;
    if (isChampion) kinds.push('champion');
    const pool = (Object.keys(HEROES) as HeroKind[]).filter((k) => HEROES[k].weight > 0 && HEROES[k].fromWave <= wave);
    const total = pool.reduce((s, k) => s + HEROES[k].weight, 0);
    while (kinds.length < count) {
      let r = this.rng() * total;
      let pick = pool[0];
      for (const k of pool) {
        r -= HEROES[k].weight;
        if (r <= 0) {
          pick = k;
          break;
        }
      }
      kinds.push(pick);
    }
    kinds.forEach((kind, i) => {
      const def = HEROES[kind];
      const hpMult = Math.pow(SCALE.hp, wave - 1);
      const angle = this.rng(); // lane, see fieldPos
      this.heroes.push({
        id: this.nextId++,
        kind,
        angle,
        dist: SPAWN_DIST + i * 22 + this.rng() * 20,
        hp: def.hp * hpMult,
        maxHp: def.hp * hpMult,
        damage: def.damage * Math.pow(SCALE.damage, wave - 1),
        attackTimer: def.attackInterval * (0.3 + this.rng() * 0.7),
        gold: def.gold * Math.pow(SCALE.gold, wave - 1),
        hurt: 99,
        anim: this.rng() * 10,
        slot: -1,
        auraTime: 0,
        bleed: 0,
        bleedTime: 0,
        bleedSource: 'thorns',
        stepped: false,
        lastHit: 'aura',
      });
    });
    this.stacks = { aura: 0, thorns: 0, lash: 0 };
    this.phase = 'fighting';
  }

  private moveAndAttack(dt: number): void {
    for (const h of this.heroes) {
      const def = HEROES[h.kind];
      h.hurt += dt;
      h.anim += dt;
      const range = RANGES[rangeIndex(def.range)];
      if (h.slot < 0) h.slot = this.freeSlot(def.range);
      const target = h.slot >= 0 ? range.dist : range.dist + QUEUE_GAP;
      if (h.slot >= 0) {
        // Ease toward the assigned spot's angle while walking in.
        const want = range.slots[h.slot];
        h.angle += (want - h.angle) * Math.min(1, dt * 3);
      }
      if (h.dist > target) {
        const slow = this.inAura(h) ? 1 + this.pv('creepingDark') : 1;
        h.dist = Math.max(target, h.dist - (def.speed / slow) * dt);
        continue;
      }
      if (!h.stepped && h.slot >= 0 && def.range === 'near') {
        h.stepped = true;
        if (this.pact('barbedGround') && this.stats.thorns > 0) this.damageHero(h, h.damage * this.stats.thorns * this.pv('barbedGround'), '#ff9b4a', 'thorns');
      }
      if (h.slot < 0) continue; // waiting for a free spot
      h.attackTimer -= dt;
      if (h.attackTimer <= 0) {
        const slowed = this.inAura(h) ? 1 + this.pv('grasp') : 1;
        h.attackTimer = def.attackInterval * slowed;
        this.heroHitsLord(h);
      }
    }
  }

  /** First spot in the range that no living hero holds, or -1. */
  private freeSlot(range: RangeId): number {
    const def = RANGES[rangeIndex(range)];
    for (let i = 0; i < def.slots.length; i++) {
      if (!this.heroes.some((o) => o.slot === i && HEROES[o.kind].range === range && o.hp > 0)) return i;
    }
    return -1;
  }

  private heroHitsLord(h: Hero): void {
    const def = HEROES[h.kind];
    const withered = this.inAura(h) ? 1 - this.pv('withering') : 1;
    const raw = h.damage * withered;
    const blocked = raw * this.stats.armor;
    let taken = raw - blocked;
    const shield = this.run.shield ?? 0;
    if (shield > 0) {
      const absorbed = Math.min(shield, taken);
      this.run.shield = shield - absorbed;
      taken -= absorbed;
    }
    this.run.lordHp -= taken;
    this.lordHurt = 0;
    this.run.hitsTaken++;
    const p = heroPos(h);
    if (def.ranged) {
      this.effects.push({ type: 'arrow', x1: p.x, y1: p.y, x2: LORD_X, y2: LORD_Y - LORD_CHEST, color: h.kind === 'battlemage' ? '#8fe3ff' : '#d9d2c0', t: 0, ttl: 0.25 });
    }
    this.effects.push({ type: 'text', x: LORD_X + (this.rng() - 0.5) * 30, y: LORD_Y - LORD_CHEST - 20, text: '-' + fmt(taken), color: '#ff7a6b', t: 0, ttl: 0.8 });

    if (this.stats.thorns > 0) this.throwBack(h, raw, blocked);
  }

  /** Thorns: the attacker takes part of its own hit back. */
  private throwBack(h: Hero, raw: number, blocked: number): void {
    let amount = raw * this.stats.thorns;
    if (this.pact('spikedHide')) amount += blocked * this.pv('spikedHide') * this.stats.thorns;
    if (this.pact('retaliation') && this.run.hitsTaken % RETALIATION_EVERY === 0) amount *= this.pv('retaliation');
    if (this.pact('ironMaiden') && this.run.lordHp < this.stats.maxHp * IRON_MAIDEN_BELOW) amount *= this.pv('ironMaiden');
    if (this.pact('mirrorPlate') && HEROES[h.kind].ranged) amount *= this.pv('mirrorPlate');
    amount *= 1 + this.stacks.thorns * this.pv('barbedFury');
    const p = heroPos(h);
    this.damageHero(h, amount, '#ff9b4a', 'thorns');
    if (this.pact('openWounds')) this.bleed(h, amount * this.pv('openWounds'), 'thorns');
    this.effects.push({ type: 'thorn', x: p.x, y: p.y, t: 0, ttl: 0.35 });
    if (this.pact('splinter')) {
      const next = this.nearestTo(h);
      if (next) {
        const q = heroPos(next);
        this.effects.push({ type: 'arrow', x1: p.x, y1: p.y - 10, x2: q.x, y2: q.y - 10, color: '#ffb27a', t: 0, ttl: 0.2 });
        this.damageHero(next, amount * this.pv('splinter'), '#ffb27a', 'thorns');
      }
    }
  }

  /** The living hero closest to `h`, other than `h`. */
  private nearestTo(h: Hero): Hero | undefined {
    const p = heroPos(h);
    let best: Hero | undefined;
    let bestD = Infinity;
    for (const o of this.heroes) {
      if (o === h || o.hp <= 0 || heroRange(o) < 0) continue;
      const q = heroPos(o);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  inAura(h: Hero): boolean {
    const r = heroRange(h);
    return r >= 0 && this.stats.auraDps[r] > 0;
  }

  /** Aura damage per second on this hero right now. */
  private auraDpsOn(h: Hero): number {
    const r = heroRange(h);
    if (r < 0) return 0;
    let dps = this.stats.auraDps[r];
    if (h.kind === 'champion') dps *= CHAMPION_AURA_REDUCTION;
    if (this.pact('doom')) dps *= Math.min(this.pv('doom'), 1 + DOOM_PER_SECOND * h.auraTime);
    if (this.pact('despair') && h.hp < h.maxHp * DESPAIR_BELOW) dps *= this.pv('despair');
    dps *= 1 + this.stacks.aura * this.pv('soulHarvest');
    if (this.pact('dreadTide')) dps *= 1 + this.pv('dreadTide') * this.heroes.filter((o) => o.hp > 0 && heroRange(o) >= 0).length;
    dps += h.maxHp * this.pv('unmaking');
    return dps;
  }

  private applyAura(dt: number): void {
    for (const h of this.heroes) {
      if (!this.inAura(h)) continue;
      h.auraTime += dt;
      this.damageHero(h, this.auraDpsOn(h) * dt, null, 'aura');
    }
  }

  /** Shockwave, the basic attack: every few seconds it hurts every hero on the field. */
  private shockwave(dt: number): void {
    this.shockTimer -= dt;
    if (this.shockTimer > 0) return;
    if (!this.heroes.some((h) => heroRange(h) >= 0)) {
      this.shockTimer = 0; // wait until a hero is in reach
      return;
    }
    this.shockTimer = SHOCKWAVE_INTERVAL;
    const edge = RANGES[RANGES.length - 1].edge;
    this.effects.push({ type: 'ring', x: LORD_X, y: LORD_Y, r: edge, color: '#b06bff', t: 0, ttl: 0.6 });
    for (const h of this.heroes) if (heroRange(h) >= 0) this.damageHero(h, this.stats.shockwave, '#d7b0ff', 'shockwave');
  }

  /** Start or refresh bleeding on a hero; the stronger bleed wins. */
  private bleed(h: Hero, dps: number, source: DamageSource): void {
    if (h.hp <= 0) return;
    if (h.bleedTime <= 0 || dps >= h.bleed) {
      h.bleed = dps;
      h.bleedSource = source;
    }
    h.bleedTime = BLEED_SECONDS;
  }

  private bleeding(dt: number): void {
    for (const h of this.heroes) {
      if (h.bleedTime <= 0) continue;
      h.bleedTime -= dt;
      this.damageHero(h, h.bleed * dt, null, h.bleedSource);
    }
  }

  /** Bramble Wall: heroes right in front of the Lord hurt themselves every few seconds. */
  private brambles(dt: number): void {
    if (!this.pact('brambleWall') || this.stats.thorns <= 0) return;
    this.brambleTimer -= dt;
    if (this.brambleTimer > 0) return;
    this.brambleTimer = BRAMBLE_EVERY;
    for (const h of this.heroes) {
      if (h.slot < 0 || HEROES[h.kind].range !== 'near' || heroRange(h) !== 0) continue;
      this.damageHero(h, h.damage * this.stats.thorns * this.pv('brambleWall'), '#ff9b4a', 'thorns');
      const p = heroPos(h);
      this.effects.push({ type: 'thorn', x: p.x, y: p.y, t: 0, ttl: 0.35 });
    }
  }

  /** Black Sun: every few seconds the aura deals several seconds of damage at once. */
  private blackSun(dt: number): void {
    if (!this.pact('blackSun') || this.stats.auraReach < 0) return;
    this.sunTimer -= dt;
    if (this.sunTimer > 0) return;
    this.sunTimer = BLACK_SUN_EVERY;
    this.effects.push({ type: 'ring', x: LORD_X, y: LORD_Y, r: RANGES[this.stats.auraReach].edge, color: '#7a3cff', t: 0, ttl: 0.7 });
    for (const h of this.heroes) if (this.inAura(h)) this.damageHero(h, this.auraDpsOn(h) * this.pv('blackSun'), '#c9a0ff', 'sun');
  }

  /** Blood Lash: strike the weakest hero on the field, paid with life. */
  private bloodLash(dt: number): void {
    if (this.stats.lash <= 0) return;
    const speed = this.pact('frenzy') ? 1 + (this.pv('frenzy') - 1) * (1 - this.run.lordHp / this.stats.maxHp) : 1;
    this.lashTimer -= dt * speed;
    if (this.lashTimer > 0) return;
    const target = this.weakest();
    if (!target) return; // keep the lash ready until a hero is in reach
    this.lashTimer = LASH_INTERVAL;
    this.lashCount++;
    const hpShare = this.run.lordHp / this.stats.maxHp;
    const avatar = this.pact('sanguineAvatar') && hpShare < this.pv('sanguineAvatar');
    let cost = avatar ? 0 : this.run.lordHp * LASH_COST;
    if (this.pact('thirst')) cost *= 1 - this.pv('thirst') * hpShare;
    this.run.lordHp -= cost;
    const damage = this.stats.maxHp * this.stats.lash * (1 + this.stacks.lash * this.pv('bloodlust'));
    if (avatar) {
      for (const h of this.heroes) if (h.hp > 0 && heroRange(h) >= 0) this.lashStrike(h, damage, cost, false);
    } else {
      this.lashStrike(target, damage, cost, this.pact('chain'));
    }
    if (this.pact('twinLash') && this.lashCount % TWIN_LASH_EVERY === 0) {
      const again = this.weakest();
      if (again) this.lashStrike(again, damage * this.pv('twinLash'), 0, this.pact('chain'));
    }
  }

  /** One lash on a hero; with Chain, leftover damage jumps on after a kill. */
  private lashStrike(first: Hero, damage: number, cost: number, chain: boolean): void {
    let from = { x: LORD_X + 10, y: LORD_Y - LORD_CHEST };
    let h: Hero | undefined = first;
    while (h && damage > 0) {
      const p = heroPos(h);
      this.effects.push({ type: 'arrow', x1: from.x, y1: from.y, x2: p.x, y2: p.y - 14, color: '#d8243f', t: 0, ttl: 0.3 });
      const execute = this.pact('execute') && h.hp < h.maxHp * this.pv('execute');
      const before = h.hp;
      this.damageHero(h, execute ? h.hp : damage, execute ? '#ff4060' : '#ff6b81', 'lash');
      if (h.hp > 0) {
        if (this.pact('bloodletting')) this.bleed(h, damage * this.pv('bloodletting'), 'lash');
        break;
      }
      if (this.pact('transfusion')) this.heal(cost * this.pv('transfusion'));
      if (!chain) break;
      damage -= execute ? 0 : Math.min(damage, before);
      damage *= this.pv('chain');
      from = { x: p.x, y: p.y - 14 };
      h = this.weakest();
    }
  }

  /** The living hero with the least life that stands on the field. */
  private weakest(): Hero | undefined {
    let best: Hero | undefined;
    for (const h of this.heroes) {
      if (h.hp <= 0 || heroRange(h) < 0) continue;
      if (!best || h.hp < best.hp) best = h;
    }
    return best;
  }

  private damageHero(h: Hero, amount: number, color: string | null, source: DamageSource): void {
    if (h.hp <= 0) return;
    h.hp -= amount;
    h.lastHit = source;
    if (color) {
      const p = heroPos(h);
      this.effects.push({ type: 'text', x: p.x + (this.rng() - 0.5) * 16, y: p.y - 24, text: fmt(amount), color, t: 0, ttl: 0.7 });
      h.hurt = 0;
    } else if (h.hurt > 0.25) {
      h.hurt = 0.12; // soft flicker while inside the aura
    }
  }

  private removeDead(): void {
    // Kills can chain through Thorn Burst, so loop until nothing new dies.
    let dead = this.heroes.filter((h) => h.hp <= 0);
    while (dead.length > 0) {
      this.heroes = this.heroes.filter((h) => h.hp > 0);
      for (const h of dead) this.onKill(h);
      dead = this.heroes.filter((h) => h.hp <= 0);
    }
  }

  private onKill(h: Hero): void {
    if (h.lastHit === 'aura' || h.lastHit === 'sun') this.stacks.aura++;
    if (h.lastHit === 'thorns') this.stacks.thorns++;
    if (h.lastHit === 'lash') this.stacks.lash++;
    const tithe = h.lastHit === 'lash' ? 1 + this.pv('crimsonTithe') : 1;
    const gold = h.gold * this.stats.goldMult * tithe;
    this.run.gold += gold;
    this.waveGold += gold;
    const p = heroPos(h);
    this.effects.push({ type: 'text', x: p.x, y: p.y - 10, text: '+' + fmt(gold) + 'g', color: '#ffd166', t: 0, ttl: 1.1 });
    if (this.stats.bloodPact > 0) this.heal(this.stats.maxHp * this.stats.bloodPact);
    this.gainXp(xpForKill(this.run.wave, h.kind === 'champion') * this.stats.xpMult);
    if (h.kind === 'champion') {
      this.heal(this.stats.maxHp);
      this.effects.push({ type: 'text', x: LORD_X + 20, y: LORD_Y - LORD_CHEST - 50, text: 'Champion Slain!', color: '#ffd166', t: 0, ttl: 1.8 });
    }
    if (this.pact('crownOfThorns') && h.lastHit === 'thorns') {
      const others = this.heroes.filter((o) => o !== h && o.hp > 0 && heroRange(o) >= 0);
      const o = others[Math.floor(this.rng() * others.length)];
      if (o) {
        const q = heroPos(o);
        this.effects.push({ type: 'arrow', x1: p.x, y1: p.y - 10, x2: q.x, y2: q.y - 10, color: '#ff9b4a', t: 0, ttl: 0.25 });
        this.damageHero(o, h.maxHp * this.pv('crownOfThorns'), '#ffb27a', 'thorns');
      }
    }
    if (this.pact('thornBurst') && h.lastHit === 'thorns') {
      this.effects.push({ type: 'ring', x: p.x, y: p.y, r: THORN_BURST_RADIUS, color: '#ff9b4a', t: 0, ttl: 0.45 });
      for (const o of this.heroes) {
        const q = heroPos(o);
        if (Math.hypot(q.x - p.x, q.y - p.y) <= THORN_BURST_RADIUS) this.damageHero(o, h.maxHp * this.pv('thornBurst'), '#ffb27a', 'thorns');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Lord level

  /** The Lord's level, from all experience ever earned. */
  level(): number {
    return levelForXp(this.save.xp).level;
  }

  /** Experience into the current level and needed for the next one. */
  levelProgress(): { level: number; into: number; need: number } {
    return levelForXp(this.save.xp);
  }

  /** Dread points the next level will give. */
  nextLevelDread(): number {
    return dreadForLevel(this.level() + 1);
  }

  private gainXp(amount: number): void {
    const before = this.level();
    this.save.xp += amount;
    this.waveXp += amount;
    const after = this.level();
    for (let l = before + 1; l <= after; l++) {
      const dread = dreadForLevel(l);
      this.save.dread += dread;
      this.waveDread += dread;
      this.run.dreadGained = (this.run.dreadGained ?? 0) + dread;
      if (l % SIGIL_LEVELS === 0) {
        this.save.sigils++;
        this.waveSigils++;
        this.run.levelSigils = (this.run.levelSigils ?? 0) + 1;
      }
    }
    if (after > before) {
      this.effects.push({ type: 'text', x: LORD_X, y: LORD_Y - LORD_CHEST - 70, text: `Level ${after}!`, color: '#c78bff', t: 0, ttl: 2 });
      this.levelUpTime = this.time;
    }
  }

  /** Time of the last level up, for the level bar flash. */
  levelUpTime = -99;

  // ---------------------------------------------------------------------------
  // Ending a run

  /** The player may prestige at any time during a run once a build is chosen. */
  canPrestige(): boolean {
    return this.phase !== 'fallen';
  }

  /** End the run by choice: keep everything earned and go spend it. */
  prestige(): void {
    if (this.canPrestige()) this.endRun(true);
  }

  private endRun(manual: boolean): void {
    this.phase = 'fallen';
    if (!manual) this.run.lordHp = 0;
    else this.heroes = [];
    this.waveXp = 0;
    this.waveDread = 0;
    this.waveSigils = 0;
    const wave = this.run.wave;
    const newBest = wave > this.save.bestWave;
    const recordSigils = sigilsForRecord(this.save.bestWave, wave);
    const sigils = recordSigils + (this.run.levelSigils ?? 0);
    this.save.bestWave = Math.max(this.save.bestWave, wave);
    this.save.sigils += recordSigils;
    this.save.runs++;
    this.save.run = null;
    const levels = this.level() - (this.run.startLevel ?? this.level());
    this.lastSummary = { wave, manual, levels, dread: this.run.dreadGained ?? 0, sigils, bestWave: this.save.bestWave, newBest };
    this.onPersist();
  }

  /** The save to write: like the run, it rewinds to the start of the current wave. */
  snapshotSave(): SaveData {
    return {
      ...this.save,
      xp: this.save.xp - this.waveXp,
      dread: this.save.dread - this.waveDread,
      sigils: this.save.sigils - this.waveSigils,
      run: this.snapshotRun(),
    };
  }

  /** Snapshot of the run for saving: resumes at the start of the current wave. */
  snapshotRun(): RunState | null {
    if (this.phase === 'fallen') return null;
    return { ...this.run, gold: this.savedGold(), levels: { ...this.run.levels }, dreadGained: (this.run.dreadGained ?? 0) - this.waveDread, levelSigils: (this.run.levelSigils ?? 0) - this.waveSigils };
  }
}

export function fmt(n: number): string {
  if (n < 10) return n.toFixed(1).replace(/\.0$/, '');
  if (n < 1000) return Math.round(n).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let u = -1;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  return (n < 100 ? n.toFixed(1) : Math.round(n).toString()).replace(/\.0$/, '') + units[u];
}
