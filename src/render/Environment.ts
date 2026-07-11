import * as THREE from 'three';
import { theme } from '../theme';
import { Sky } from './Sky';
import { Clouds } from './Clouds';
import { radialTexture } from './textures';

/**
 * The persistent world every block lives inside: sky, sun, clouds, fog,
 * hill, lights. Blocks retune it (time-of-day, fog, dream) rather than
 * rebuilding it. Owns the depth prepass that feeds soft-particle clouds.
 */
export class Environment {
  readonly sky: Sky;
  readonly clouds: Clouds;
  readonly sunDir = new THREE.Vector3();
  readonly fog: THREE.FogExp2;

  private hill: THREE.Mesh;
  private hillMat: THREE.MeshStandardMaterial;
  private sunLight: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private sunHalo: THREE.Sprite;
  private sunCore: THREE.Mesh;
  private depthTarget: THREE.WebGLRenderTarget;
  private baseFogDensity: number = theme.fog.density;
  private sunVisible = true;
  private dreamFactor: { value: number };
  private disposables: (THREE.Texture | THREE.Material | THREE.BufferGeometry)[] = [];

  constructor(
    private scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    dreamFactor: { value: number },
    quality: 'low' | 'high',
  ) {
    this.dreamFactor = dreamFactor;

    this.fog = new THREE.FogExp2(new THREE.Color(theme.fog.color), theme.fog.density);
    scene.fog = this.fog;

    this.setSunAngles(theme.sun.azimuth, theme.sun.elevation);

    this.sky = new Sky(this.sunDir, dreamFactor);
    scene.add(this.sky.mesh);

    this.clouds = new Clouds(quality === 'low' ? 130 : 300, this.fog, camera, dreamFactor);
    scene.add(this.clouds.mesh);

    // lights
    this.hemi = new THREE.HemisphereLight(0xdfe8ff, 0xead0c8, 0.9);
    this.sunLight = new THREE.DirectionalLight(
      new THREE.Color(theme.sun.lightColor),
      theme.sun.lightIntensity,
    );
    this.sunLight.position.copy(this.sunDir).multiplyScalar(100);
    scene.add(this.hemi, this.sunLight);

    // sun halo + hot core (bloom catches the core)
    const haloTex = radialTexture([
      [0.0, 'rgba(255,248,230,1.0)'],
      [0.15, 'rgba(255,236,200,0.85)'],
      [0.45, 'rgba(255,214,180,0.30)'],
      [1.0, 'rgba(255,200,170,0.0)'],
    ]);
    this.disposables.push(haloTex);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      opacity: theme.sun.haloIntensity,
    });
    this.disposables.push(haloMat);
    this.sunHalo = new THREE.Sprite(haloMat);
    this.sunHalo.position.copy(this.sunDir).multiplyScalar(735);
    this.sunHalo.scale.setScalar(theme.sun.haloSize * 4);

    const coreGeo = new THREE.SphereGeometry(8, 16, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false });
    this.disposables.push(coreGeo, coreMat);
    this.sunCore = new THREE.Mesh(coreGeo, coreMat);
    this.sunCore.position.copy(this.sunDir).multiplyScalar(750);
    scene.add(this.sunHalo, this.sunCore);

    // hill
    const hillGeo = new THREE.SphereGeometry(30, 48, 32);
    this.hillMat = new THREE.MeshStandardMaterial({ roughness: 1.0 });
    this.hillMat.color.set(theme.hill.color).lerp(this.fog.color, theme.hill.fade);
    this.disposables.push(hillGeo, this.hillMat);
    this.hill = new THREE.Mesh(hillGeo, this.hillMat);
    this.hill.scale.set(1.4, 0.5, 1.4);
    this.hill.position.set(0, -14, -6);
    scene.add(this.hill);

    // depth prepass target for soft-particle clouds
    this.depthTarget = new THREE.WebGLRenderTarget(1, 1);
    this.depthTarget.depthTexture = new THREE.DepthTexture(1, 1);
  }

  /** Fog density before the dreamFactor lift is applied each frame. */
  getBaseFogDensity(): number {
    return this.baseFogDensity;
  }

  setBaseFogDensity(d: number): void {
    this.baseFogDensity = d;
  }

  getSunIntensity(): number {
    return this.sunLight.intensity;
  }

  setSunIntensity(v: number): void {
    this.sunLight.intensity = v;
  }

  /** Sun sprite + hot core visibility (the storm hides the sun). */
  setSunVisible(v: boolean): void {
    this.sunVisible = v;
    this.sunHalo.visible = v;
    this.sunCore.visible = v;
  }

  setSunAngles(azimuthDeg: number, elevationDeg: number): void {
    const az = THREE.MathUtils.degToRad(azimuthDeg);
    const el = THREE.MathUtils.degToRad(elevationDeg);
    this.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  }

  setSize(width: number, height: number): void {
    this.depthTarget.setSize(width, height);
  }

  /**
   * Render opaque scene depth (clouds hidden) so the cloud shader can fade
   * at intersections. Opaque geometry is a handful of meshes — cheap.
   */
  renderDepthPrepass(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    if (this.depthTarget.width !== size.x || this.depthTarget.height !== size.y) {
      this.depthTarget.setSize(size.x, size.y);
    }
    this.clouds.mesh.visible = false;
    this.sunHalo.visible = false;
    renderer.setRenderTarget(this.depthTarget);
    renderer.clear();
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
    this.clouds.mesh.visible = true;
    this.sunHalo.visible = this.sunVisible;
    this.clouds.setDepthTexture(this.depthTarget.depthTexture!, size.x, size.y);
  }

  update(_dt: number, t: number): void {
    this.sky.update(t);
    this.clouds.update(t);
    // dream state lifts the fog
    const dream = this.dreamFactor.value;
    this.fog.density = this.baseFogDensity * (1 - dream * 0.6);
    this.clouds.uniforms.uFogDensity.value = this.fog.density;
  }

  dispose(): void {
    this.sky.dispose();
    this.clouds.dispose();
    this.depthTarget.depthTexture?.dispose();
    this.depthTarget.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
