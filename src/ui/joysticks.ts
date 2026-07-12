/**
 * Sky:CotL-style twin touch handles, mouse-friendly too.
 * Left circle: move (forward/back/left/right, camera-relative).
 * Right circle: camera angle (orbit azimuth + pitch).
 * Writes normalized vectors into shared refs read by WalkController and
 * the camera rig each frame.
 */

export interface JoystickVec {
  x: number;
  y: number;
}

export interface Joysticks {
  /** Normalized move input: y = forward, x = strafe right. */
  move: JoystickVec;
  /** Normalized camera input: x = orbit, y = pitch. */
  cam: JoystickVec;
  setVisible(v: boolean): void;
  dispose(): void;
}

let styled = false;

function ensureStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .wl-stick {
      position: absolute;
      bottom: max(4.5%, env(safe-area-inset-bottom, 0px));
      width: clamp(84px, 13vw, 120px);
      height: clamp(84px, 13vw, 120px);
      border-radius: 50%;
      background: rgba(255, 250, 240, 0.18);
      border: 2px solid rgba(255, 250, 240, 0.45);
      backdrop-filter: blur(2px);
      pointer-events: auto;
      touch-action: none;
      transition: opacity 0.6s ease;
      z-index: 15;
    }
    .wl-stick.hidden { opacity: 0; pointer-events: none; }
    .wl-stick-left { left: max(4%, env(safe-area-inset-left, 0px)); }
    .wl-stick-right { right: max(4%, env(safe-area-inset-right, 0px)); }
    .wl-stick-knob {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 42%;
      height: 42%;
      border-radius: 50%;
      background: rgba(255, 250, 240, 0.75);
      box-shadow: 0 1px 8px rgba(74, 63, 92, 0.35);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .wl-stick-icon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(74, 63, 92, 0.55);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      pointer-events: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

function makePad(
  parent: HTMLElement,
  side: 'left' | 'right',
  label: string,
  out: JoystickVec,
): { el: HTMLElement; dispose(): void } {
  const pad = document.createElement('div');
  pad.className = `wl-stick wl-stick-${side}`;
  pad.setAttribute('role', 'application');
  pad.setAttribute('aria-label', label);
  const knob = document.createElement('div');
  knob.className = 'wl-stick-knob';
  const icon = document.createElement('div');
  icon.className = 'wl-stick-icon';
  icon.textContent = side === 'left' ? '✥' : '⟳';
  pad.append(icon, knob);
  parent.appendChild(pad);

  let pointerId: number | null = null;

  const setFromEvent = (e: PointerEvent): void => {
    const r = pad.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = (e.clientX - (r.left + radius)) / radius;
    let dy = (e.clientY - (r.top + radius)) / radius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    out.x = dx;
    out.y = -dy; // up = forward / pitch up
    knob.style.transform = `translate(calc(-50% + ${dx * radius * 0.55}px), calc(-50% + ${dy * radius * 0.55}px))`;
  };

  const reset = (): void => {
    pointerId = null;
    out.x = 0;
    out.y = 0;
    knob.style.transform = 'translate(-50%, -50%)';
  };

  const onDown = (e: PointerEvent): void => {
    pointerId = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    setFromEvent(e);
  };
  const onMove = (e: PointerEvent): void => {
    if (e.pointerId === pointerId) setFromEvent(e);
  };
  const onUp = (e: PointerEvent): void => {
    if (e.pointerId === pointerId) reset();
  };

  pad.addEventListener('pointerdown', onDown);
  pad.addEventListener('pointermove', onMove);
  pad.addEventListener('pointerup', onUp);
  pad.addEventListener('pointercancel', onUp);

  return {
    el: pad,
    dispose() {
      pad.remove();
    },
  };
}

export function createJoysticks(parent: HTMLElement): Joysticks {
  ensureStyles();
  const move: JoystickVec = { x: 0, y: 0 };
  const cam: JoystickVec = { x: 0, y: 0 };
  const left = makePad(parent, 'left', 'move the cat', move);
  const right = makePad(parent, 'right', 'rotate the camera', cam);
  return {
    move,
    cam,
    setVisible(v: boolean) {
      left.el.classList.toggle('hidden', !v);
      right.el.classList.toggle('hidden', !v);
    },
    dispose() {
      left.dispose();
      right.dispose();
    },
  };
}
