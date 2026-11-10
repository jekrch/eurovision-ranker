import { defaultYear as escDefaultYear, supportedYears as escYears } from './Contestants';

/**
 * A ranking belongs to a `(contest, year)` pair. `esc` is the traditional
 * Eurovision Song Contest and the default whenever no contest is given, so
 * URLs and saved rankings that predate the contest dimension resolve as ESC.
 */
export type ContestId = 'esc' | 'asia';

export interface ContestFeatures {
  /** Ranking songs across years (`g=t`, the contestant table). */
  globalMode: boolean;
  quiz: boolean;
  lyrics: boolean;
  /** Vote results, vote display options, and vote-based analysis. */
  votes: boolean;
  /** The Europe-centred rankings map. */
  map: boolean;
}

export interface ContestDef {
  id: ContestId;
  /** Full name, e.g. for the switcher and saved ranking labels. */
  label: string;
  /** Compact name for tight spots like the header and exported images. */
  shortLabel: string;
  /** Newest first; drives the year dropdown. */
  years: string[];
  defaultYear: string;
  /**
   * Contestant files to load for a year, concatenated in order. An empty year
   * asks for every year of the contest.
   */
  contestantFiles: (year: string) => string[];
  /** Vote file for a year, or null when the contest has no vote data. */
  voteFile: (year: string) => string | null;
  lyricsFile: string | null;
  features: ContestFeatures;
}

export const DEFAULT_CONTEST: ContestId = 'esc';

export const contests: Record<ContestId, ContestDef> = {
  esc: {
    id: 'esc',
    label: 'Eurovision',
    shortLabel: 'ESC',
    years: escYears,
    defaultYear: escDefaultYear,
    // The current year lives on its own so the common case stays small; any
    // other year (or all years) needs the archive plus the current file.
    contestantFiles: (year) =>
      year === escDefaultYear ? ['mainCurrent.csv'] : ['main.csv', 'mainCurrent.csv'],
    voteFile: (year) => (year === escDefaultYear ? 'votesCurrent.csv' : 'votes.csv'),
    lyricsFile: 'lyrics.csv',
    features: { globalMode: true, quiz: true, lyrics: true, votes: true, map: true },
  },
  asia: {
    id: 'asia',
    label: 'Eurovision Asia',
    shortLabel: 'Asia',
    years: ['2026'],
    defaultYear: '2026',
    contestantFiles: () => ['asia.csv'],
    // No results yet. Once they exist, add votesAsia.csv, point this at it,
    // and turn on the votes feature.
    voteFile: () => null,
    lyricsFile: 'lyricsAsia.csv',
    features: { globalMode: false, quiz: false, lyrics: true, votes: false, map: false },
  },
};

export const contestIds = Object.keys(contests) as ContestId[];

export function isContestId(value: unknown): value is ContestId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(contests, value);
}

/** Resolve a raw contest value (URL param, saved field) to a known contest. */
export function sanitizeContest(raw: string | null | undefined): ContestId {
  const value = raw?.trim().toLowerCase();
  return isContestId(value) ? value : DEFAULT_CONTEST;
}

/**
 * How a contest year is shown to people: just the year for the traditional
 * contest, as it always has been, and the contest's short name plus the year
 * for any other.
 */
export function formatContestYear(contest: ContestId, year: string | number): string {
  const yearStr = String(year);
  if (contest === DEFAULT_CONTEST) return yearStr;
  return `${contests[contest].shortLabel} ${yearStr}`.trim();
}

/**
 * Normalize a contest year: two-digit years expand to four, and anything that
 * isn't a year of the contest falls back to the contest's default year.
 */
export function sanitizeYear(
  contestYear: string | null | undefined,
  contest: ContestId = DEFAULT_CONTEST,
): string {
  const def = contests[contest] ?? contests[DEFAULT_CONTEST];

  let year: string | undefined;
  if (contestYear?.length === 2) {
    year = (parseInt(contestYear) < 40 ? '20' : '19') + contestYear;
  } else if (contestYear?.length === 4) {
    year = contestYear;
  }

  if (!year) return def.defaultYear;

  // ESC has always accepted any four-digit year, so only the newer contests
  // are held to their own year list.
  if (contest !== 'esc' && !def.years.includes(year)) return def.defaultYear;

  return year;
}

export interface ContestYearOption {
  contest: ContestId;
  year: string;
  /** What the year picker shows, from {@link formatContestYear}. */
  label: string;
}

/**
 * Every (contest, year) a ranking can be on, as one list for the year picker.
 * Newest year first, and within a year the traditional contest comes before
 * the others, so a newer contest sits right under the matching ESC year.
 */
export function contestYearOptions(): ContestYearOption[] {
  const options = contestIds.flatMap((contest) =>
    contests[contest].years.map((year) => ({
      contest,
      year,
      label: formatContestYear(contest, year),
    })),
  );

  return options.sort(
    (a, b) =>
      Number(b.year) - Number(a.year) ||
      contestIds.indexOf(a.contest) - contestIds.indexOf(b.contest),
  );
}
