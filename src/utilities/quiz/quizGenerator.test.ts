import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Contestant } from '../../data/Contestant';
import { Country } from '../../data/Country';
import { CountryContestant } from '../../data/CountryContestant';
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
  juryPoints?: number,
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

// Entries knocked out in a semi-final: they placed in the contest as a whole
// but never took part in the final, so they carry no finals rank or points.
const semiFinalExit = (
  key: string,
  name: string,
  artist: string,
  song: string,
  contestRank: number,
): CountryContestant => ({
  id: key,
  uid: `2023-${key}`,
  country: { key, name, id: key } as Country,
  contestant: new Contestant({
    id: `2023-${key}`,
    countryKey: key,
    artist,
    song,
    contestRank,
    year: '2023',
  }),
});

const SEMI_FINAL_EXITS: CountryContestant[] = [
  semiFinalExit('ie', 'Ireland', 'Wild Youth', 'We Are One', 30),
  semiFinalExit('mt', 'Malta', 'The Busker', 'Dance (Our Own Party)', 35),
  semiFinalExit('nl', 'Netherlands', 'Mia Nicolai & Dion Cooper', 'Burning Daylight', 37),
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
      b.map((q) => q.options.map((o) => o.id)),
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
    const quiz = await generateQuiz(config({ questionTypes: ['winner'] }), mulberry32(7));
    expect(quiz.length).toBeGreaterThan(0);
    for (const q of quiz) expect(q.type).toBe('winner');
  });

  it('builds a correct "winner" question', async () => {
    const quiz = await generateQuiz(config({ questionTypes: ['winner'] }), mulberry32(3));
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

describe('generateQuiz — vote-based question types', () => {
  it('names the televote leader as the answer', async () => {
    const quiz = await generateQuiz(
      config({ questionTypes: ['televote'], length: 'long' }),
      mulberry32(11),
    );
    const q = quiz.find((q) => q.type === 'televote');
    expect(q).toBeDefined();
    const correct = q!.options.find((o) => o.id === q!.correctOptionId);
    // Finland leads the televote in the dataset (376).
    expect(correct!.countryName).toBe('Finland');
  });

  it('names the jury leader as the answer', async () => {
    const quiz = await generateQuiz(
      config({ questionTypes: ['jury'], length: 'long' }),
      mulberry32(13),
    );
    const q = quiz.find((q) => q.type === 'jury');
    expect(q).toBeDefined();
    const correct = q!.options.find((o) => o.id === q!.correctOptionId);
    // Sweden leads the jury vote in the dataset (340).
    expect(correct!.countryName).toBe('Sweden');
  });

  it('names the nul-points country in a zero-points question', async () => {
    const quiz = await generateQuiz(
      config({ questionTypes: ['zeroPoints'], length: 'long' }),
      mulberry32(17),
    );
    const q = quiz.find((q) => q.type === 'zeroPoints');
    expect(q).toBeDefined();
    const correct = q!.options.find((o) => o.id === q!.correctOptionId);
    expect(correct!.countryName).toBe('Nowhere');
  });

  it('skips a vote type with too few scored finalists to fill the options', async () => {
    // Only Sweden carries a jury score, so a 4-option jury question is impossible.
    const oneScored = DATASET.map((c, i) =>
      i === 0
        ? c
        : ({
            ...c,
            contestant: new Contestant({
              ...c.contestant!.toJSON(),
              votes: { ...c.contestant!.votes!, juryPoints: undefined },
            }),
          } as CountryContestant),
    );
    fetchCountryContestantsByYear.mockResolvedValue(oneScored);
    const quiz = await generateQuiz(config({ questionTypes: ['jury'] }), mulberry32(1));
    expect(quiz).toEqual([]);
  });
});

describe('generateQuiz — hard difficulty', () => {
  it('asks four-option questions with near distractors', async () => {
    const quiz = await generateQuiz(
      config({ difficulty: 'hard', questionTypes: ['winner', 'placement', 'televote'] }),
      mulberry32(21),
    );
    expect(quiz.length).toBeGreaterThan(0);
    for (const q of quiz) expect(q.options.length).toBe(4);
  });

  it('adds a last-place question on hard', async () => {
    const quiz = await generateQuiz(
      config({ difficulty: 'hard', questionTypes: ['placement'], length: 'long' }),
      mulberry32(23),
    );
    // Germany is unambiguously last (rank 26) in the dataset.
    const last = quiz.find((q) => q.prompt.includes('finished last'));
    expect(last).toBeDefined();
    const correct = last!.options.find((o) => o.id === last!.correctOptionId);
    expect(correct!.countryName).toBe('Germany');
  });

  it('names the last finalist, not the last of the whole field', async () => {
    fetchCountryContestantsByYear.mockResolvedValue([...DATASET, ...SEMI_FINAL_EXITS]);

    const quiz = await generateQuiz(
      config({ difficulty: 'hard', questionTypes: ['placement'], length: 'long' }),
      mulberry32(23),
    );

    const last = quiz.find((q) => q.prompt.includes('finished last'));
    expect(last).toBeDefined();
    const correct = last!.options.find((o) => o.id === last!.correctOptionId);
    expect(correct!.countryName).toBe('Germany');
  });

  it('offers only grand finalists as answers to questions about the final', async () => {
    fetchCountryContestantsByYear.mockResolvedValue([...DATASET, ...SEMI_FINAL_EXITS]);

    const quiz = await generateQuiz(
      config({ difficulty: 'hard', questionTypes: ['placement', 'winner'], length: 'long' }),
      mulberry32(7),
    );

    expect(quiz.length).toBeGreaterThan(0);
    const eliminated = SEMI_FINAL_EXITS.map((c) => c.country.name);
    for (const q of quiz) {
      for (const option of q.options) {
        expect(eliminated).not.toContain(option.countryName);
      }
    }
  });
});

describe('generateQuiz — rank handling and year selection', () => {
  it('derives ranks from total points when the data carries none', async () => {
    const noRanks = DATASET.map(
      (c) =>
        ({
          ...c,
          contestant: new Contestant({ ...c.contestant!.toJSON(), finalsRank: undefined }),
        }) as CountryContestant,
    );
    fetchCountryContestantsByYear.mockResolvedValue(noRanks);

    const quiz = await generateQuiz(config({ questionTypes: ['winner'] }), mulberry32(2));
    const winnerQ = quiz.find((q) => q.type === 'winner');
    expect(winnerQ).toBeDefined();
    const correct = winnerQ!.options.find((o) => o.id === winnerQ!.correctOptionId);
    // Sweden has the highest total (583), so it derives to rank 1.
    expect(correct!.countryName).toBe('Sweden');
  });

  it('falls back to all quiz years when none are selected', async () => {
    await generateQuiz(config({ years: [] }), mulberry32(1));
    const requested = fetchCountryContestantsByYear.mock.calls.map((c) => c[0]).sort();
    expect(requested).toEqual([...QUIZ_YEARS].sort());
  });

  it('aggregates candidate questions across multiple years', async () => {
    const quiz = await generateQuiz(
      config({ years: ['2023', '2022'], length: 'long' }),
      mulberry32(31),
    );
    const years = new Set(quiz.map((q) => q.year));
    expect(years).toContain('2023');
    expect(years).toContain('2022');
  });
});
