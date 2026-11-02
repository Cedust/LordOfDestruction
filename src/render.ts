import { DEPTH, FLOOR_Y, HEROES, RANGES, rangeIndex, LORD_X, LORD_Y, WORLD_H, WORLD_W } from './game/config';
import { heroPos, type Game, type Hero } from './game/game';
import { assetUrl } from './assets';

// Game art from assets/. Everything is drawn from these images; there are no
// placeholder shapes any more.
// Background framing (world units). BG_SCALE zooms throne-room.png, BG_SHIFT_X moves
// it sideways; LORD_FEET_DY is where the Lord's feet sit relative to LORD_Y.
const BG_SCALE = 0.32;
const BG_SHIFT_X = 0;
const LORD_FEET_DY = 0;
/** Left border of the drawn field (world x): the left edge of the screen. */
const FIELD_LEFT = 0;
/** Outline of the raised dais in throne-room.png pixels (top surface plus steps). */
const DAIS_PX: [number, number][] = [[0, 495], [598, 495], [600, 540], [487, 752], [0, 752]];

const IMAGE_PATHS = {
  lord: 'characters/lord',
  'throne-room': 'environments/throne-room',
  squire: 'enemies/squire',
  archer: 'enemies/archer',
  cutpurse: 'enemies/cutpurse',
  battlemage: 'enemies/battlemage',
  champion: 'enemies/champion',
} as const;
type ImageName = keyof typeof IMAGE_PATHS;

const images: Partial<Record<ImageName, HTMLImageElement>> = {};

/**
 * Loads all game art. Resolves once every image has loaded or failed, so the first
 * frame already shows the real art.
 */
