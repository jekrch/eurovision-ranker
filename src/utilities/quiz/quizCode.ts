/**
 * Shareable quiz codes.
 *
 * A code is a compact, self-contained string that encodes everything needed to
 * reproduce a quiz: the full config (years, difficulty, question types, length)
 * plus a random seed. Two people who enter the same code get the identical set
 * of questions and the identical option sets — the only thing that still varies
 * per player is the on-screen order of the options (shuffled at play time).
 *
 * Reproducibility relies on the generator drawing all of its randomness from a
 * seeded PRNG (mulberry32) rather than Math.random. See quizGenerator.ts.
 *
 * Caveat: a code reproduces a quiz only against the contestant data it was made
 * from. If the underlying CSVs change, an old code may yield a different quiz.
 * VERSION is bumped if the code format itself changes (older codes then reject).
 */
import { QuizConfig, QuizDifficulty, QuizLength, QuizQuestionType } from '../../data/quiz/quizTypes';
import { QUIZ_YEARS } from './quizGenerator';

/** Code format version. Bump on any breaking layout change. */
const VERSION = 1n;

/** Earliest contest year a code can represent; years pack as (year - base). */
const YEAR_BASE = 1956;

// Fixed orderings — these MUST stay stable, the bit positions depend on them.
const DIFFICULTY_ORDER: QuizDifficulty[] = ['easy', 'medium', 'hard'];
const LENGTH_ORDER: QuizLength[] = ['short', 'medium', 'long'];
const TYPE_ORDER: QuizQuestionType[] = [
  'country',
  'artist',
  'winner',
  'placement',
  'televote',
  'jury',
  'zeroPoints',
];

/** A fresh, uniformly random 32-bit seed. */
export const randomSeed = (): number => Math.floor(Math.random() * 0x1_0000_0000);

/**
 * mulberry32: a tiny, fast, deterministic PRNG. Given the same 32-bit seed it
 * always yields the same sequence of floats in [0, 1), which is what lets a code
 * reproduce a quiz exactly.
 */
export const mulberry32 = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  };
};

const fromBase36 = (s: string): bigint => {
  let r = 0n;
  for (const ch of s.toLowerCase()) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || ch === ' ') throw new Error('bad char');
    r = r * 36n + BigInt(d);
  }
  return r;
};

/** Pack the config + seed into a short, URL-safe base36 code. */
export const encodeQuizCode = (config: QuizConfig, seed: number): string => {
  const years = config.years.length ? config.years : QUIZ_YEARS;

  let bits = 0n;
  let pos = 0n;
  const push = (value: bigint, width: bigint) => {
    bits |= (value & ((1n << width) - 1n)) << pos;
    pos += width;
  };

  push(VERSION, 4n);
  push(BigInt(seed >>> 0), 32n);

  const diffIdx = Math.max(0, DIFFICULTY_ORDER.indexOf(config.difficulty));
  push(BigInt(diffIdx), 2n);

  const lenIdx = Math.max(0, LENGTH_ORDER.indexOf(config.length));
  push(BigInt(lenIdx), 2n);

  let typesMask = 0n;
  TYPE_ORDER.forEach((t, i) => {
    if (config.questionTypes.includes(t)) typesMask |= 1n << BigInt(i);
  });
  push(typesMask, BigInt(TYPE_ORDER.length));

  let yearsMask = 0n;
  for (const y of years) {
    const off = parseInt(y, 10) - YEAR_BASE;
    if (off >= 0) yearsMask |= 1n << BigInt(off);
  }
  // years occupy all remaining high bits — no fixed width needed
  bits |= yearsMask << pos;

  return bits.toString(36);
};

/** Reverse of encodeQuizCode. Returns null for malformed/unsupported codes. */
export const decodeQuizCode = (
  code: string
): { config: QuizConfig; seed: number } | null => {
  try {
    let bits = fromBase36(code.trim());
    const take = (width: bigint): bigint => {
      const v = bits & ((1n << width) - 1n);
      bits >>= width;
      return v;
    };

    if (take(4n) !== VERSION) return null;

    const seed = Number(take(32n));
    const diffIdx = Number(take(2n));
    const lenIdx = Number(take(2n));
    const typesMask = take(BigInt(TYPE_ORDER.length));
    const yearsMask = bits; // remaining high bits

    if (diffIdx >= DIFFICULTY_ORDER.length || lenIdx >= LENGTH_ORDER.length) return null;

    const questionTypes = TYPE_ORDER.filter((_, i) => (typesMask >> BigInt(i)) & 1n);
    if (questionTypes.length === 0) return null;

    const years: string[] = [];
    let mask = yearsMask;
    let off = 0;
    while (mask > 0n) {
      if (mask & 1n) {
        const year = String(YEAR_BASE + off);
        if (QUIZ_YEARS.includes(year)) years.push(year);
      }
      mask >>= 1n;
      off++;
    }
    if (years.length === 0) return null;

    return {
      seed,
      config: {
        years,
        difficulty: DIFFICULTY_ORDER[diffIdx],
        length: LENGTH_ORDER[lenIdx],
        questionTypes,
      },
    };
  } catch {
    return null;
  }
};
