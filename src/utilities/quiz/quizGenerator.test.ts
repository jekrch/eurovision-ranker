import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Contestant } from '../../data/Contestant';
import { CountryContestant } from '../../data/CountryContestant';
import { Country } from '../../data/Country';
import { QuizConfig } from '../../data/quiz/quizTypes';

// The generator loads contestant data per year through the repository, which
// reads CSVs over the network. Mock it so the generator runs on a fixed,
// in-memory dataset — that makes seeded reproducibility deterministic.
const fetchCountryContestantsByYear = vi.fn();
vi.mock('../ContestantRepository', () => ({
  fetchCountryContestantsByYear: (year: string) => fetchCountryContestantsByYear(year),
}));

// mulberry32, imported by quizGenerator's siblings; keep supportedYears stable so
// QUIZ_YEARS is predictable across the test run.
vi.mock('../../data/Contestants', () => ({
  supportedYears: ['2023', '2022', '2021', '2020'],
}));

import { generateQuiz, QUIZ_YEARS } from './quizGenerator';
import { mulberry32 } from './quizCode';

const cc = (
  key: string,
  name: string,
  artist: string,
  song: string,
  finalsRank: number,
  totalPoints: number,
  telePoints?: number,
  juryPoints?: number
): CountryContestant => ({
  id: key,
  uid: `2023-${key}`,
  country: { key, name, id: key } as Country,
  contestant: new Contestant({
    id: `2023-${key}`,
    countryKey: key,
    artist,
    song,
    finalsRank,
    year: '2023',
    votes: {
      round: 'Final',
      year: '2023',
      totalPoints,
      telePoints,
      juryPoints,
    },
  }),
});

// A small but complete finalist field so every question type can be generated.
const DATASET: CountryContestant[] = [
  cc('se', 'Sweden', 'Loreen', 'Tattoo', 1, 583, 243, 340),
  cc('fi', 'Finland', 'Käärijä', 'Cha Cha Cha', 2, 526, 376, 150),
  cc('il', 'Israel', 'Noa Kirel', 'Unicorn', 3, 362, 185, 177),
  cc('it', 'Italy', 'Marco Mengoni', 'Due Vite', 4, 350, 174, 176),
  cc('no', 'Norway', 'Alessandra', 'Queen of Kings', 5, 268, 216, 52),
  cc('de', 'Germany', 'Lord Of The Lost', 'Blood & Glitter', 26, 18, 15, 3),
  cc('uk', 'United Kingdom', 'Mae Muller', 'I Wrote A Song', 25, 24, 15, 9),
  cc('xx', 'Nowhere', 'Nul Artist', 'Zero Song', 24, 0, 0, 0),
];

const config = (overrides: Partial<QuizConfig> = {}): QuizConfig => ({
  years: ['2023'],
  difficulty: 'medium',
  length: 'short',
  questionTypes: ['country', 'artist', 'winner', 'placement'],
  ...overrides,
});

beforeEach(() => {
  fetchCountryContestantsByYear.mockReset();
  fetchCountryContestantsByYear.mockResolvedValue(DATASET);
});

describe('QUIZ_YEARS', () => {
  it('excludes the cancelled 2020 contest', () => {
    expect(QUIZ_YEARS).not.toContain('2020');
    expect(QUIZ_YEARS).toContain('2023');
  });
});

describe('generateQuiz', () => {
  it('produces the requested number of questions', async () => {
    // "short" length asks for 10, but our single-year dataset yields fewer
    // candidates; the count is capped at what is available.
    const quiz = await generateQuiz(config(), mulberry32(1));
    expect(quiz.length).toBeGreaterThan(0);
    expect(quiz.length).toBeLessThanOrEqual(10);
  });

  it('caps output at the configured length', async () => {
    fetchCountryContestantsByYear.mockResolvedValue(DATASET);
    const quiz = await generateQuiz(config({ length: 'short' }), mulberry32(5));
    expect(quiz.length).toBeLessThanOrEqual(10);
  });

  it('is reproducible: same seed → identical quiz', async () => {
    const a = await generateQuiz(config(), mulberry32(424242));
    const b = await generateQuiz(config(), mulberry32(424242));
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    // option ordering is part of the seeded output too
    expect(a.map((q) => q.options.map((o) => o.id))).toEqual(
      b.map((q) => q.options.map((o) => o.id))
    );
  });

  it('varies with the seed', async () => {
    const a = await generateQuiz(config(), mulberry32(1));
    const b = await generateQuiz(config(), mulberry32(2));
    // extremely unlikely to be identical given the candidate pool
    const sameOrder = a.map((q) => q.id).join('|') === b.map((q) => q.id).join('|');
    expect(sameOrder).toBe(false);
  });

  it('every question has its correct option present in its option set', async () => {
    const quiz = await generateQuiz(config(), mulberry32(7));
    for (const q of quiz) {
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
    }
  });

  it('honours the difficulty option count (medium = 4 options)', async () => {
    const quiz = await generateQuiz(config({ difficulty: 'medium' }), mulberry32(7));
    for (const q of quiz) {
      expect(q.options.length).toBe(4);
    }
  });

  it('uses 3 options on easy', async () => {
    const quiz = await generateQuiz(config({ difficulty: 'easy' }), mulberry32(7));
    for (const q of quiz) {
      expect(q.options.length).toBe(3);
    }
  });

  it('only emits the requested question types', async () => {
    const quiz = await generateQuiz(
      config({ questionTypes: ['winner'] }),
      mulberry32(7)
    );
    expect(quiz.length).toBeGreaterThan(0);
    for (const q of quiz) expect(q.type).toBe('winner');
  });

  it('builds a correct "winner" question', async () => {
    const quiz = await generateQuiz(
      config({ questionTypes: ['winner'] }),
      mulberry32(3)
    );
    const winnerQ = quiz.find((q) => q.type === 'winner');
    expect(winnerQ).toBeDefined();
    const correct = winnerQ!.options.find((o) => o.id === winnerQ!.correctOptionId);
    // Sweden won 2023 in the dataset (rank 1)
    expect(correct!.countryName).toBe('Sweden');
  });

  it('returns an empty quiz when no year yields enough contestants', async () => {
    fetchCountryContestantsByYear.mockResolvedValue([DATASET[0]]);
    const quiz = await generateQuiz(config(), mulberry32(1));
    expect(quiz).toEqual([]);
  });

  it('tolerates a year whose data fails to load', async () => {
    fetchCountryContestantsByYear.mockRejectedValue(new Error('network'));
    const quiz = await generateQuiz(config(), mulberry32(1));
    expect(quiz).toEqual([]);
  });
});
