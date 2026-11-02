import {
  CHAMPION_AURA_REDUCTION,
  CHAMPION_EVERY,
  CORPSE_BURST_SHARE,
  HEROES,
  LORD_X,
  DEPTH,
  LORD_Y,
  LORD_CHEST,
  PRESTIGE_UPGRADES,
  RUN_UPGRADES,
  SCALE,
  QUEUE_GAP,
  RANGES,
  SHOCKWAVE_HITS,
  SHOCKWAVE_REACH,
  rangeIndex,
  SPAWN_DIST,
  WAVE_PAUSE,
  dreadForWave,
  heroCountForWave,
  prestigeCost,
  runUpgradeCost,
  type HeroKind,
  type PrestigeId,
  type RangeId,
  type RunUpgradeId,
} from './config';
import { computeStats, type LordStats } from './stats';
import { emptyRunLevels, type RunState, type SaveData } from './state';

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
}

export type Effect =
  | { type: 'text'; x: number; y: number; text: string; color: string; t: number; ttl: number }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number; color: string; t: number; ttl: number }
  | { type: 'ring'; x: number; y: number; r: number; color: string; t: number; ttl: number }
  | { type: 'thorn'; x: number; y: number; t: number; ttl: number };

export type Phase = 'pause' | 'fighting' | 'fallen';

export interface RunSummary {
  wave: number;
  dread: number;
  bestWave: number;
  newBest: boolean;
}

export function heroPos(h: Hero): { x: number; y: number } {
  return { x: LORD_X + Math.cos(h.angle) * h.dist, y: LORD_Y + Math.sin(h.angle) * h.dist * DEPTH };
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
    this.stats = computeStats(this.run.levels, this.save.prestige);
    if (prevMax !== undefined && this.stats.maxHp > prevMax) {
      // Gaining max life also grants that life.
      this.run.lordHp += this.stats.maxHp - prevMax;
    }
    this.run.lordHp = Math.min(this.run.lordHp, this.stats.maxHp);
  }

  // ---------------------------------------------------------------------------
  // Shop

  runUpgradeCost(id: RunUpgradeId): number {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return runUpgradeCost(def, this.run.levels[id]);
  }

  isRunUpgradeMaxed(id: RunUpgradeId): boolean {
    const def = RUN_UPGRADES.find((u) => u.id === id)!;
    return def.maxLevel !== undefined && this.run.levels[id] >= def.maxLevel;
  }

  buyRunUpgrade(id: RunUpgradeId): boolean {
    if (this.phase === 'fallen' || this.isRunUpgradeMaxed(id)) return false;
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
    this.onPersist();
    return true;
  }

  /** Start a new run after falling. */
  rise(): void {
    this.run = this.freshRun();
    this.save.run = this.run;
    this.stats = computeStats(this.run.levels, this.save.prestige);
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
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) this.startWave();
      return;
    }

    this.regen(dt);
    this.moveAndAttack(dt);
    this.applyAura(dt);
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

  private regen(dt: number): void {
    this.run.lordHp = Math.min(this.stats.maxHp, this.run.lordHp + this.stats.regen * dt);
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
        h.attackTimer = def.attackInterval;
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
    const taken = h.damage * (1 - this.stats.armor);
    this.run.lordHp -= taken;
    this.lordHurt = 0;
    this.run.hitsTaken++;
    const p = heroPos(h);
    if (def.ranged) {
      this.effects.push({ type: 'arrow', x1: p.x, y1: p.y, x2: LORD_X, y2: LORD_Y - LORD_CHEST, color: h.kind === 'battlemage' ? '#8fe3ff' : '#d9d2c0', t: 0, ttl: 0.25 });
    }
    this.effects.push({ type: 'text', x: LORD_X + (this.rng() - 0.5) * 30, y: LORD_Y - LORD_CHEST - 20, text: '-' + fmt(taken), color: '#ff7a6b', t: 0, ttl: 0.8 });

    if (this.stats.thorns > 0) {
      const reflected = h.damage * this.stats.thorns;
      this.damageHero(h, reflected, '#c78bff');
      this.effects.push({ type: 'thorn', x: p.x, y: p.y, t: 0, ttl: 0.35 });
    }
    if (this.stats.shockwaveDamage > 0 && this.run.hitsTaken % SHOCKWAVE_HITS === 0) {
      const edge = RANGES[SHOCKWAVE_REACH].edge;
      this.effects.push({ type: 'ring', x: LORD_X, y: LORD_Y, r: edge, color: '#b06bff', t: 0, ttl: 0.6 });
      for (const other of this.heroes) if (other.dist <= edge) this.damageHero(other, this.stats.shockwaveDamage, '#d7b0ff');
    }
  }

  private auraMultiplier(): number {
    return this.stats.wrath && this.run.lordHp < this.stats.maxHp * 0.5 ? 2 : 1;
  }

  private applyAura(dt: number): void {
    const dps = this.stats.auraDps * this.auraMultiplier();
    for (const h of this.heroes) {
      if (h.dist > RANGES[this.stats.auraReach].edge) continue;
      const reduction = h.kind === 'champion' ? CHAMPION_AURA_REDUCTION : 1;
      this.damageHero(h, dps * dt * reduction, null);
    }
  }

  private damageHero(h: Hero, amount: number, color: string | null): void {
    if (h.hp <= 0) return;
    h.hp -= amount;
    if (color) {
      const p = heroPos(h);
      this.effects.push({ type: 'text', x: p.x + (this.rng() - 0.5) * 16, y: p.y - 24, text: fmt(amount), color, t: 0, ttl: 0.7 });
      h.hurt = 0;
    } else if (h.hurt > 0.25) {
      h.hurt = 0.12; // soft flicker while inside the aura
    }
  }

  private removeDead(): void {
    // Kills can chain through Corpse Burst, so loop until nothing new dies.
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
    if (this.stats.bloodPact > 0) this.run.lordHp = Math.min(this.stats.maxHp, this.run.lordHp + this.stats.maxHp * this.stats.bloodPact);
    if (h.kind === 'champion') {
      this.run.lordHp = this.stats.maxHp;
      this.effects.push({ type: 'text', x: LORD_X + 20, y: LORD_Y - LORD_CHEST - 50, text: 'Champion slain!', color: '#ffd166', t: 0, ttl: 1.8 });
    }
    if (this.stats.corpseBurst) {
      this.effects.push({ type: 'ring', x: p.x, y: p.y, r: 60, color: '#ff9b4a', t: 0, ttl: 0.45 });
      for (const o of this.heroes) {
        const q = heroPos(o);
        if (Math.hypot(q.x - p.x, q.y - p.y) <= 60) this.damageHero(o, h.maxHp * CORPSE_BURST_SHARE, '#ffb27a');
      }
    }
  }

  private fall(): void {
    this.phase = 'fallen';
    this.run.lordHp = 0;
    const wave = this.run.wave;
    const dread = dreadForWave(wave);
    const newBest = wave > this.save.bestWave;
    this.save.bestWave = Math.max(this.save.bestWave, wave);
    this.save.dread += dread;
    this.save.runs++;
    this.save.run = null;
    this.lastSummary = { wave, dread, bestWave: this.save.bestWave, newBest };
    this.onPersist();
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
