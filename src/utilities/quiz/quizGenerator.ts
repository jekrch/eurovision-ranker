import { CountryContestant } from '../../data/CountryContestant';
import { fetchCountryContestantsByYear } from '../ContestantRepository';
import { supportedYears } from '../../data/Contestants';
import {
  DIFFICULTY_META,
  LENGTH_META,
  QuizConfig,
  QuizDifficulty,
  QuizOption,
  QuizQuestion,
  QuizQuestionType,
} from '../../data/quiz/quizTypes';

/**
 * Years selectable in the quiz: real contests with results (no 2020 cancellation).
 * The current contest (defaultYear) is included — its contestants live in
 * mainCurrent.csv and its votes in votesCurrent.csv. mainCurrent.csv carries no
 * finals placement, so ranks for it are derived from total points (see
 * withDerivedRanks).
 */
export const QUIZ_YEARS: string[] = supportedYears.filter((y) => y !== '2020');

/** A flattened, parsed view of a contestant for a given year. */
interface Entry {
  countryKey: string;
  countryName: string;
  artist: string;
  song: string;
  youtube?: string;
  rank: number | null;
  total: number | null;
  tele: number | null;
  jury: number | null;
}

const toNum = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const toEntry = (cc: CountryContestant): Entry | null => {
  const c = cc.contestant;
  if (!c || !c.artist || !c.song) return null;
  return {
    countryKey: cc.country.key,
    countryName: cc.country.name,
    artist: c.artist.trim(),
    song: c.song.trim(),
    youtube: c.youtube,
    rank: toNum(c.finalsRank),
    total: toNum(c.votes?.totalPoints),
    tele: toNum(c.votes?.telePoints),
    jury: toNum(c.votes?.juryPoints),
  };
};

/**
 * Fill in finals ranks for a year that has none. The current contest's
 * mainCurrent.csv has no placement column, but votesCurrent.csv supplies total
 * points (populated onto each entry's `total`). When no entry has a rank, derive
 * one by ordering on total points so the result-based question types (winner,
 * placement, zero points, televote, jury) work for the current contestants/votes
 * too. Years that already carry ranks from the CSV are left untouched.
 */
const withDerivedRanks = (entries: Entry[]): Entry[] => {
  if (entries.some((e) => e.rank !== null)) return entries;

  const scored = entries.filter((e) => e.total !== null);
  if (!scored.length) return entries;

  const rankByKey = new Map<string, number>();
  [...scored]
    .sort((a, b) => (b.total as number) - (a.total as number))
    .forEach((e, i) => rankByKey.set(e.countryKey, i + 1));

  return entries.map((e) =>
    rankByKey.has(e.countryKey) ? { ...e, rank: rankByKey.get(e.countryKey)! } : e
  );
};

/**
 * Source of randomness. The default is Math.random (a normal one-off quiz), but
 * callers pass a seeded PRNG so a shareable code reproduces the exact same quiz.
 * Every random decision in this module must flow through the supplied `rng` —
 * not Math.random — or reproducibility breaks.
 */
export type Rng = () => number;

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sample = <T>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const optionFromEntry = (e: Entry, withFlag: boolean, sublabel?: string): QuizOption => ({
  id: `${e.countryKey}-${e.artist}`,
  label: withFlag ? e.countryName : e.artist,
  sublabel,
  countryKey: e.countryKey,
  artist: e.artist,
  song: e.song,
  countryName: e.countryName,
  youtube: e.youtube,
});

/**
 * Build the option set for a question whose answer is a country (winner,
 * placement, zero points, televote, jury). Options show flag + country name.
 */
const buildCountryOptions = (
  answer: Entry,
  pool: Entry[],
  optionCount: number,
  rng: Rng,
  nearBy?: (e: Entry) => number
): QuizOption[] | null => {
  const others = pool.filter((e) => e.countryKey !== answer.countryKey);
  if (others.length < optionCount - 1) return null;

  let distractors: Entry[];
  if (nearBy) {
    const ref = nearBy(answer);
    distractors = [...others]
      .sort((a, b) => Math.abs(nearBy(a) - ref) - Math.abs(nearBy(b) - ref))
      .slice(0, Math.max(optionCount * 2, optionCount + 2));
    distractors = shuffle(distractors, rng).slice(0, optionCount - 1);
  } else {
    distractors = shuffle(others, rng).slice(0, optionCount - 1);
  }

  const opts = [answer, ...distractors].map((e) => optionFromEntry(e, true, e.artist));
  return shuffle(opts, rng);
};

