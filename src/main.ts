import './style.css';
import { Game } from './game/game';
import { loadSave, writeSave } from './game/state';
import { Renderer, loadImages } from './render';
import { UI } from './ui';

const save = loadSave();
const game = new Game(save);

function persist(): void {
  writeSave({ ...game.save, run: game.snapshotRun() });
}
game.onPersist = persist;

const renderer = new Renderer(document.querySelector<HTMLCanvasElement>('#battle')!);
const SPEEDS = [1, 2, 3];
const ui = new UI(game, () => {
  const i = SPEEDS.indexOf(game.save.speed);
  game.save.speed = SPEEDS[(i + 1) % SPEEDS.length];
  persist();
});

// Fixed-step simulation. No offline progress: a hidden tab simply pauses.
const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let uiTimer = 0;
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt * game.save.speed;
  while (acc >= STEP) {
    game.update(STEP);
    acc -= STEP;
  }
  renderer.draw(game);
  uiTimer += dt;
  if (uiTimer > 0.1) {
    uiTimer = 0;
    ui.update();
  }
  requestAnimationFrame(frame);
}
ui.update();
// Start drawing once the art is ready (or after 4 s on a very slow connection),
// so the placeholder shapes never flash on first load.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
Promise.race([loadImages(), timeout]).then(() =>
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  }),
);

setInterval(persist, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
  last = performance.now();
});
window.addEventListener('pagehide', persist);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
