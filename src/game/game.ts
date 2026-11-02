import {
  BLACK_SUN_EVERY,
  BLACK_SUN_SECONDS,
  BLOOD_MOON_SHIELD,
  CHAMPION_AURA_REDUCTION,
  CHAMPION_EVERY,
  DEPTH,
  DESPAIR_BELOW,
  DOOM_MAX,
  DOOM_PER_SECOND,
  EXECUTE_BELOW,
  FRENZY_MAX,
  GRASP,
  HEROES,
  IRON_MAIDEN_BELOW,
  IRON_MAIDEN_MULT,
  LASH_COST,
  LASH_INTERVAL,
  LORD_CHEST,
  LORD_X,
  LORD_Y,
  PACTS,
  PRESTIGE_UPGRADES,
  QUEUE_GAP,
  RANGES,
  RETALIATION_EVERY,
  RETALIATION_MULT,
  RUN_UPGRADES,
  SCALE,
  SHOCKWAVE_HITS,
  SHOCKWAVE_REACH,
  SPAWN_DIST,
  SPIKED_HIDE_MULT,
  SPLINTER_SHARE,
  THORN_BURST_RADIUS,
  THORN_BURST_SHARE,
  TRANSFUSION_MULT,
  WAVE_PAUSE,
  WITHERING,
  dreadForWave,
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
  dread: number;
  /** Part of `dread` that came from Dread Harvest. */
  dreadBonus: number;
  /** Sigils earned for a new record. */
  sigils: number;
  bestWave: number;
  newBest: boolean;
}

