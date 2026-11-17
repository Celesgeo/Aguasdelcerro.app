'use client';

import { useEffect, useRef } from 'react';

/**
 * Hojas que caen suavemente sobre la home.
 * Siempre hay unas pocas en el aire y al hacer scroll caen más,
 * empujadas por la velocidad del desplazamiento.
 * Respeta "reducir movimiento" y se pausa con la pestaña oculta.
 */

type Leaf = {
  x: number;
  y: number;
  size: number;
  vy: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  rot: number;
  vrot: number;
  flip: number;
  color: string;
  alpha: number;
  shape: number;
};

const COLORS = ['#b5823c', '#9c6a2a', '#c99a4b', '#7f7a3a', '#8a5a2b', '#a0763a', '#6f7536', '#b0683a'];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Ancho libre a cada lado del contenido (donde no hay fotos ni textos). */
function sideBand(width: number) {
  const content = Math.min(width, 1200);
  const margin = (width - content) / 2;
  return margin >= 70 ? margin - 10 : Math.min(26, width * 0.07);
}

function makeLeaf(width: number, fromTop: boolean, height: number): Leaf {
  const band = sideBand(width);
  const small = band < 40;
  const size = small ? rand(6, 10) : rand(9, 18);
  const left = Math.random() < 0.5;
  const x = left ? rand(4, Math.max(8, band - 6)) : rand(width - Math.max(8, band - 6), width - 4);
  return {
    x,
    y: fromTop ? rand(-60, -size * 2) : rand(-40, height * 0.9),
    size,
    vy: rand(0.35, 0.85),
    sway: small ? rand(3, 7) : Math.min(rand(10, 26), band * 0.25),
    swaySpeed: rand(0.6, 1.3),
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    vrot: rand(-0.025, 0.025),
    flip: rand(0, Math.PI * 2),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: rand(0.72, 0.95),
    shape: Math.floor(Math.random() * 5),
  };
}

/** Aclara u oscurece un color hex (amount entre -1 y 1). */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

/** Contorno de cada tipo de hoja, en unidades de 1 (se escala con el tamaño). */
function leafPath(shape: number): Path2D {
  const p = new Path2D();
  switch (shape) {
    case 1: // sauce: fina y larga, apenas curvada
      p.moveTo(0, -1.35);
      p.bezierCurveTo(0.34, -0.7, 0.3, 0.55, 0.04, 1.3);
      p.bezierCurveTo(-0.26, 0.6, -0.3, -0.6, 0, -1.35);
      break;
    case 2: // redonda (álamo)
      p.moveTo(0, -0.95);
      p.bezierCurveTo(0.55, -1.0, 1.0, -0.35, 0.82, 0.25);
      p.bezierCurveTo(0.65, 0.75, 0.25, 0.95, 0, 1.05);
      p.bezierCurveTo(-0.25, 0.95, -0.65, 0.75, -0.82, 0.25);
      p.bezierCurveTo(-1.0, -0.35, -0.55, -1.0, 0, -0.95);
      break;
    case 3: { // lobulada (tipo plátano/arce suave)
      const pts: [number, number][] = [
        [0, -1.05], [0.2, -0.62], [0.55, -0.82], [0.48, -0.38], [0.95, -0.25],
        [0.62, 0.05], [0.78, 0.42], [0.35, 0.38], [0.12, 0.78], [0, 1.0],
        [-0.12, 0.78], [-0.35, 0.38], [-0.78, 0.42], [-0.62, 0.05], [-0.95, -0.25],
        [-0.48, -0.38], [-0.55, -0.82], [-0.2, -0.62],
      ];
      p.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k <= pts.length; k++) {
        const [x0, y0] = pts[k - 1];
        const [x1, y1] = pts[k % pts.length];
        p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      p.closePath();
      break;
    }
    default: // ovalada con punta (la clásica)
      p.moveTo(0, -1.1);
      p.bezierCurveTo(0.5, -0.75, 0.66, 0.2, 0.05, 1.0);
      p.bezierCurveTo(-0.55, 0.35, -0.62, -0.62, 0, -1.1);
  }
  return p;
}

const PATHS = [0, 1, 2, 3].map(leafPath);

