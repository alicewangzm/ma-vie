import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { theme } from './theme';
import { Director } from './core/Director';
import { createProgressStore } from './core/progress';
import { CameraRig } from './core/CameraRig';
import { CatController } from './core/CatController';
import { AudioBus } from './core/AudioBus';
import type { WorldContext } from './core/WorldContext';
import { Environment } from './render/Environment';
import { CloudWipe } from './render/CloudWipe';
import { ensureOverlayStyles, createButton } from './ui/overlay';
import { createJoysticks } from './ui/joysticks';
import { createTracker } from './ui/tracker';

// ---------------------------------------------------------------- setup
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const quality: 'low' | 'high' =
  navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) < 900
    ? 'low'
    : 'high';

const MAX_DPR = quality === 'low' ? 1.5 : 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
// first clear matches the page background + wipe tint — no color pop at boot
renderer.setClearColor('#f4e9ef', 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('app')!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 46);

const dreamFactor = { value: 0 };
const env = new Environment(scene, camera, dreamFactor, quality);
const rig = new CameraRig(camera, renderer.domElement);
rig.lookAt(new THREE.Vector3(0, 9, 0));

const cat = new CatController();
cat.object3D.visible = false; // appears when Block 01 begins
scene.add(cat.object3D);

const audio = new AudioBus();
const overlay = document.getElementById('overlay')!;
ensureOverlayStyles();

// Sky:CotL-style twin handles: left = move, right = camera angle
const joysticks = createJoysticks(overlay);
joysticks.setVisible(false); // shown in walkable chapters only

const ctx: WorldContext = {
  scene,
  renderer,
  camera,
  rig,
  cat,
  audio,
  env,
  dreamFactor,
  progress: createProgressStore(),
  overlay,
  reducedMotion,
  quality,
  moveInput: joysticks.move,
};

// ---------------------------------------------------------------- post
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  theme.bloom.strength,
  theme.bloom.radius,
  theme.bloom.threshold,
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- story
const wipe = new CloudWipe(reducedMotion);
const director = new Director(ctx, wipe);

director.register({
  id: 'block00-letter',
  load: async () => {
    const mod = await import('./blocks/block00-letter');
    const block = mod.createBlock();
    block.setAdvanceHandler(() => void director.next());
    skipTarget = block;
    return block;
  },
});
// Each chapter advances itself (beacon walk-in or button) via director.next().
// Import paths stay literal so Vite code-splits one lazy chunk per chapter.
const wire = <T extends { setAdvanceHandler(fn: () => void): void }>(block: T): T => {
  block.setAdvanceHandler(() => void director.next());
  return block;
};
director.register({
  id: 'block01-who-is-alice',
  load: async () => wire((await import('./blocks/block01-who-is-alice')).createBlock()),
});
director.register({
  id: 'block02-university',
  load: async () => wire((await import('./blocks/block02-university')).createBlock()),
});
director.register({
  id: 'block03-storm',
  load: async () => wire((await import('./blocks/block03-storm')).createBlock()),
});
director.register({
  id: 'block04-alethea',
  load: async () => wire((await import('./blocks/block04-alethea')).createBlock()),
});
director.register({
  id: 'block05-teaching',
  load: async () => wire((await import('./blocks/block05-teaching')).createBlock()),
});
director.register({
  id: 'block06-three-paths',
  load: async () => wire((await import('./blocks/block06-three-paths')).createBlock()),
});
director.register({
  id: 'block07-connecting-dots',
  load: async () => wire((await import('./blocks/block07-connecting-dots')).createBlock()),
});
director.register({
  id: 'block08-finale',
  load: async () => wire((await import('./blocks/block08-finale')).createBlock()),
});

// star tracker: click a star to revisit / jump ahead to any chapter
const chapterLabels: Record<string, string> = {
  'block00-letter': 'The Letter',
  'block01-who-is-alice': 'Who Is Alice',
  'block02-university': 'One Road, Two Sides',
  'block03-storm': 'The Storm Before Sunrise',
  'block04-alethea': 'Building in the Rain',
  'block05-teaching': 'Where She Is Now',
  'block06-three-paths': 'Three Roads From Here',
  'block07-connecting-dots': 'Connecting the Dots',
  'block08-finale': 'To Be Continued',
};
createTracker(
  overlay,
  director.chapterIds.map((id) => ({ id, label: chapterLabels[id] ?? id })),
  ctx.progress,
  (i) => void director.jumpTo(i),
);

// corner controls live in one bar so nothing hangs off the screen edge
const cornerBar = document.createElement('div');
cornerBar.className = 'wl-corner-bar';
overlay.appendChild(cornerBar);

// skippable intro (accessibility requirement)
let skipTarget: { skipIntro(): void } | null = null;
const skipBtn = createButton(cornerBar, 'Skip →', 'wl-corner', () => {
  skipTarget?.skipIntro();
  skipBtn.remove();
});
skipBtn.classList.add('visible');

