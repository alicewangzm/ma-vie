import type * as THREE from 'three';
import type { CameraRig } from './CameraRig';
import type { CatController } from './CatController';
import type { AudioBus } from './AudioBus';
import type { ProgressStore } from './progress';
import type { Environment } from '../render/Environment';

/**
 * Shared world state handed to every StoryBlock. Blocks add their own
 * contents to `scene` and must remove + dispose them on exit.
 */
export interface WorldContext {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  rig: CameraRig;
  cat: CatController;
  audio: AudioBus;
  env: Environment;
  /**
   * Global reality↔dream dial (0 = full-color reality, 1 = faded vision).
   * Shared as a uniform by the sky and cloud shaders; blocks animate `.value`.
   */
  dreamFactor: { value: number };
  progress: ProgressStore;
  /** DOM root for story text and UI (typewriter lines, buttons). */
  overlay: HTMLElement;
  reducedMotion: boolean;
  /** 'low' on touch/small screens: fewer particles, lower DPR. */
  quality: 'low' | 'high';
  /** Left joystick vector (y = forward, x = strafe) — shared with WalkController. */
  moveInput: { x: number; y: number };
}
