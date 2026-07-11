import * as THREE from 'three';

export type CatState = 'idle' | 'sit' | 'paw-lick' | 'tail-curl';

/**
 * The player character. Stage 1 placeholder: capsule body + sphere head.
 * The idle state machine is real (timed rest-pose cycling); the poses are
 * stubs until the Draco GLTF cat + animation clips land in Stage 3.
 * Purr audio hooks into AudioBus in the Stage 3 audio pass.
 */
export class CatController {
  readonly object3D = new THREE.Group();
  state: CatState = 'idle';

  private stateTime = 0;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

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

    this.object3D.add(body, head);
    this.object3D.name = 'cat';
  }

  private setState(next: CatState): void {
    this.state = next;
    this.stateTime = 0;
    // TODO(stage-3): crossfade to the matching GLTF animation clip;
    // trigger purr audio on 'sit'.
  }

  update(dt: number): void {
    this.stateTime += dt;
    switch (this.state) {
      case 'idle':
        if (this.stateTime > CatController.REST_AFTER) {
          const poses: CatState[] = ['sit', 'paw-lick', 'tail-curl'];
          this.setState(poses[Math.floor(Math.random() * poses.length)]);
        }
        break;
      case 'sit':
      case 'paw-lick':
      case 'tail-curl':
        if (this.stateTime > CatController.REST_DURATION) this.setState('idle');
        break;
    }
    // placeholder breathing so the capsule reads as alive
    const breathe = 1 + Math.sin(this.stateTime * 2.2) * 0.015;
    this.object3D.scale.set(1, breathe, 1);
  }

  dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