/** Generate every candidate question of a given type for a single year. */
const generateForType = (
  type: QuizQuestionType,
  year: string,
  entries: Entry[],
  optionCount: number,
  near: boolean,
  difficulty: QuizDifficulty,
  rng: Rng
): QuizQuestion[] => {
  const finalists = entries.filter((e) => e.rank !== null && (e.rank as number) > 0);
  const out: QuizQuestion[] = [];

  const make = (
    subject: Entry,
    prompt: string,
    promptHighlight: string | undefined,
    options: QuizOption[] | null,
    correct: Entry,
    explanation: string
  ) => {
    if (!options) return;
    const correctId = `${correct.countryKey}-${correct.artist}`;
    if (!options.some((o) => o.id === correctId)) return;
    out.push({
      id: `${type}-${year}-${subject.countryKey}`,
      type,
      year,
      prompt,
      promptHighlight,
      options,
      correctOptionId: correctId,
      explanation,
    });
  };

  switch (type) {
    case 'country': {
      // ask about any contestant; options are countries
      for (const e of entries) {
        const others = entries.filter((o) => o.countryKey !== e.countryKey);
        if (others.length < optionCount - 1) continue;
        const distractors = shuffle(others, rng).slice(0, optionCount - 1);
        const options = shuffle(
          [e, ...distractors].map((o) => optionFromEntry(o, true)),
          rng
        );
        make(
          e,
          `Which country did ${e.artist} represent in ${year}?`,
          e.artist,
          options,
          e,
          `${e.artist} performed "${e.song}" for ${e.countryName} in ${year}.`
        );
      }
      break;
    }
    case 'artist': {
      for (const e of entries) {
        const others = entries.filter((o) => o.countryKey !== e.countryKey);
        if (others.length < optionCount - 1) continue;
        const distractors = shuffle(others, rng).slice(0, optionCount - 1);
        const options = shuffle(
          [e, ...distractors].map((o) => optionFromEntry(o, false, o.countryName)),
          rng
        );
        make(
          e,
          `Which artist performed "${e.song}" in ${year}?`,
          e.song,
          options,
          e,
          `"${e.song}" was performed by ${e.artist} for ${e.countryName} in ${year}.`
        );
      }
      break;
    }
    case 'winner': {
      const winner = finalists.find((e) => e.rank === 1);
      if (winner) {
        make(
          winner,
          `Which country won Eurovision ${year}?`,
          undefined,
          buildCountryOptions(winner, finalists, optionCount, rng, near ? (e) => e.rank as number : undefined),
          winner,
          `${winner.countryName} won ${year} with "${winner.song}" by ${winner.artist}.`
        );
      }
      break;
    }
    case 'placement': {
      // Hard widens the podium range (2nd–4th) and adds a "finished last" question.
      const places = difficulty === 'hard' ? [2, 3, 4] : [2, 3];
      for (const place of places) {
        const e = finalists.find((f) => f.rank === place);
        if (!e) continue;
        make(
          e,
          `Which country finished ${ordinal(place)} in the ${year} final?`,
          undefined,
          buildCountryOptions(e, finalists, optionCount, rng, near ? (f) => f.rank as number : undefined),
          e,
          `${e.countryName} finished ${ordinal(place)} in ${year} with "${e.song}" by ${e.artist}.`
        );
      }

      if (difficulty === 'hard' && finalists.length) {
        const lastRank = Math.max(...finalists.map((f) => f.rank as number));
        const lastPlace = finalists.filter((f) => f.rank === lastRank);
        if (lastPlace.length === 1) {
          // unambiguous last place
          const e = lastPlace[0];
          make(
            e,
            `Which country finished last in the ${year} final?`,
            undefined,
            buildCountryOptions(e, finalists, optionCount, rng, near ? (f) => f.rank as number : undefined),
            e,
            `${e.countryName} finished last (${ordinal(lastRank)}) in ${year} with "${e.song}" by ${e.artist}.`
          );
        } else {
          // multiple share last place — ask "nul points" instead (the bottom is a tie)
          const zeros = finalists.filter((f) => f.total === 0);
          const nonZero = finalists.filter((f) => f.total !== null && (f.total as number) > 0);
          if (zeros.length && nonZero.length >= optionCount - 1) {
            const e = sample(zeros, rng);
            const distractors = [...nonZero]
              .sort((a, b) => (a.total as number) - (b.total as number))
              .slice(0, optionCount + 1);
            const picked = shuffle(distractors, rng).slice(0, optionCount - 1);
            const options = shuffle([e, ...picked].map((o) => optionFromEntry(o, true, o.artist)), rng);
            make(
              e,
              `Which country scored zero points in the ${year} final?`,
              undefined,
              options,
              e,
              `${e.countryName} ("${e.song}" by ${e.artist}) scored nul points in the ${year} final.`
            );
          }
        }
      }
      break;
    }
    case 'zeroPoints': {
      const zeros = finalists.filter((e) => e.total === 0);
      const nonZero = finalists.filter((e) => e.total !== null && (e.total as number) > 0);
      if (zeros.length && nonZero.length >= optionCount - 1) {
        const e = sample(zeros, rng);
        const distractors = (
          near
            ? [...nonZero].sort((a, b) => (a.total as number) - (b.total as number)).slice(0, optionCount + 1)
            : nonZero
        );
        const picked = shuffle(distractors, rng).slice(0, optionCount - 1);
        const options = shuffle([e, ...picked].map((o) => optionFromEntry(o, true, o.artist)), rng);
        make(
          e,
          `Which country scored zero points in the ${year} final?`,
          undefined,
          options,
          e,
          `${e.countryName} ("${e.song}" by ${e.artist}) scored nul points in the ${year} final.`
        );
      }
      break;
    }
    case 'televote':
    case 'jury': {
      const metric = (e: Entry) => (type === 'televote' ? e.tele : e.jury);
      const scored = finalists.filter((e) => metric(e) !== null);
      if (scored.length >= optionCount) {
        const winner = scored.reduce((a, b) => ((metric(b) as number) > (metric(a) as number) ? b : a));
        // avoid ties for the top metric (ambiguous answers)
        const topCount = scored.filter((e) => metric(e) === metric(winner)).length;
        if (topCount === 1) {
          make(
            winner,
            `Which country won the ${type === 'televote' ? 'televote' : 'jury vote'} in the ${year} final?`,
            undefined,
            buildCountryOptions(winner, scored, optionCount, rng, near ? (e) => metric(e) as number : undefined),
            winner,
            `${winner.countryName} topped the ${type === 'televote' ? 'televote' : 'jury vote'} in ${year} ` +
              `with ${metric(winner)} points ("${winner.song}" by ${winner.artist}).`
          );
        }
      }
      break;
    }
  }

  return out;
};

