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

// ---------------------------------------------------------------- setup
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const quality: 'low' | 'high' =
  navigator.maxTouchPoints > 0 && Math.min(window.innerWidth, window.innerHeight) < 900
    ? 'low'
    : 'high';

const MAX_DPR = quality === 'low' ? 1.5 : 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
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
  id: 'block02-journey-storm',
  load: async () => wire((await import('./blocks/block02-journey-storm')).createBlock()),
});
director.register({
  id: 'block03-three-paths',
  load: async () => wire((await import('./blocks/block03-three-paths')).createBlock()),
});
director.register({
  id: 'block04-connecting-dots',
  load: async () => wire((await import('./blocks/block04-connecting-dots')).createBlock()),
});
director.register({
  id: 'block05-finale',
  load: async () => wire((await import('./blocks/block05-finale')).createBlock()),
});

// skippable intro (accessibility requirement)
let skipTarget: { skipIntro(): void } | null = null;
const skipBtn = createButton(overlay, 'Skip intro', 'wl-corner wl-skip', () => {
  skipTarget?.skipIntro();
  skipBtn.remove();
});
skipBtn.classList.add('visible');
ctx.progress.subscribe((s) => {
  if (s.currentBlock !== 'block00-letter') skipBtn.remove();
});

// mute toggle — always visible
const muteBtn = createButton(overlay, '🔊', 'wl-corner wl-mute', () => {
  audio.start();
  muteBtn.textContent = audio.toggleMute() ? '🔇' : '🔊';
});
muteBtn.classList.add('visible');
muteBtn.setAttribute('aria-label', 'toggle sound');

void director.start();

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