function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf, t: number) {
  const s = leaf.size;
  // Giro en el aire: el ancho se achica y la hoja se oscurece un poco al ponerse de canto.
  const turn = Math.cos(leaf.flip + t * leaf.swaySpeed * 0.8);
  const squash = 0.25 + 0.75 * Math.abs(turn);
  ctx.save();
  ctx.translate(leaf.x + Math.sin(t * leaf.swaySpeed + leaf.phase) * leaf.sway, leaf.y);
  ctx.rotate(leaf.rot + Math.sin(t * leaf.swaySpeed + leaf.phase) * 0.35);
  ctx.scale(squash * s, s);
  ctx.globalAlpha = leaf.alpha;

  if (leaf.shape === 4) {
    // Ramita de algarrobo: hojitas a los costados de un eje
    const g = ctx.createLinearGradient(0, -1.1, 0, 1.1);
    g.addColorStop(0, shade(leaf.color, 0.25));
    g.addColorStop(1, shade(leaf.color, -0.2));
    ctx.fillStyle = g;
    ctx.strokeStyle = shade(leaf.color, -0.35);
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.moveTo(0, -1.15);
    ctx.quadraticCurveTo(0.08, 0, 0, 1.15);
    ctx.stroke();
    for (let k = -2; k <= 2; k++) {
      const y = k * 0.42;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 0.27, y, 0.25, 0.1, side * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  const path = PATHS[leaf.shape];
  const back = turn < 0; // dorso de la hoja: más apagado
  const g = ctx.createLinearGradient(-0.8, -1, 0.8, 1);
  g.addColorStop(0, shade(leaf.color, back ? 0.05 : 0.3));
  g.addColorStop(0.55, shade(leaf.color, back ? -0.1 : 0));
  g.addColorStop(1, shade(leaf.color, back ? -0.35 : -0.25));
  ctx.fillStyle = g;
  ctx.fill(path);

  // Borde apenas más oscuro
  ctx.strokeStyle = shade(leaf.color, -0.35);
  ctx.globalAlpha = leaf.alpha * 0.55;
  ctx.lineWidth = 0.035;
  ctx.stroke(path);

  // Nervaduras: central y laterales
  ctx.clip(path);
  ctx.strokeStyle = shade(leaf.color, back ? -0.45 : 0.35);
  ctx.globalAlpha = leaf.alpha * 0.6;
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.moveTo(0, -0.95);
  ctx.quadraticCurveTo(0.06, 0, 0, 1.05);
  ctx.stroke();
  ctx.lineWidth = 0.03;
  for (let k = -0.55; k <= 0.6; k += 0.28) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0.02, k);
      ctx.quadraticCurveTo(side * 0.3, k - 0.12, side * 0.62, k - 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Tallito
  ctx.save();
  ctx.translate(leaf.x + Math.sin(t * leaf.swaySpeed + leaf.phase) * leaf.sway, leaf.y);
  ctx.rotate(leaf.rot + Math.sin(t * leaf.swaySpeed + leaf.phase) * 0.35);
  ctx.scale(squash * s, s);
  ctx.globalAlpha = leaf.alpha;
  ctx.strokeStyle = shade(leaf.color, -0.4);
  ctx.lineWidth = 0.06;
  ctx.beginPath();
  ctx.moveTo(0, leaf.shape === 2 ? 1.0 : 0.95);
  ctx.quadraticCurveTo(0.05, 1.15, 0.12, 1.35);
  ctx.stroke();
  ctx.restore();
}

export default function FallingLeaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const leaves: Leaf[] = [];
    let raf = 0;
    let lastY = window.scrollY;
    let scrollPush = 0;
    let running = true;

    const isSmall = () => width < 768;
    const ambient = () => (isSmall() ? 5 : 8);
    const maxLeaves = () => (isSmall() ? 26 : 44);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    for (let i = 0; i < ambient(); i++) leaves.push(makeLeaf(width, false, height));

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      scrollPush = Math.max(-6, Math.min(6, scrollPush + dy * 0.02));
      const extra = Math.min(4, Math.floor(Math.abs(dy) / 70));
      for (let i = 0; i < extra && leaves.length < maxLeaves(); i++) {
        leaves.push(makeLeaf(width, true, height));
      }
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };

    function loop(now: number) {
      if (!running) return;
      const t = now / 1000;
      ctx!.clearRect(0, 0, width, height);
      scrollPush *= 0.92;

      for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];
        leaf.y += leaf.vy * (0.75 + 0.45 * Math.abs(Math.sin(t * leaf.swaySpeed + leaf.phase))) + Math.abs(scrollPush) * 0.6;
        leaf.rot += leaf.vrot;
        leaf.flip += 0.01;
        if (leaf.y > height + 40) {
          if (leaves.length > ambient()) leaves.splice(i, 1);
          else Object.assign(leaf, makeLeaf(width, true, height));
          continue;
        }
        drawLeaf(ctx!, leaf, t);
      }
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
