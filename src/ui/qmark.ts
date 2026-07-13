import * as THREE from 'three';

/**
 * A floating "?" button anchored to a 3D world point — projected to screen
 * space every frame so it rides the scenery. Clicking it opens the cloud
 * modal for that spot. DOM-based so it's keyboard/reader accessible.
 */

let styled = false;

function ensureStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .wl-qmark {
      position: absolute;
      width: 2.2rem;
      height: 2.2rem;
      margin: -1.1rem 0 0 -1.1rem;
      border-radius: 50%;
      border: 1px solid rgba(74, 63, 92, 0.4);
      background: rgba(255, 250, 240, 0.92);
      color: #4a3f5c;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 0 14px rgba(255, 215, 106, 0.75);
      animation: wl-qmark-bob 2.6s ease-in-out infinite;
      transition: opacity 0.4s ease, transform 0.2s ease;
      z-index: 12;
    }
    .wl-qmark:hover { transform: scale(1.18); }
    .wl-qmark[data-offscreen='1'] { opacity: 0; pointer-events: none; }
    @keyframes wl-qmark-bob {
      0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 106, 0.55); }
      50% { box-shadow: 0 0 20px rgba(255, 215, 106, 0.95); }
    }
    @media (prefers-reduced-motion: reduce) {
      .wl-qmark { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export interface QMark {
  /**
   * Re-project to screen space; call once per frame. Pass the cat's
   * position to make the ? a discovery: it only fades in once the cat
   * wanders close (within `nearRadius`).
   */
  update(camera: THREE.Camera, catPos?: THREE.Vector3, nearRadius?: number): void;
  setVisible(v: boolean): void;
  dispose(): void;
}

const _v = new THREE.Vector3();
export const QMARK_NEAR_RADIUS = 8;

export function createQMark(
  parent: HTMLElement,
  worldPos: THREE.Vector3,
  label: string,
  onClick: () => void,
): QMark {
  ensureStyles();
  const btn = document.createElement('button');
  btn.className = 'wl-qmark';
  btn.textContent = '?';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.addEventListener('click', onClick);
  parent.appendChild(btn);
  let visible = true;

  return {
    update(camera: THREE.Camera, catPos?: THREE.Vector3, nearRadius = QMARK_NEAR_RADIUS) {
      const far = catPos ? worldPos.distanceTo(catPos) > nearRadius : false;
      _v.copy(worldPos).project(camera);
      const off = !visible || far || _v.z > 1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05;
      btn.dataset.offscreen = off ? '1' : '0';
      if (!off) {
        btn.style.left = `${((_v.x + 1) / 2) * 100}%`;
        btn.style.top = `${((1 - _v.y) / 2) * 100}%`;
      }
    },
    setVisible(v: boolean) {
      visible = v;
    },
    dispose() {
      btn.remove();
    },
  };
}
