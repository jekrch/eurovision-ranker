/** Format an elapsed millisecond duration as m:ss (or h:mm:ss). */
export const formatDuration = (ms: number): string => {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

import { QUESTION_GROUP_META, QuizResult } from '../../data/quiz/quizTypes';
import { QUIZ_YEARS } from './quizGenerator';

/**
 * Format the selected quiz years compactly, collapsing blocks that are
 * contiguous among the available contest years into ranges (e.g.
 * ['2019','2021','2022','2023'] -> "2019–2023" since 2020 had no contest).
 * An empty or full selection renders as "All years".
 */
export const formatYearRanges = (years: string[]): string => {
  if (!years.length || years.length >= QUIZ_YEARS.length) return 'All years';

  const orderAsc = [...QUIZ_YEARS].map(Number).sort((a, b) => a - b);
  const indexOf = new Map(orderAsc.map((y, i) => [y, i]));

  const selected = [...new Set(years.map(Number))]
    .filter((n) => indexOf.has(n))
    .sort((a, b) => a - b);
  if (!selected.length) return 'All years';

  const parts: string[] = [];
  let start = selected[0];
  let prev = selected[0];
  const flush = (s: number, e: number) => parts.push(s === e ? `${s}` : `${s}–${e}`);

  for (let i = 1; i < selected.length; i++) {
    const cur = selected[i];
    // contiguous if adjacent in the available-years ordering
    if (indexOf.get(cur)! === indexOf.get(prev)! + 1) {
      prev = cur;
      continue;
    }
    flush(start, prev);
    start = prev = cur;
  }
  flush(start, prev);

  return parts.join(', ');
};

export interface TypeBreakdownRow {
  label: string;
  correct: number;
  total: number;
}

// Underlying question types are grouped on the setup screen (e.g. "Contest winners"
// bundles winner/televote/jury), so the breakdown aggregates by those same groups.
const GROUP_BY_TYPE = new Map(
  QUESTION_GROUP_META.flatMap((g) => g.types.map((t) => [t, g.id] as const))
);

/** Correct/total split per setup question group, ordered by the canonical group list. */
export const typeBreakdown = (result: QuizResult): TypeBreakdownRow[] => {
  const answerByQuestion = new Map(result.answers.map((a) => [a.questionId, a]));
  const stats = new Map<string, { correct: number; total: number }>();

  for (const q of result.questions) {
    const groupId = GROUP_BY_TYPE.get(q.type);
    if (!groupId) continue;
    const entry = stats.get(groupId) || { correct: 0, total: 0 };
    entry.total += 1;
    if (answerByQuestion.get(q.id)?.correct) entry.correct += 1;
    stats.set(groupId, entry);
  }

  return QUESTION_GROUP_META.filter((g) => stats.has(g.id)).map((g) => ({
    label: g.label,
    ...stats.get(g.id)!,
  }));
};

/** A celebratory headline based on the percentage score. */
export const scoreMessage = (pct: number): string => {
  if (pct >= 100) return 'Douze points! Perfect score!';
  if (pct >= 90) return 'Eurovision legend!';
  if (pct >= 75) return 'Grand finalist!';
  if (pct >= 25) return 'Semi-final qualifier';
  return 'Nul points... try again!';
};
