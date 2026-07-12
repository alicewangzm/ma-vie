import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Orbit-style 360° rig, Sky:CotL feel: heavily damped, pitch clamped so the
 * camera never dives under the clouds or flips overhead. Follows a target
 * (the cat) with a smoothed offset.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private followTarget: THREE.Object3D | null = null;
  private followOffset = new THREE.Vector3(0, 2.2, 0);
  private desired = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 34;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.maxPolarAngle = Math.PI * 0.55;
  }

  /** Smoothly track an object (the cat). Pass null to hold position. */
  follow(target: THREE.Object3D | null, offsetY = 2.2): void {
    this.followTarget = target;
    this.followOffset.set(0, offsetY, 0);
  }

  /** Instantly aim at a world point (used for cinematic framing). */
  lookAt(point: THREE.Vector3): void {
    this.controls.target.copy(point);
  }

  /**
   * Chapter-start framing: camera close behind the cat (tail toward the
   * viewer, cat facing into the world), then keep following.
   */
  frameCat(cat: THREE.Object3D, distance = 12): void {
    cat.rotation.set(0, Math.PI, 0); // face away — tail to the user
    this.camera.position.set(
      cat.position.x,
      cat.position.y + distance * 0.38,
      cat.position.z + distance,
    );
    this.controls.target.copy(cat.position).add(this.followOffset);
    this.follow(cat);
  }

  /** Orbit rotation from the right joystick (radians per call). */
  nudgeOrbit(azimuth: number, polar: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta -= azimuth;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + polar, Math.PI * 0.18, Math.PI * 0.55);
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);
  }

  set enabled(v: boolean) {
    this.controls.enabled = v;
  }

  update(dt: number): void {
    if (this.followTarget) {
      this.desired.copy(this.followTarget.position).add(this.followOffset);
      // exponential smoothing, framerate-independent
      const k = 1 - Math.exp(-dt * 4);
      this.controls.target.lerp(this.desired, k);
    }
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
