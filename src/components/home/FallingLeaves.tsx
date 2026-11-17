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
};

const COLORS = ['#c9a15a', '#b8893f', '#8f6a2c', '#7d8a45', '#a65f2a', '#d8b878'];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeLeaf(width: number, fromTop: boolean, height: number): Leaf {
  const size = rand(9, 19);
  return {
    x: rand(-20, width + 20),
    y: fromTop ? rand(-60, -size * 2) : rand(-40, height * 0.9),
    size,
    vy: rand(0.35, 0.85),
    sway: rand(14, 34),
    swaySpeed: rand(0.6, 1.3),
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    vrot: rand(-0.025, 0.025),
    flip: rand(0, Math.PI * 2),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: rand(0.55, 0.9),
  };
}

function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf, t: number) {
  const s = leaf.size;
  // El "flip" achica el ancho para simular que la hoja gira en el aire.
  const squash = 0.35 + 0.65 * Math.abs(Math.cos(leaf.flip + t * leaf.swaySpeed));
  ctx.save();
  ctx.translate(leaf.x + Math.sin(t * leaf.swaySpeed + leaf.phase) * leaf.sway, leaf.y);
  ctx.rotate(leaf.rot);
  ctx.scale(squash, 1);
  ctx.globalAlpha = leaf.alpha;

  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.62, -s * 0.55, s * 0.6, s * 0.45, 0, s);
  ctx.bezierCurveTo(-s * 0.6, s * 0.45, -s * 0.62, -s * 0.55, 0, -s);
  ctx.fillStyle = leaf.color;
  ctx.fill();

  // Nervadura central y tallito
  ctx.strokeStyle = 'rgba(60, 35, 12, 0.45)';
  ctx.lineWidth = Math.max(0.6, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.85);
  ctx.lineTo(0, s * 1.25);
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
        leaf.y += leaf.vy + Math.abs(scrollPush) * 0.6;
        leaf.rot += leaf.vrot;
        leaf.flip += 0.01;
        if (leaf.y > height + 40 || leaf.x < -80 || leaf.x > width + 80) {
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
