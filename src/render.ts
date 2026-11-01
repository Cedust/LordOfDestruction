import { DEPTH, HEROES, LORD_X, LORD_Y, WORLD_H, WORLD_W, type HeroKind } from './game/config';
import { heroPos, type Game, type Hero } from './game/game';

// Images are optional: drop a PNG into public/assets/ with one of these names and it
// replaces the placeholder shape automatically.
const IMAGE_NAMES = ['lord', 'throne-room', 'squire', 'archer', 'cutpurse', 'cleric', 'champion'] as const;
type ImageName = (typeof IMAGE_NAMES)[number];

const images: Partial<Record<ImageName, HTMLImageElement>> = {};

export function loadImages(): void {
  for (const name of IMAGE_NAMES) {
    const img = new Image();
    img.onload = () => (images[name] = img);
    img.src = `assets/${name}.png`;
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
      // Cover the world area, anchored to the bottom where the floor is.
      const s = Math.max(WORLD_W / bg.width, WORLD_H / bg.height);
      const w = bg.width * s;
      const h = bg.height * s;
      ctx.drawImage(bg, (WORLD_W - w) / 2, WORLD_H - h, w, h);
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

  private drawAura(game: Game): void {
    const ctx = this.ctx;
    const r = game.stats.auraRadius;
    const pulse = 1 + Math.sin(game.time * 3) * 0.03;
    const wrath = game.stats.wrath && game.run.lordHp < game.stats.maxHp * 0.5;
    const g = ctx.createRadialGradient(LORD_X, LORD_Y, r * 0.2, LORD_X, LORD_Y, r * pulse);
    g.addColorStop(0, wrath ? 'rgba(255,90,60,0.28)' : 'rgba(150,80,255,0.22)');
    g.addColorStop(0.85, wrath ? 'rgba(255,90,60,0.12)' : 'rgba(150,80,255,0.10)');
    g.addColorStop(1, 'rgba(150,80,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(LORD_X, LORD_Y, r * pulse, r * pulse * DEPTH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = wrath ? 'rgba(255,120,80,0.45)' : 'rgba(180,120,255,0.35)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(LORD_X, LORD_Y, r, r * DEPTH, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawLord(game: Game): void {
    const ctx = this.ctx;
    const hurt = game.lordHurt < 0.12;
    const fallen = game.phase === 'fallen';
    const img = images.lord;
    ctx.save();
    if (fallen) ctx.globalAlpha = 0.45;
    if (img) {
      const h = 120;
      const w = (img.width / img.height) * h;
      ctx.drawImage(img, LORD_X - w / 2, LORD_Y - h * 0.62, w, h);
      if (hurt) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,60,60,0.35)';
        ctx.fillRect(LORD_X - w / 2, LORD_Y - h * 0.62, w, h);
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
    const walking = h.dist > def.stopDist + 0.5;
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
  cleric: '+',
  champion: 'P',
};
