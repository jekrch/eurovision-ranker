import React, { useEffect, useRef } from 'react';

interface QuizCelebrationProps {
  /** The score percentage (0–100). Drives how intense/elaborate the effect is. */
  pct: number;
}

type RGB = [number, number, number];

/** Score tiers that the celebration evolves through. Below 50% there is no effect. */
const tierFor = (pct: number): 0 | 1 | 2 | 3 | 4 => {
  if (pct >= 100) return 4; // Douze points — the works: dense bursts + gold/white sparkle
  if (pct >= 90) return 3; //  Eurovision legend — dense + sparkle
  if (pct >= 75) return 2; //  Grand finalist — livelier, brighter
  if (pct >= 50) return 1; //  Through to the final — gentle themed drizzle
  return 0; //                 anything less: nothing
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/**
 * Resolve any CSS color value (hex / hsl / var-derived string) to an RGB triple by
 * letting the browser normalize it. Falls back to a Eurovision-y magenta.
 */
const resolveColor = (value: string): RGB => {
  try {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const m = computed.match(/\d+/g);
    if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
  } catch {
    /* ignore */
  }
  return [197, 71, 209];
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** rotation + spin, for the fluttering confetti look */
  angle: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  size: number;
  color: string;
  /** confetti ribbons vs. round sparkles */
  sparkle: boolean;
  /** 1 → 0; sparkles fade out, confetti just falls off-screen */
  life: number;
  decay: number;
}

const GOLD: RGB = [255, 207, 51];
const WHITE: RGB = [255, 255, 255];

/**
 * A full-bleed, pointer-transparent canvas that rains theme-colored confetti behind the
 * quiz results. The amount, speed, palette and the celebratory bursts all scale with the
 * score, so a "Through to the final" gets a tasteful drizzle while a perfect "Douze points"
 * earns repeated fountains studded with gold and white sparkles.
 *
 * Honors `prefers-reduced-motion` (renders nothing) and only animates for scores ≥ 50%.
 */
const QuizCelebration: React.FC<QuizCelebrationProps> = ({ pct }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = tierFor(pct);

  useEffect(() => {
    if (tier === 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 0 at the bottom of the celebratory range, 1 at a perfect score — the master dial
    // that everything else interpolates against.
    const intensity = clamp((pct - 45) / 55, 0, 1);

    // Build the palette from the live theme color, then "evolve" it as the score climbs:
    // primary-themed throughout, with brighter variants, then gold, then white sparkle
    // weighting added at the top tiers. Repeated entries bias the random pick.
    const primary = resolveColor(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--er-interactive-primary')
        .trim() || '#c547d1',
    );
    const light = mix(primary, WHITE, 0.4);
    const dark = mix(primary, [0, 0, 0], 0.25);
    const toStr = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

    const palette: string[] = [primary, light, dark].map(toStr);
    if (tier >= 2) palette.push(toStr(light), toStr(mix(primary, WHITE, 0.6)));
    if (tier >= 3) palette.push(toStr(GOLD), toStr(mix(GOLD, WHITE, 0.3)));
    if (tier >= 4) palette.push(toStr(GOLD), toStr(WHITE));

    const sparklePalette = [toStr(WHITE), toStr(GOLD), toStr(mix(GOLD, WHITE, 0.5))];

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles: Particle[] = [];
    const MAX = 60 + Math.round(220 * intensity);

    const pickColor = (sparkle: boolean) =>
      sparkle
        ? sparklePalette[(Math.random() * sparklePalette.length) | 0]
        : palette[(Math.random() * palette.length) | 0];

    const makeSparkle = (x: number, y: number): Particle => ({
      x,
      y,
      vx: rand(-0.3, 0.3),
      vy: rand(-0.2, 0.4),
      angle: 0,
      spin: 0,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.1, 0.2),
      size: rand(1.5, 3.5),
      color: pickColor(true),
      sparkle: true,
      life: 1,
      decay: rand(0.012, 0.025),
    });

    const makeConfetti = (x: number, y: number, vx: number, vy: number): Particle => ({
      x,
      y,
      vx,
      vy,
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.2, 0.2),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.04, 0.09),
      size: rand(5, 9 + tier),
      color: pickColor(false),
      sparkle: false,
      life: 1,
      decay: 0,
    });

    /** A celebratory upward fountain from a point — the "pop" moments. */
    const burst = (cx: number, cy: number, count: number, power: number) => {
      for (let i = 0; i < count && particles.length < MAX; i++) {
        const a = -Math.PI / 2 + rand(-0.7, 0.7);
        const speed = power * rand(0.5, 1.1);
        particles.push(makeConfetti(cx, cy, Math.cos(a) * speed, Math.sin(a) * speed));
        if (tier >= 3 && Math.random() < 0.25 && particles.length < MAX) {
          particles.push(makeSparkle(cx + rand(-20, 20), cy + rand(-20, 20)));
        }
      }
    };

    // Opening celebration: a fountain from the bottom-center (corners too, at high tiers),
    // larger and punchier the better the score.
    const openBurst = () => {
      const power = 7 + intensity * 7;
      burst(width / 2, height + 8, 24 + Math.round(40 * intensity), power);
      if (tier >= 3) {
        burst(width * 0.18, height + 8, 14 + Math.round(20 * intensity), power);
        burst(width * 0.82, height + 8, 14 + Math.round(20 * intensity), power);
      }
    };

    // Periodic encore bursts — only the upper tiers keep popping, and they taper off so the
    // screen settles into a calm background drizzle rather than partying forever.
    const encores: number[] = [];
    if (tier >= 3) {
      const count = tier >= 4 ? 4 : 2;
      for (let i = 1; i <= count; i++)
        encores.push(
          window.setTimeout(() => {
            burst(
              rand(width * 0.2, width * 0.8),
              height + 8,
              18 + Math.round(24 * intensity),
              7 + intensity * 6,
            );
          }, i * 900),
        );
    }

    let raf = 0;
    let last = performance.now();
    let drizzleAcc = 0;
    // Steady gentle fall from the top so there's always a little life in the background.
    const drizzlePerSec = 4 + intensity * 16;
    const gravity = 0.12;

    const frame = (now: number) => {
      const dt = clamp((now - last) / 16.667, 0, 3); // in 60fps-frame units
      last = now;

      // Top-of-screen drizzle, rate-limited and scaled by the score.
      drizzleAcc += (drizzlePerSec * dt) / 60;
      while (drizzleAcc >= 1) {
        drizzleAcc -= 1;
        if (particles.length < MAX) {
          const p = makeConfetti(rand(0, width), -10, rand(-0.4, 0.4), rand(1.2, 2.4));
          if (tier >= 3 && Math.random() < 0.15) {
            particles.push(makeSparkle(p.x, -10));
          } else {
            particles.push(p);
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += gravity * dt;
        p.vx *= 0.99;
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.cos(p.wobble) * (p.sparkle ? 0.2 : 0.8)) * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        if (p.sparkle) p.life -= p.decay * dt;

        // Cull anything that has fallen away or faded out.
        if (p.y > height + 20 || p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        if (p.sparkle) {
          // Twinkle: scale opacity with a fast wobble so sparkles shimmer.
          ctx.globalAlpha = p.life * (0.6 + 0.4 * Math.abs(Math.sin(p.wobble * 2)));
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.rotate(p.angle);
          // Squash width by the spin phase to fake a 3D flutter.
          const w = p.size * Math.abs(Math.cos(p.wobble));
          ctx.fillRect(-w / 2, -p.size / 2, w + 0.5, p.size);
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };

    openBurst();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      encores.forEach(clearTimeout);
      ro.disconnect();
    };
  }, [pct, tier]);

  if (tier === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full z-0"
    />
  );
};

export default QuizCelebration;
