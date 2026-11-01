import { DEPTH, FIELD_ANGLE_MAX, FIELD_ANGLE_MIN, FLOOR_Y, HEROES, RANGES, rangeIndex, LORD_X, LORD_Y, WORLD_H, WORLD_W, type HeroKind } from './game/config';
import { heroPos, type Game, type Hero } from './game/game';
import { assetUrl } from './assets';

// Images are optional: a PNG at one of these paths below assets/ replaces the
// placeholder shape automatically.
// Background framing (world units). BG_SCALE zooms throne-room.png, BG_SHIFT_X moves
// it sideways; LORD_FEET_DY is where the Lord's feet sit relative to LORD_Y.
const BG_SCALE = 0.32;
const BG_SHIFT_X = 0;
const LORD_FEET_DY = 0;
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

export function loadImages(): void {
  for (const name of Object.keys(IMAGE_PATHS) as ImageName[]) {
    const url = assetUrl(IMAGE_PATHS[name]);
    if (!url) continue;
    const img = new Image();
    img.onload = () => (images[name] = img);
    img.src = url;
  }
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
    const wall = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    wall.addColorStop(0, '#1b1426');
    wall.addColorStop(0.45, '#2a1f38');
    wall.addColorStop(0.46, '#3a2f45');
    wall.addColorStop(1, '#241c2e');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // Pillars
    ctx.fillStyle = '#231a30';
    for (const x of [150, 270, 390]) ctx.fillRect(x - 12, 0, 24, WORLD_H * 0.46);
    // Floor tiles
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = WORLD_H * 0.46; y < WORLD_H; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
      ctx.stroke();
    }
  }

  /** Faint range borders on the floor with their names, so players can read who stands where. */
  /** Clip to the floor so markings never climb the back wall. */
  private clipFloor(excludeDais = false): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(0, FLOOR_Y, WORLD_W, WORLD_H - FLOOR_Y);
    const bg = images['throne-room'];
    if (excludeDais && bg) {
      // Range markings stay on the open floor; the dais is the Lord's ground.
      const s = Math.max(WORLD_W / bg.width, WORLD_H / bg.height, BG_SCALE);
      const x0 = (WORLD_W - bg.width * s) / 2 + BG_SHIFT_X;
      DAIS_PX.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x0 + px * s, py * s));
      ctx.closePath();
    }
    ctx.clip('evenodd');
  }

  /** Annular sector of the battlefield fan between two radii, squashed onto the floor. */
  private fanPath(r0: number, r1: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(LORD_X, LORD_Y, r1, r1 * DEPTH, 0, FIELD_ANGLE_MIN, FIELD_ANGLE_MAX);
    if (r0 > 0) ctx.ellipse(LORD_X, LORD_Y, r0, r0 * DEPTH, 0, FIELD_ANGLE_MAX, FIELD_ANGLE_MIN, true);
    else ctx.lineTo(LORD_X, LORD_Y);
    ctx.closePath();
  }

  /**
   * Ranges are painted onto the floor: alternating soft bands for Near, Mid and Far,
   * a faint rune circle on every fixed spot, and the range names along the bottom.
   */
  private drawRanges(game: Game): void {
    const ctx = this.ctx;
    let inner = 0;
    RANGES.forEach((range, i) => {
      const covered = i <= game.stats.auraReach;
      // Near includes the dais the Lord stands on; Mid and Far stay on the open floor.
      ctx.save();
      this.clipFloor(i > 0);
      this.fanPath(inner, range.edge);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(10,6,18,0.20)' : 'rgba(10,6,18,0.06)';
      ctx.fill();
      // Outer border of the band.
      ctx.strokeStyle = covered ? 'rgba(200,150,255,0.45)' : 'rgba(235,220,255,0.18)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash(covered ? [] : [3, 5]);
      ctx.beginPath();
      ctx.ellipse(LORD_X, LORD_Y, range.edge, range.edge * DEPTH, 0, FIELD_ANGLE_MIN, FIELD_ANGLE_MAX);
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
      const covered = i <= game.stats.auraReach;
      const mid = (inner + range.edge) / 2;
      const x = LORD_X + Math.cos(FIELD_ANGLE_MAX) * mid + 14;
      const y = Math.min(WORLD_H - 9, LORD_Y + Math.sin(FIELD_ANGLE_MAX) * mid * DEPTH);
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
    const r = RANGES[game.stats.auraReach].edge;
    const pulse = 1 + Math.sin(game.time * 3) * 0.03;
    const wrath = game.stats.wrath && game.run.lordHp < game.stats.maxHp * 0.5;
    const tint = wrath ? '255,90,60' : '150,80,255';
    ctx.save();
    this.clipFloor();
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
      ctx.drawImage(img, LORD_X - w / 2, top, w, h);
      if (hurt) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,60,60,0.35)';
        ctx.fillRect(LORD_X - w / 2, top, w, h);
      }
      ctx.restore();
      return;
    }
    // Placeholder: throne, body, crown, glowing eyes.
    ctx.fillStyle = '#120d18';
    ctx.beginPath();
    ctx.moveTo(LORD_X - 34, LORD_Y + 40);
    ctx.lineTo(LORD_X - 30, LORD_Y - 60);
    ctx.lineTo(LORD_X - 14, LORD_Y - 44);
    ctx.lineTo(LORD_X, LORD_Y - 72);
    ctx.lineTo(LORD_X + 14, LORD_Y - 44);
    ctx.lineTo(LORD_X + 30, LORD_Y - 60);
    ctx.lineTo(LORD_X + 34, LORD_Y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hurt ? '#c0405a' : '#5b2a86';
    ctx.beginPath();
    ctx.ellipse(LORD_X, LORD_Y + 6, 24, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hurt ? '#e07a8a' : '#7b3fb0';
    ctx.beginPath();
    ctx.arc(LORD_X, LORD_Y - 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8cfc0';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(LORD_X + s * 9, LORD_Y - 40);
      ctx.lineTo(LORD_X + s * 20, LORD_Y - 58);
      ctx.lineTo(LORD_X + s * 13, LORD_Y - 38);
      ctx.fill();
    }
    ctx.fillStyle = '#ff9b3d';
    ctx.shadowColor = '#ff9b3d';
    ctx.shadowBlur = 8;
    ctx.fillRect(LORD_X - 7, LORD_Y - 32, 5, 3);
    ctx.fillRect(LORD_X + 2, LORD_Y - 32, 5, 3);
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
      ctx.drawImage(img, x - size / 2, y + r - size, size, size);
    } else {
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#1b1426';
      ctx.font = `bold ${Math.round(r * 1.1)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LETTER[h.kind], x, y + 1);
      if (h.kind === 'champion') {
        ctx.strokeStyle = 'rgba(255,230,140,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (h.hurt < 0.12) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar
    const bw = r * 2.2;
    const by = y - r - (img ? r * 1.6 : 8);
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

const LETTER: Record<HeroKind, string> = {
  squire: 'S',
  archer: 'A',
  cutpurse: 'C',
  battlemage: 'M',
  champion: 'P',
};
