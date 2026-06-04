import { toast } from 'react-hot-toast';
import { DIFFICULTY_META, QuizResult } from '../../data/quiz/quizTypes';
import { formatDuration, formatYearRanges, scoreMessage, typeBreakdown } from './quizScoring';

const cssVar = (name: string, fallback: string): string => {
  if (typeof window === 'undefined' || !document.documentElement) return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/**
 * Render a shareable summary card of a finished quiz.
 */
export const createQuizResultCanvas = (result: QuizResult): HTMLCanvasElement => {
  const breakdown = typeBreakdown(result);
  const W = 700;
  const breakdownTop = 446;
  const rowH = 30;
  const breakdownH = breakdown.length ? 30 + breakdown.length * rowH : 0;
  const H = breakdownTop + breakdownH + 58; // + footer area
  const ratio = 2;
  const font = 'Arial, sans-serif';

  const canvas = document.createElement('canvas');
  canvas.width = W * ratio;
  canvas.height = H * ratio;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');
  ctx.scale(ratio, ratio);

  const bg0 = cssVar('--er-body-bg', '#0d0f1d');
  const bg1 = cssVar('--er-ranked-bg-end', '#28315b');
  const accent = cssVar('--er-interactive-primary', '#9e33ea');
  const textPrimary = cssVar('--er-text-primary', '#e2e8f0');
  const textSecondary = cssVar('--er-text-secondary', '#cbd5e1');
  const textSubtle = cssVar('--er-text-subtle', '#a7b9d2');
  const cardBg = cssVar('--er-surface-tertiary', '#1c214c');

  // background
  const grad = ctx.createRadialGradient(W * 0.8, H * 0.85, 0, W * 0.8, H * 0.85, W);
  grad.addColorStop(0, bg1);
  grad.addColorStop(0.45, bg0);
  grad.addColorStop(1, bg0);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;

  // header
  ctx.textAlign = 'center';
  ctx.fillStyle = textSubtle;
  ctx.font = `600 16px ${font}`;
  ctx.fillText('EUROVISION QUIZ', W / 2, 50);

  ctx.fillStyle = textPrimary;
  ctx.font = `bold 30px ${font}`;
  ctx.fillText(scoreMessage(pct), W / 2, 92);

  // score ring
  const cx = W / 2;
  const cy = 215;
  const radius = 78;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.beginPath();
  const start = -Math.PI / 2;
  ctx.arc(cx, cy, radius, start, start + (Math.PI * 2 * pct) / 100);
  ctx.stroke();

  ctx.fillStyle = textPrimary;
  ctx.font = `bold 46px ${font}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`${result.score}/${result.total}`, cx, cy - 4);
  ctx.font = `600 18px ${font}`;
  ctx.fillStyle = textSecondary;
  ctx.fillText(`${pct}%`, cx, cy + 30);
  ctx.textBaseline = 'alphabetic';

  // stat pills
  const diff = DIFFICULTY_META[result.config.difficulty].label;
  const yearsLabel = formatYearRanges(result.config.years);

  const pills: [string, string][] = [
    ['Time', formatDuration(result.elapsedMs)],
    ['Difficulty', diff],
    ['Years', yearsLabel],
  ];

  const pillW = 200;
  const pillH = 64;
  const gap = 14;
  const totalW = pillW * pills.length + gap * (pills.length - 1);
  let px = (W - totalW) / 2;
  const py = 330;
  for (const [label, value] of pills) {
    ctx.fillStyle = cardBg;
    roundRect(ctx, px, py, pillW, pillH, 12);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = textSubtle;
    ctx.font = `600 12px ${font}`;
    ctx.fillText(label.toUpperCase(), px + pillW / 2, py + 24);

    // shrink the value to fit the pill, falling back to a count if needed
    ctx.fillStyle = textPrimary;
    let valueSize = 20;
    let display = value;
    const maxW = pillW - 24;
    ctx.font = `bold ${valueSize}px ${font}`;
    while (valueSize > 13 && ctx.measureText(display).width > maxW) {
      valueSize -= 1;
      ctx.font = `bold ${valueSize}px ${font}`;
    }
    if (label === 'Years' && ctx.measureText(display).width > maxW) {
      display = `${result.config.years.length} years`;
      valueSize = 20;
      ctx.font = `bold ${valueSize}px ${font}`;
    }
    ctx.fillText(display, px + pillW / 2, py + 50);
    px += pillW + gap;
  }

  // per-category breakdown
  if (breakdown.length) {
    const bx = 90;
    const bw = W - bx * 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = textSubtle;
    ctx.font = `600 12px ${font}`;
    ctx.fillText('BY CATEGORY', bx, breakdownTop);

    const labelW = 150;
    const countW = 50;
    const trackX = bx + labelW;
    const trackW = bw - labelW - countW - 16;
    const barH = 10;

    breakdown.forEach((row, i) => {
      const y = breakdownTop + 22 + i * rowH;
      const rowPct = row.total ? row.correct / row.total : 0;

      ctx.fillStyle = textSecondary;
      ctx.font = `500 14px ${font}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.label, bx, y + barH / 2);

      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, trackX, y, trackW, barH, barH / 2);
      ctx.fill();
      if (rowPct > 0) {
        ctx.fillStyle = accent;
        roundRect(ctx, trackX, y, Math.max(barH, trackW * rowPct), barH, barH / 2);
        ctx.fill();
      }

      ctx.fillStyle = textSubtle;
      ctx.font = `600 13px ${font}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${row.correct}/${row.total}`, W - bx, y + barH / 2);
    });
    ctx.textBaseline = 'alphabetic';
  }

  // footer
  ctx.textAlign = 'center';
  ctx.fillStyle = textSubtle;
  ctx.font = `italic 13px ${font}`;
  ctx.fillText('eurovision-ranker.com', W / 2, H - 28);

  return canvas;
};

export const downloadQuizResultImage = async (result: QuizResult): Promise<void> => {
  const toastId = toast.loading('Creating your result image...');
  try {
    const canvas = createQuizResultCanvas(result);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
    );
    if (!blob) throw new Error('Failed to create image blob.');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eurovision-quiz-${result.score}-of-${result.total}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.dismiss(toastId);
    toast.success('Result image downloaded!');
  } catch (error) {
    toast.dismiss(toastId);
    toast.error(`Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
  }
};
