import { describe, it, expect } from 'vitest';

import { encodeQuizCode, decodeQuizCode, mulberry32, randomSeed } from './quizCode';
import { QUIZ_YEARS } from './quizGenerator';
import { QuizConfig } from '../../data/quiz/quizTypes';

const config = (overrides: Partial<QuizConfig> = {}): QuizConfig => ({
  years: ['2023', '2022'],
  difficulty: 'medium',
  length: 'short',
  questionTypes: ['country', 'artist'],
  ...overrides,
});

describe('quizCode — encode/decode round-trips', () => {
  it('round-trips a representative config + seed exactly', () => {
    const seed = 0x1234abcd;
    const c = config();
    const decoded = decodeQuizCode(encodeQuizCode(c, seed));

    expect(decoded).not.toBeNull();
    expect(decoded!.seed).toBe(seed >>> 0);
    expect(decoded!.config.difficulty).toBe(c.difficulty);
    expect(decoded!.config.length).toBe(c.length);
    // years come back sorted ascending; compare as sets
    expect(new Set(decoded!.config.years)).toEqual(new Set(c.years));
    expect(new Set(decoded!.config.questionTypes)).toEqual(new Set(c.questionTypes));
  });

  it('preserves every difficulty/length combination', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;
    const lengths = ['short', 'medium', 'long'] as const;
    for (const difficulty of difficulties) {
      for (const length of lengths) {
        const c = config({ difficulty, length });
        const decoded = decodeQuizCode(encodeQuizCode(c, 7));
        expect(decoded!.config.difficulty).toBe(difficulty);
        expect(decoded!.config.length).toBe(length);
      }
    }
  });

  it('preserves an arbitrary subset of question types', () => {
    const c = config({ questionTypes: ['winner', 'televote', 'jury', 'zeroPoints'] });
    const decoded = decodeQuizCode(encodeQuizCode(c, 99));
    expect(new Set(decoded!.config.questionTypes)).toEqual(new Set(c.questionTypes));
  });

  it('round-trips the full available year set', () => {
    const c = config({ years: [...QUIZ_YEARS] });
    const decoded = decodeQuizCode(encodeQuizCode(c, 42));
    expect(new Set(decoded!.config.years)).toEqual(new Set(QUIZ_YEARS));
  });

  it('treats an empty year selection as "all years"', () => {
    const c = config({ years: [] });
    const decoded = decodeQuizCode(encodeQuizCode(c, 1));
    // encode substitutes the full set for an empty selection
    expect(new Set(decoded!.config.years)).toEqual(new Set(QUIZ_YEARS));
  });

  it('round-trips a seed of 0 and a max 32-bit seed', () => {
    for (const seed of [0, 0xffffffff]) {
      const decoded = decodeQuizCode(encodeQuizCode(config(), seed));
      expect(decoded!.seed).toBe(seed >>> 0);
    }
  });

  it('produces a lowercase base36 string with no whitespace', () => {
    const code = encodeQuizCode(config(), randomSeed());
    expect(code).toMatch(/^[0-9a-z]+$/);
  });
});

describe('quizCode — rejection of malformed codes', () => {
  it('returns null for an empty string', () => {
    expect(decodeQuizCode('')).toBeNull();
  });

  it('returns null for non-base36 garbage', () => {
    expect(decodeQuizCode('!!!not-a-code!!!')).toBeNull();
  });

  it('returns null when the version nibble does not match', () => {
    // version is the low 4 bits; '5' decodes to a non-1 version → reject
    expect(decodeQuizCode('5')).toBeNull();
  });
});

describe('mulberry32 — deterministic PRNG', () => {
  it('produces the identical sequence for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it('emits floats within [0, 1)', () => {
    const rng = mulberry32(randomSeed());
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
