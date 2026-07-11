import * as THREE from 'three';

/**
 * Floating card: a soft rounded panel with a title (+ optional subtitle).
 * Used for diplomas, project cards, logos, and envisioned screenshots —
 * placeholder art until real images land in /assets (Stage 3).
 */
export function makePanel(
  title: string,
  subtitle = '',
  accent = '#5b7396',
): { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial; dispose(): void } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d')!;
  // colored card + cream text — a near-white card melts into the sun glare
  g.fillStyle = accent;
  g.beginPath();
  g.roundRect(8, 8, c.width - 16, c.height - 16, 28);
  g.fill();
  g.strokeStyle = 'rgba(255, 250, 235, 0.9)';
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = '#fff8ea';
  g.textAlign = 'center';
  g.font = '600 34px ui-sans-serif, system-ui, sans-serif';
  wrapText(g, title, c.width / 2, subtitle ? 140 : 165, 440, 42);
  if (subtitle) {
    g.font = 'italic 24px ui-sans-serif, system-ui, sans-serif';
    g.globalAlpha = 0.85;
    wrapText(g, subtitle, c.width / 2, 214, 440, 32);
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.PlaneGeometry(4.4, 2.75);
  const material = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, material);
  return {
    mesh,
    material,
    dispose() {
      geo.dispose();
      material.dispose();
      tex.dispose();
    },
  };
}

function wrapText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const probe = line ? `${line} ${word}` : word;
    if (g.measureText(probe).width > maxWidth && line) {
      g.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = probe;
    }
  }
  g.fillText(line, x, y);
}
