import './style.css';
import { Game } from './game/game';
import { clearSave, loadSave, writeSave } from './game/state';
import { Renderer, loadImages } from './render';
import { UI } from './ui';

const save = loadSave();
const game = new Game(save);

/** Set once the player restarts the game, so nothing writes the old save back. */
let wiped = false;
function persist(): void {
  if (wiped) return;
  writeSave(game.snapshotSave());
}
game.onPersist = persist;

const renderer = new Renderer(document.querySelector<HTMLCanvasElement>('#battle')!);
const ui = new UI(
  game,
  (speed) => {
    game.save.speed = speed;
    persist();
  },
  () => {
    // Restart Game: erase the save and load a fresh page, without the "Leave site?" prompt.
    wiped = true;
    clearSave();
    window.removeEventListener('beforeunload', onBeforeUnload);
    location.reload();
  },
);

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
// so nothing pops in on first load.
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
// F5, Ctrl+R or closing the tab by accident: save first, then let the browser ask
// "Leave site?" so the player can stay.
function onBeforeUnload(e: BeforeUnloadEvent): void {
  if (wiped) return;
  persist();
  e.preventDefault();
  e.returnValue = '';
}
window.addEventListener('beforeunload', onBeforeUnload);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