// skip the walking objective of the current chapter (text still plays).
// Ignore presses mid-wipe or right after a chapter change — currentBlock
// swaps to the incoming chapter before the clouds open, so a stray second
// click used to fast-forward a chapter the traveler never saw.
let blockChangedAt = 0;
const skipStepBtn = createButton(cornerBar, 'skip step ⏭', 'wl-corner', () => {
  if (director.isBusy || performance.now() - blockChangedAt < 1000) return;
  const block = director.currentBlock as {
    skipInteraction?: () => void;
    skipToEnd?: () => void;
  } | null;
  // in the finale the same button resolves the whole story to its end
  if (director.currentId === 'block08-finale') block?.skipToEnd?.();
  else block?.skipInteraction?.();
});
skipStepBtn.setAttribute('aria-label', 'skip the current step');
skipStepBtn.style.display = 'none';

// mute toggle — always visible; inline-SVG speaker reflects the state
const speakerSvg = (muted: boolean): string =>
  muted
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const muteBtn = createButton(cornerBar, '', 'wl-corner', () => {
  audio.start();
  const muted = audio.toggleMute();
  muteBtn.innerHTML = `${speakerSvg(muted)}<span>sound</span>`;
  muteBtn.setAttribute('aria-pressed', String(muted));
});
muteBtn.innerHTML = `${speakerSvg(false)}<span>sound</span>`;
muteBtn.classList.add('visible');
muteBtn.setAttribute('aria-label', 'toggle sound');
muteBtn.setAttribute('aria-pressed', 'false');

// per-chapter chrome: joysticks + skip-step in walkable chapters only
const WALKABLE = new Set([
  'block01-who-is-alice',
  'block02-university',
  'block03-storm',
  'block04-alethea',
  'block05-teaching',
  'block06-three-paths',
]);
ctx.progress.subscribe((s) => {
  blockChangedAt = performance.now();
  if (s.currentBlock !== 'block00-letter') skipBtn.remove();
  joysticks.setVisible(WALKABLE.has(s.currentBlock ?? ''));
  // chapters past the letter can fast-forward; the finale runs unhurried
  // (its hobby row has its own "all at once" reveal)
  const skippable = s.currentBlock !== null && s.currentBlock !== 'block00-letter';
  skipStepBtn.style.display = skippable ? '' : 'none';
  skipStepBtn.textContent = s.currentBlock === 'block08-finale' ? 'skip to end ⏭' : 'skip step ⏭';
  skipStepBtn.classList.add('visible');
});

// start audio as early as the browser allows: immediately where autoplay
// is granted, otherwise on the very first gesture anywhere on the page
audio.start();
const wakeAudio = (): void => {
  audio.start();
  window.removeEventListener('pointerdown', wakeAudio);
  window.removeEventListener('keydown', wakeAudio);
};
window.addEventListener('pointerdown', wakeAudio);
window.addEventListener('keydown', wakeAudio);

// reduced-motion notice (first load, dismissable)
if (reducedMotion) {
  const notice = document.createElement('button');
  notice.className = 'wl-notice';
  notice.textContent = 'Motion softened for you. Same story, gentler sky. ×';
  notice.addEventListener('click', () => notice.remove());
  overlay.appendChild(notice);
}

// resume where the traveler left off (progress survives refresh)
const savedIndex = director.chapterIds.indexOf(ctx.progress.get().currentBlock ?? '');
void director.start(Math.max(savedIndex, 0));

// dev-only hook so e2e smoke tests can step the chain and read world state
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__wonderland = { director, ctx, wipe };
}

// ---------------------------------------------------------------- loop
// Adaptive DPR: if frame times sag below ~50fps, step pixel ratio down.
const DPR_STEPS = [MAX_DPR, 1.5, 1.25, 1].filter((v, i, a) => v <= MAX_DPR && a.indexOf(v) === i);
let dprIndex = 0;
let slowFrames = 0;

const clock = new THREE.Clock();

function tick(): void {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  director.update(dt, t);
  env.update(dt, t);
  // right joystick steers the camera angle
  if (Math.abs(joysticks.cam.x) > 0.1 || Math.abs(joysticks.cam.y) > 0.1) {
    rig.nudgeOrbit(joysticks.cam.x * dt * 2.4, -joysticks.cam.y * dt * 1.6);
  }
  rig.update(dt);
  wipe.update(dt, t);

  env.renderDepthPrepass(renderer, camera);
  composer.render();

  renderer.autoClear = false;
  wipe.render(renderer);
  renderer.autoClear = true;

  // perf watchdog
  if (dt > 1 / 50) slowFrames += 1;
  else slowFrames = Math.max(0, slowFrames - 2);
  if (slowFrames > 90 && dprIndex < DPR_STEPS.length - 1) {
    dprIndex += 1;
    slowFrames = 0;
    renderer.setPixelRatio(DPR_STEPS[dprIndex]);
    composer.setPixelRatio(DPR_STEPS[dprIndex]);
  }
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
