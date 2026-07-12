import * as THREE from 'three';

/**
 * Minimal exploration controller: WASD/arrow keys (camera-relative) plus
 * tap/click-to-move via raycast against an invisible ground plane. Motion is
 * clamped to a disc so the cat can't wander off the island. Blocks own one
 * per exploration scene and dispose it on exit.
 */
export class WalkController {
  /** World point the cat is heading to (tap-to-move), or null. */
  private goal: THREE.Vector3 | null = null;
  private keys = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private plane: THREE.Plane;
  private moveDir = new THREE.Vector3();
  private camFwd = new THREE.Vector3();
  private camRight = new THREE.Vector3();
  /** True whenever the cat moved this frame (drives walk feedback). */
  moving = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (!e.repeat) this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onPointerDown = (e: PointerEvent) => this.handleTap(e);

  constructor(
    private target: THREE.Object3D,
    private camera: THREE.Camera,
    private dom: HTMLElement,
    private center: THREE.Vector3,
    private radius: number,
    private speed = 6,
    /** Analog input from the left joystick (y = forward, x = strafe). */
    private stick: { x: number; y: number } | null = null,
  ) {
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -center.y);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    dom.addEventListener('pointerdown', this.onPointerDown);
  }

  private handleTap(e: PointerEvent): void {
    const rect = this.dom.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, hit)) {
      this.clampToIsland(hit);
      this.goal = hit;
    }
  }

  private clampToIsland(p: THREE.Vector3): void {
    const off = p.clone().sub(this.center);
    off.y = 0;
    if (off.length() > this.radius) {
      off.setLength(this.radius);
      p.copy(this.center).add(off);
    }
    p.y = this.target.position.y;
  }

  update(dt: number): void {
    this.moveDir.set(0, 0, 0);
    const k = this.keys;
    let fwd =
      (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let side =
      (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) -
      (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (this.stick && (Math.abs(this.stick.x) > 0.12 || Math.abs(this.stick.y) > 0.12)) {
      fwd += this.stick.y;
      side += this.stick.x;
    }

    if (fwd !== 0 || side !== 0) {
      // camera-relative on the ground plane
      this.camera.getWorldDirection(this.camFwd);
      this.camFwd.y = 0;
      this.camFwd.normalize();
      this.camRight.crossVectors(this.camFwd, new THREE.Vector3(0, 1, 0)).negate();
      this.moveDir.addScaledVector(this.camFwd, fwd).addScaledVector(this.camRight, -side);
      this.goal = null; // keys override tap goal
    } else if (this.goal) {
      this.moveDir.subVectors(this.goal, this.target.position);
      this.moveDir.y = 0;
      if (this.moveDir.length() < 0.3) {
        this.goal = null;
        this.moveDir.set(0, 0, 0);
      }
    }

    this.moving = this.moveDir.lengthSq() > 0;
    if (this.moving) {
      this.moveDir.normalize();
      const next = this.target.position.clone().addScaledVector(this.moveDir, this.speed * dt);
      this.clampToIsland(next);
      next.y = this.target.position.y;
      this.target.position.copy(next);
      // face travel direction (smoothed)
      const yaw = Math.atan2(this.moveDir.x, this.moveDir.z);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
      this.target.quaternion.slerp(q, 1 - Math.exp(-dt * 8));
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
  }
}