export function loadImages(): Promise<void> {
  const pending: Promise<void>[] = [];
  for (const name of Object.keys(IMAGE_PATHS) as ImageName[]) {
    const url = assetUrl(IMAGE_PATHS[name]);
    if (!url) continue;
    const img = new Image();
    pending.push(
      new Promise((resolve) => {
        img.onload = () => {
          images[name] = img;
          resolve();
        };
        img.onerror = () => resolve();
      }),
    );
    img.src = url;
  }
  return Promise.all(pending).then(() => undefined);
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = this.canvas.clientWidth;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round((w * WORLD_H) / WORLD_W) * dpr;
    this.ctx.setTransform((w * dpr) / WORLD_W, 0, 0, (w * dpr) / WORLD_W, 0, 0);
  }

  draw(game: Game): void {
    const ctx = this.ctx;
    this.drawBackground();
    this.drawRanges(game);
    this.drawAura(game);
    this.drawLord(game);
    const heroes = [...game.heroes].sort((a, b) => heroPos(a).y - heroPos(b).y);
    for (const h of heroes) this.drawHero(h);
    this.drawEffects(game);
    ctx.globalAlpha = 1;
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const bg = images['throne-room'];
    if (bg) {
      // Anchored to the top and zoomed slightly so the raised platform on the left
      // of throne-room.png sits right under the Lord's feet.
      const s = Math.max(WORLD_W / bg.width, WORLD_H / bg.height, BG_SCALE);
      const w = bg.width * s;
      const h = bg.height * s;
      ctx.drawImage(bg, (WORLD_W - w) / 2 + BG_SHIFT_X, 0, w, h);
      return;
    }
    ctx.fillStyle = '#1b1426';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  /** Faint range borders on the floor with their names, so players can read who stands where. */
  /**
   * Clip to the floor so markings never climb the back wall. 'with' adds the whole dais
   * top up to its back edge (Near and the aura), 'without' leaves the dais out (Mid, Far).
   */
  private clipFloor(dais: 'with' | 'without'): void {
    const ctx = this.ctx;
    const bg = images['throne-room'];
    ctx.beginPath();
    ctx.rect(0, FLOOR_Y, WORLD_W, WORLD_H - FLOOR_Y);
    if (!bg) {
      ctx.clip();
      return;
    }
    const s = Math.max(WORLD_W / bg.width, WORLD_H / bg.height, BG_SCALE);
    const x0 = (WORLD_W - bg.width * s) / 2 + BG_SHIFT_X;
    if (dais === 'with') {
      DAIS_PX.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + px * s, py * s));
      ctx.closePath();
      ctx.clip('nonzero');
    } else {
      ctx.clip();
      ctx.beginPath();
      ctx.rect(0, 0, WORLD_W, WORLD_H);
      DAIS_PX.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + px * s, py * s));
      ctx.closePath();
      ctx.clip('evenodd');
    }
  }

  /** Ring of the battlefield between two radii, squashed onto the floor (clip to the field first). */
  private fanPath(r0: number, r1: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(LORD_X, LORD_Y, r1, r1 * DEPTH, 0, 0, Math.PI * 2);
    if (r0 > 0) ctx.ellipse(LORD_X, LORD_Y, r0, r0 * DEPTH, 0, Math.PI * 2, 0, true);
  }

  /** The field starts at the vertical line FIELD_LEFT. */
  private clipField(): void {
    this.ctx.beginPath();
    this.ctx.rect(FIELD_LEFT, 0, WORLD_W - FIELD_LEFT, WORLD_H);
    this.ctx.clip();
  }

  /**
   * Ranges are painted onto the floor: alternating soft bands for Near, Mid and Far,
   * a faint rune circle on every fixed spot, and the range names along the bottom.
   */
  private drawRanges(game: Game): void {
    const ctx = this.ctx;
    let inner = 0;
    RANGES.forEach((range, i) => {
      const covered = game.stats.auraDps[i] > 0;
      // Near includes the dais the Lord stands on; Mid and Far stay on the open floor.
      ctx.save();
      this.clipFloor(i > 0 ? 'without' : 'with');
      this.clipField();
      this.fanPath(inner, range.edge);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(10,6,18,0.20)' : 'rgba(10,6,18,0.06)';
      ctx.fill();
      // Outer border of the band.
      ctx.strokeStyle = covered ? 'rgba(200,150,255,0.45)' : 'rgba(235,220,255,0.18)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash(covered ? [] : [3, 5]);
      ctx.beginPath();
      ctx.ellipse(LORD_X, LORD_Y, range.edge, range.edge * DEPTH, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Fixed spots.
      for (const a of range.slots) {
        const x = LORD_X + Math.cos(a) * range.dist;
        const y = LORD_Y + Math.sin(a) * range.dist * DEPTH;
        ctx.strokeStyle = covered ? 'rgba(200,150,255,0.35)' : 'rgba(235,220,255,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 11, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      inner = range.edge;
    });

    // Range names in small pills along the lower edge of the fan, in the middle of each band.
    ctx.save();
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    inner = 0;
    RANGES.forEach((range, i) => {
      const covered = game.stats.auraDps[i] > 0;
      const mid = (inner + range.edge) / 2;
      const x = FIELD_LEFT + 24;
      const y = Math.min(WORLD_H - 9, LORD_Y + mid * DEPTH);
      const w = ctx.measureText(range.name.toUpperCase()).width + 10;
      ctx.fillStyle = 'rgba(16,10,26,0.65)';
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 6, w, 12, 6);
      ctx.fill();
      ctx.fillStyle = covered ? 'rgba(215,180,255,0.95)' : 'rgba(235,225,245,0.55)';
      ctx.fillText(range.name.toUpperCase(), x, y + 0.5);
      inner = range.edge;
    });
    ctx.restore();
  }

  private drawAura(game: Game): void {
    const ctx = this.ctx;
    if (game.stats.auraReach < 0) return;
    const r = RANGES[game.stats.auraReach].edge;
    const pulse = 1 + Math.sin(game.time * 3) * 0.03;
    const tint = '150,80,255';
    ctx.save();
    this.clipFloor('with');
    // The aura ends on the same vertical line as the field.
    this.clipField();
    // The gradient is drawn in a squashed space so it stays round on the floor.
    ctx.translate(LORD_X, LORD_Y);
    ctx.scale(1, DEPTH);
    const g = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * pulse);
    g.addColorStop(0, `rgba(${tint},0.30)`);
    g.addColorStop(0.8, `rgba(${tint},0.14)`);
    g.addColorStop(1, `rgba(${tint},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private tints = new Map<string, HTMLCanvasElement>();

  /** A sprite with a flash colour laid over its own pixels only (not over the background). */
  private tinted(img: HTMLImageElement, color: string): HTMLCanvasElement {
    const key = img.src + color;
    let c = this.tints.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const t = c.getContext('2d')!;
      t.drawImage(img, 0, 0);
      t.globalCompositeOperation = 'source-atop';
      t.fillStyle = color;
      t.fillRect(0, 0, c.width, c.height);
      this.tints.set(key, c);
    }
    return c;
  }

  private drawLord(game: Game): void {
    const ctx = this.ctx;
    const hurt = game.lordHurt < 0.12;
    const fallen = game.phase === 'fallen';
    const img = images.lord;
    ctx.save();
    if (fallen) ctx.globalAlpha = 0.45;
    if (img) {
      const h = 150;
      const w = (img.width / img.height) * h;
      const top = LORD_Y + LORD_FEET_DY - h;
      ctx.drawImage(hurt ? this.tinted(img, 'rgba(255,60,60,0.35)') : img, LORD_X - w / 2, top, w, h);
    }
    ctx.restore();
  }

  private drawHero(h: Hero): void {
    const ctx = this.ctx;
    const def = HEROES[h.kind];
    const p = heroPos(h);
    const walking = h.slot < 0 || h.dist > RANGES[rangeIndex(def.range)].dist + 0.5;
    const bob = walking ? Math.abs(Math.sin(h.anim * 9)) * 3 : 0;
    // A small lunge toward the lord right after a melee attack.
    const lunge = !walking && !def.ranged ? Math.max(0, 1 - (def.attackInterval - h.attackTimer) * 6) * 6 : 0;
    const x = p.x - lunge;
    const y = p.y - bob;
    const r = def.radius;
    const img = images[h.kind as ImageName];

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (img) {
      const size = r * 3.4;
      const sprite = h.hurt < 0.12 ? this.tinted(img, 'rgba(255,255,255,0.45)') : img;
      ctx.drawImage(sprite, x - size / 2, y + r - size, size, size);
    }

    // Health bar
    const bw = r * 2.2;
    const by = y - r - r * 1.6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - bw / 2, by, bw, 4);
    ctx.fillStyle = h.kind === 'champion' ? '#ffd166' : '#e05a5a';
    ctx.fillRect(x - bw / 2, by, bw * Math.max(0, h.hp / h.maxHp), 4);
  }

  private drawEffects(game: Game): void {
    const ctx = this.ctx;
    for (const e of game.effects) {
      const k = e.t / e.ttl;
      ctx.globalAlpha = 1 - k;
      switch (e.type) {
        case 'text':
          ctx.fillStyle = e.color;
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.lineWidth = 3;
          ctx.strokeText(e.text, e.x, e.y - k * 18);
          ctx.fillText(e.text, e.x, e.y - k * 18);
          break;
        case 'arrow': {
          const hx = e.x1 + (e.x2 - e.x1) * Math.min(1, k * 1.6);
          const hy = e.y1 + (e.y2 - e.y1) * Math.min(1, k * 1.6);
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hx - (e.x2 - e.x1) * 0.12, hy - (e.y2 - e.y1) * 0.12);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          break;
        }
        case 'ring':
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 4 * (1 - k) + 1;
          ctx.beginPath();
          ctx.ellipse(e.x, e.y, e.r * k, e.r * k * DEPTH, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'thorn':
          ctx.strokeStyle = '#c78bff';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + 0.4;
            ctx.beginPath();
            ctx.moveTo(e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6);
            ctx.lineTo(e.x + Math.cos(a) * (10 + k * 8), e.y + Math.sin(a) * (10 + k * 8));
            ctx.stroke();
          }
          break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