export function heroPos(h: Hero): { x: number; y: number } {
  return { x: LORD_X + Math.cos(h.angle) * h.dist, y: LORD_Y + Math.sin(h.angle) * h.dist * DEPTH };
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
  private nextId = 1;
  private lashTimer = LASH_INTERVAL;
  private sunTimer = BLACK_SUN_EVERY;
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
    const run: RunState = { wave: startWave, gold: Math.floor(gold), levels: emptyRunLevels(), lordHp: 0, hitsTaken: 0 };
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

  /** At least one start pact is owned, so the run can do damage. */
  hasBuild(): boolean {
    return this.stats.builds.aura || this.stats.builds.thorns || this.stats.builds.blood;
  }

  private pact(id: PactId): boolean {
    return this.save.pacts[id] > 0;
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
    return powerLevel(id, this.run.levels, def.build ? this.stats.builds[def.build] : false);
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

  buyPrestige(id: PrestigeId): boolean {
    if (this.isPrestigeMaxed(id)) return false;
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
    const def = PACTS.find((u) => u.id === id)!;
    return def.requires !== undefined && !def.requires.some((r) => this.save.pacts[r] > 0);
  }

  isPactMaxed(id: PactId): boolean {
    return this.save.pacts[id] > 0;
  }

  pactCost(id: PactId): number {
    return PACTS.find((u) => u.id === id)!.cost;
  }

  buyPact(id: PactId): boolean {
    if (this.isPactMaxed(id) || this.isPactLocked(id)) return false;
    const cost = this.pactCost(id);
    if (this.save.sigils < cost) return false;
    this.save.sigils -= cost;
    this.save.pacts[id]++;
    if (this.phase !== 'fallen') this.refreshStats();
    this.onPersist();
    return true;
  }

  /** Choose the build for the very first run: buys that branch's start pact. */
  chooseBuild(build: BuildId): boolean {
    const id = PACTS.find((p) => p.branch === build && p.tier === 1)!.id;
    return this.buyPact(id);
  }

  /** Sigils spent on pacts so far. */
  sigilsSpent(): number {
    return PACTS.reduce((sum, def) => sum + def.cost * this.save.pacts[def.id], 0);
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
      // Without a build nothing could die: wait until a start pact is chosen.
      if (!this.hasBuild()) return;
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.startWave();
      return;
    }

    this.regen(dt);
    this.moveAndAttack(dt);
    this.applyAura(dt);
    this.blackSun(dt);
    this.bloodLash(dt);
    this.removeDead();

    if (this.run.lordHp <= 0) {
      this.fall();
      return;
    }
    if (this.heroes.length === 0) {
      this.run.wave++;
      this.waveGold = 0;
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
      const cap = this.stats.maxHp * BLOOD_MOON_SHIELD;
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
      const angle = 0.45 + (this.rng() - 0.5) * 1.1;
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
        lastHit: 'aura',
      });
    });
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
        h.dist = Math.max(target, h.dist - def.speed * dt);
        continue;
      }
      if (h.slot < 0) continue; // waiting for a free spot
      h.attackTimer -= dt;
      if (h.attackTimer <= 0) {
        const slowed = this.pact('grasp') && this.inAura(h) ? GRASP : 1;
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
    const withered = this.pact('withering') && this.inAura(h) ? 1 - WITHERING : 1;
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
    if (this.stats.shockwaveDamage > 0 && this.run.hitsTaken % SHOCKWAVE_HITS === 0) {
      const edge = RANGES[SHOCKWAVE_REACH].edge;
      this.effects.push({ type: 'ring', x: LORD_X, y: LORD_Y, r: edge, color: '#b06bff', t: 0, ttl: 0.6 });
      for (const other of this.heroes) if (other.dist <= edge) this.damageHero(other, this.stats.shockwaveDamage, '#d7b0ff', 'shockwave');
    }
  }

  /** Thorns: the attacker takes part of its own hit back. */
  private throwBack(h: Hero, raw: number, blocked: number): void {
    let amount = raw * this.stats.thorns;
    if (this.pact('spikedHide')) amount += blocked * SPIKED_HIDE_MULT * this.stats.thorns;
    if (this.pact('retaliation') && this.run.hitsTaken % RETALIATION_EVERY === 0) amount *= RETALIATION_MULT;
    if (this.pact('ironMaiden') && this.run.lordHp < this.stats.maxHp * IRON_MAIDEN_BELOW) amount *= IRON_MAIDEN_MULT;
    const p = heroPos(h);
    this.damageHero(h, amount, '#ff9b4a', 'thorns');
    this.effects.push({ type: 'thorn', x: p.x, y: p.y, t: 0, ttl: 0.35 });
    if (this.pact('splinter')) {
      const next = this.nearestTo(h);
      if (next) {
        const q = heroPos(next);
        this.effects.push({ type: 'arrow', x1: p.x, y1: p.y - 10, x2: q.x, y2: q.y - 10, color: '#ffb27a', t: 0, ttl: 0.2 });
        this.damageHero(next, amount * SPLINTER_SHARE, '#ffb27a', 'thorns');
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
    if (this.pact('doom')) dps *= Math.min(DOOM_MAX, 1 + DOOM_PER_SECOND * h.auraTime);
    if (this.pact('despair') && h.hp < h.maxHp * DESPAIR_BELOW) dps *= 2;
    return dps;
  }

  private applyAura(dt: number): void {
    for (const h of this.heroes) {
      if (!this.inAura(h)) continue;
      h.auraTime += dt;
      this.damageHero(h, this.auraDpsOn(h) * dt, null, 'aura');
    }
  }

  /** Black Sun: every few seconds the aura deals several seconds of damage at once. */
  private blackSun(dt: number): void {
    if (!this.pact('blackSun') || this.stats.auraReach < 0) return;
    this.sunTimer -= dt;
    if (this.sunTimer > 0) return;
    this.sunTimer = BLACK_SUN_EVERY;
    this.effects.push({ type: 'ring', x: LORD_X, y: LORD_Y, r: RANGES[this.stats.auraReach].edge, color: '#7a3cff', t: 0, ttl: 0.7 });
    for (const h of this.heroes) if (this.inAura(h)) this.damageHero(h, this.auraDpsOn(h) * BLACK_SUN_SECONDS, '#c9a0ff', 'sun');
  }

  /** Blood Lash: strike the weakest hero on the field, paid with life. */
  private bloodLash(dt: number): void {
    if (this.stats.lash <= 0) return;
    const speed = this.pact('frenzy') ? 1 + (FRENZY_MAX - 1) * (1 - this.run.lordHp / this.stats.maxHp) : 1;
    this.lashTimer -= dt * speed;
    if (this.lashTimer > 0) return;
    const target = this.weakest();
    if (!target) return; // keep the lash ready until a hero is in reach
    this.lashTimer = LASH_INTERVAL;
    const cost = this.run.lordHp * LASH_COST;
    this.run.lordHp -= cost;
    let damage = this.stats.maxHp * this.stats.lash;
    let from = { x: LORD_X + 10, y: LORD_Y - LORD_CHEST };
    let h: Hero | undefined = target;
    while (h && damage > 0) {
      const p = heroPos(h);
      this.effects.push({ type: 'arrow', x1: from.x, y1: from.y, x2: p.x, y2: p.y - 14, color: '#d8243f', t: 0, ttl: 0.3 });
      const execute = this.pact('execute') && h.hp < h.maxHp * EXECUTE_BELOW;
      const before = h.hp;
      this.damageHero(h, execute ? h.hp : damage, execute ? '#ff4060' : '#ff6b81', 'lash');
      if (h.hp > 0) break;
      if (this.pact('transfusion')) this.heal(cost * TRANSFUSION_MULT);
      if (!this.pact('chain')) break;
      damage -= execute ? 0 : Math.min(damage, before);
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
    const gold = h.gold * this.stats.goldMult;
    this.run.gold += gold;
    this.waveGold += gold;
    const p = heroPos(h);
    this.effects.push({ type: 'text', x: p.x, y: p.y - 10, text: '+' + fmt(gold) + 'g', color: '#ffd166', t: 0, ttl: 1.1 });
    if (this.stats.bloodPact > 0) this.heal(this.stats.maxHp * this.stats.bloodPact);
    if (h.kind === 'champion') {
      this.heal(this.stats.maxHp);
      this.effects.push({ type: 'text', x: LORD_X + 20, y: LORD_Y - LORD_CHEST - 50, text: 'Champion slain!', color: '#ffd166', t: 0, ttl: 1.8 });
    }
    if (this.pact('thornBurst') && h.lastHit === 'thorns') {
      this.effects.push({ type: 'ring', x: p.x, y: p.y, r: THORN_BURST_RADIUS, color: '#ff9b4a', t: 0, ttl: 0.45 });
      for (const o of this.heroes) {
        const q = heroPos(o);
        if (Math.hypot(q.x - p.x, q.y - p.y) <= THORN_BURST_RADIUS) this.damageHero(o, h.maxHp * THORN_BURST_SHARE, '#ffb27a', 'thorns');
      }
    }
  }

  private fall(): void {
    this.phase = 'fallen';
    this.run.lordHp = 0;
    const wave = this.run.wave;
    const base = dreadForWave(wave);
    const dread = this.dreadForFall(wave);
    const newBest = wave > this.save.bestWave;
    const sigils = sigilsForRecord(this.save.bestWave, wave);
    this.save.bestWave = Math.max(this.save.bestWave, wave);
    this.save.dread += dread;
    this.save.sigils += sigils;
    this.save.runs++;
    this.save.run = null;
    this.lastSummary = { wave, dread, dreadBonus: dread - base, sigils, bestWave: this.save.bestWave, newBest };
    this.onPersist();
  }

  /** Dread earned when falling at this wave, with Dread Harvest. */
  dreadForFall(wave: number): number {
    return Math.floor(dreadForWave(wave) * this.stats.dreadMult);
  }

  /** Snapshot of the run for saving: resumes at the start of the current wave. */
  snapshotRun(): RunState | null {
    if (this.phase === 'fallen') return null;
    return { ...this.run, gold: this.savedGold(), levels: { ...this.run.levels } };
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