/**
 * Build a complete quiz from the supplied config. Loads contestant data for the
 * selected years, generates a large candidate pool, then samples a balanced set.
 */
export const generateQuiz = async (
  config: QuizConfig,
  rng: Rng = Math.random
): Promise<QuizQuestion[]> => {
  const { optionCount, nearDistractors } = DIFFICULTY_META[config.difficulty];
  const count = LENGTH_META[config.length].count;

  const years = config.years.length ? config.years : QUIZ_YEARS;

  // load all years in parallel
  const perYearEntries = await Promise.all(
    years.map(async (year) => {
      try {
        const ccs = await fetchCountryContestantsByYear(year);
        const entries = withDerivedRanks(
          ccs.map(toEntry).filter((e): e is Entry => e !== null)
        );
        return { year, entries };
      } catch {
        return { year, entries: [] as Entry[] };
      }
    })
  );

  // candidate questions grouped by type so we can balance across types
  const byType: Record<string, QuizQuestion[]> = {};
  for (const { year, entries } of perYearEntries) {
    if (entries.length < optionCount) continue;
    for (const type of config.questionTypes) {
      const qs = generateForType(type, year, entries, optionCount, nearDistractors, config.difficulty, rng);
      if (qs.length) {
        byType[type] = (byType[type] || []).concat(qs);
      }
    }
  }

  const availableTypes = Object.keys(byType);
  if (availableTypes.length === 0) return [];

  // shuffle each type's pool
  for (const t of availableTypes) byType[t] = shuffle(byType[t], rng);

  // round-robin draw across types for a balanced quiz, avoiding duplicates
  const selected: QuizQuestion[] = [];
  const seen = new Set<string>();
  let exhausted = false;
  while (selected.length < count && !exhausted) {
    exhausted = true;
    for (const t of shuffle(availableTypes, rng)) {
      const pool = byType[t];
      while (pool.length) {
        const q = pool.pop()!;
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        selected.push(q);
        exhausted = false;
        break;
      }
      if (selected.length >= count) break;
    }
  }

  return shuffle(selected, rng).slice(0, count);
};
