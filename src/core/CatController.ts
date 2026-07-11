import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CatState = 'idle' | 'sit' | 'paw-lick' | 'tail-curl' | 'walk';

const MODEL_URL = 'assets/cat.glb';
const CAT_HEIGHT = 1.5; // world units, matches the capsule placeholder scale

/** Clip-name heuristics: real model animation names vary by author. */
const CLIP_HINTS: Record<CatState, string[]> = {
  idle: ['idle', 'breath', 'stand'],
  sit: ['sit', 'rest', 'sleep', 'lie'],
  'paw-lick': ['lick', 'groom', 'clean', 'wash'],
  'tail-curl': ['tail', 'curl', 'stretch'],
  walk: ['walk', 'run', 'trot'],
};

/**
 * The player character. Loads the real GLTF cat from /assets/cat.glb when
 * present (drop the file in — no code change needed); until then a capsule
 * placeholder keeps every block playable. Idle state machine crossfades
 * between whatever clips the model ships; missing clips degrade gracefully.
 */
export class CatController {
  readonly object3D = new THREE.Group();
  state: CatState = 'idle';
  /** True once the real GLTF model is in use (placeholder replaced). */
  modelLoaded = false;

  private stateTime = 0;
  private moving = false;
  private placeholder = new THREE.Group();
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<CatState, THREE.AnimationAction>();
  private activeAction: THREE.AnimationAction | null = null;
  private modelRoot: THREE.Object3D | null = null;

  /** Rest poses cycle after this much idle time (seconds). */
  private static REST_AFTER = 6;
  private static REST_DURATION = 4;

  constructor() {
    const fur = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.9 });
    const bodyGeo = new THREE.CapsuleGeometry(0.55, 0.9, 6, 16);
    const headGeo = new THREE.SphereGeometry(0.45, 20, 16);
    this.materials.push(fur);
    this.geometries.push(bodyGeo, headGeo);

    const body = new THREE.Mesh(bodyGeo, fur);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.55;

    const head = new THREE.Mesh(headGeo, fur);
    head.position.set(0.85, 0.95, 0);

    this.placeholder.add(body, head);
    this.object3D.add(this.placeholder);
    this.object3D.name = 'cat';

    void this.tryLoadModel();
  }

  /** Swap the capsule for the real cat if /assets/cat.glb exists. */
  private async tryLoadModel(): Promise<void> {
    try {
      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      const model = gltf.scene;

      // normalize: unknown author scale/origin → CAT_HEIGHT tall, feet at y=0
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = CAT_HEIGHT / Math.max(size.y, 1e-6);
      model.scale.setScalar(scale);
      const scaled = new THREE.Box3().setFromObject(model);
      const center = scaled.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= scaled.min.y;

      this.object3D.add(model);
      this.object3D.remove(this.placeholder);
      this.modelRoot = model;
      this.modelLoaded = true;

      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const state of Object.keys(CLIP_HINTS) as CatState[]) {
          const clip = this.findClip(gltf.animations, CLIP_HINTS[state]);
          if (clip) this.actions.set(state, this.mixer.clipAction(clip));
        }
        // no idle-ish clip found → loop the first clip so she's never frozen
        if (!this.actions.get('idle')) {
          this.actions.set('idle', this.mixer.clipAction(gltf.animations[0]));
        }
        this.play('idle');
      }
    } catch {
      // no model yet — the capsule placeholder stays; drop cat.glb in public/assets
    }
  }

  private findClip(clips: THREE.AnimationClip[], hints: string[]): THREE.AnimationClip | null {
    for (const hint of hints) {
      const clip = clips.find((c) => c.name.toLowerCase().includes(hint));
      if (clip) return clip;
    }
    return null;
  }

  private play(state: CatState): void {
    const next = this.actions.get(state) ?? this.actions.get('idle');
    if (!next || next === this.activeAction) return;
    next.reset().fadeIn(0.35).play();
    this.activeAction?.fadeOut(0.35);
    this.activeAction = next;
  }

  /** Blocks report walking so the walk clip can take over. */
  setMoving(moving: boolean): void {
    if (moving === this.moving) return;
    this.moving = moving;
    if (moving) {
      this.setState('walk');
    } else if (this.state === 'walk') {
      this.setState('idle');
    }
  }

  private setState(next: CatState): void {
    this.state = next;
    this.stateTime = 0;
    this.play(next);
    // TODO(stage-3 audio pass): purr on 'sit'.
  }

  update(dt: number): void {
    this.stateTime += dt;
    switch (this.state) {
      case 'idle':
        if (!this.moving && this.stateTime > CatController.REST_AFTER) {
          const poses: CatState[] = ['sit', 'paw-lick', 'tail-curl'];
          this.setState(poses[Math.floor(Math.random() * poses.length)]);
        }
        break;
      case 'sit':
      case 'paw-lick':
      case 'tail-curl':
        if (this.moving) this.setState('walk');
        else if (this.stateTime > CatController.REST_DURATION) this.setState('idle');
        break;
      case 'walk':
        break;
    }

    if (this.mixer) {
      this.mixer.update(dt);
    } else {
      // placeholder breathing so the capsule reads as alive
      const breathe = 1 + Math.sin(this.stateTime * 2.2) * 0.015;
      this.object3D.scale.set(1, breathe, 1);
    }
  }

  dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.modelRoot?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          for (const v of Object.values(m) as unknown[]) {
            if (v instanceof THREE.Texture) v.dispose();
          }
          m.dispose();
        }
      }
    });
  }
}
