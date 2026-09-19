import Papa from 'papaparse';

/** Shape of a row parsed from the votes CSV (all cells are strings). */
/** Minimal structural view of a PapaParse result (only `data` is consumed). */
interface CsvParseResult<T> {
  data: T[];
}

interface VoteCsvRow {
  year: string;
  round: string;
  from_country_id: string;
  to_country_id: string;
  total_points: string;
  tele_points: string;
  jury_points: string;
  [key: string]: string;
}
import { fetchVoteCsv } from './CsvCache';
import { sanitizeYear } from '../data/Contestants';
import { Vote } from '../data/Vote';

const voteCache: { [key: string]: Vote[] } = {};

/** Short round codes as stored in the vote CSV, in display order */
const ROUND_ORDER = ['f', 'sf', 'sf1', 'sf2'];

/**
 * Return vote data for the provided year. If a countryKey is provided,
 * only return the votes from that country on that year, otherwise return
 * votes from all countries. Likewise for 'round' (final or semi-final)
 *
 * @param year
 * @param countryKey
 * @returns
 */
export function fetchVotesForYear(
  year: string,
  countryKey?: string,
  round?: string,
  toCountryKey?: string,
): Promise<Vote[]> {
  year = sanitizeYear(year);
  countryKey = countryKey?.toLowerCase();

  if (round) round = convertRoundToShortName(round);

  let cacheKey = `${year}-${countryKey}-${round}`;

  if (toCountryKey) cacheKey = `${year}-${countryKey}-${round}-${toCountryKey}`;

  if (voteCache[cacheKey]) {
    return Promise.resolve(voteCache[cacheKey]);
  }

  return new Promise((resolve, reject) => {
    fetchVoteCsv(year)
      .then((response) => response)
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: CsvParseResult<VoteCsvRow>) => {
            // Filter and map the data
            const votes = results.data
              .filter(
                (row: VoteCsvRow) =>
                  row.year === year &&
                  (!countryKey?.length || row.from_country_id === countryKey) &&
                  (!round?.length || row.round === round) &&
                  (!toCountryKey?.length || row.to_country_id === toCountryKey),
              )
              .map((row: VoteCsvRow) => ({
                year: row.year,
                round: convertRoundToLongName(row.round),
                fromCountryKey: row.from_country_id,
                toCountryKey: row.to_country_id,
                totalPoints: row.total_points ? parseInt(row.total_points) : 0,
                telePoints: row.tele_points ? parseInt(row.tele_points) : 0,
                juryPoints: row.jury_points ? parseInt(row.jury_points) : 0,
              }));

            voteCache[cacheKey] = votes;
            resolve(votes);
          },
          error: (error: Error) => reject(error),
        });
      })
      .catch((error) => reject(error));
  });
}

/**
 * fetches votes for multiple years and countries
 *
 * @param yearCountryPairs - array of objects containing year and country key
 * @param round - optional round filter
 */
export async function fetchVotesForYearsAndCountries(
  yearCountryPairs: Array<{ year: string; countryKey: string }>,
  round?: string,
): Promise<Vote[]> {
  const uniqueYears = new Set(yearCountryPairs.map((pair) => sanitizeYear(pair.year)));
  const uniqueCountries = new Set(yearCountryPairs.map((pair) => pair.countryKey.toLowerCase()));

  if (round) {
    round = convertRoundToShortName(round);
  }

  const cacheKey = `${Array.from(uniqueYears).join(',')}-${Array.from(uniqueCountries).join(',')}-${round}`;

  if (voteCache[cacheKey]) {
    return Promise.resolve(voteCache[cacheKey]);
  }

  return new Promise((resolve, reject) => {
    fetchVoteCsv('')
      .then((response) => response)
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: CsvParseResult<VoteCsvRow>) => {
            const votes = results.data
              .filter(
                (row: VoteCsvRow) =>
                  uniqueYears.has(row.year) &&
                  uniqueCountries.has(row.to_country_id) &&
                  (!round || row.round === round),
              )
              .map((row: VoteCsvRow) => ({
                year: row.year,
                round: convertRoundToLongName(row.round),
                fromCountryKey: row.from_country_id,
                toCountryKey: row.to_country_id,
                totalPoints: row.total_points ? parseInt(row.total_points) : 0,
                telePoints: row.tele_points ? parseInt(row.tele_points) : 0,
                juryPoints: row.jury_points ? parseInt(row.jury_points) : 0,
              }));

            voteCache[cacheKey] = votes;
            resolve(votes);
          },
          error: (error: Error) => reject(error),
        });
      })
      .catch((error) => reject(error));
  });
}

/** What the vote data holds for one round of a contest year. */
export interface VoteRoundSummary {
  /** Long round name, e.g. 'semi-final-1' */
  round: string;
  /** Countries that cast votes in this round */
  fromCountryKeys: string[];
  hasTeleVotes: boolean;
  hasJuryVotes: boolean;
}

const roundSummaryCache: { [year: string]: Promise<VoteRoundSummary[]> } = {};

/**
 * Summarize which rounds (final, semi-finals) have vote data for the provided
 * year, ordered final first, then semi-finals. Done in a single pass over the
 * vote CSV so a year change doesn't parse the file once per round
 *
 * @param year
 * @returns
 */
export function fetchVoteRoundSummariesForYear(year: string): Promise<VoteRoundSummary[]> {
  year = sanitizeYear(year);

  if (!roundSummaryCache[year]) {
    roundSummaryCache[year] = new Promise<VoteRoundSummary[]>((resolve, reject) => {
      fetchVoteCsv(year)
        .then((csvString) => {
          Papa.parse(csvString, {
            header: true,
            complete: (results: CsvParseResult<VoteCsvRow>) => {
              const byRound: {
                [round: string]: { from: Set<string>; tele: boolean; jury: boolean };
              } = {};

              results.data
                .filter((row: VoteCsvRow) => row.year === year && ROUND_ORDER.includes(row.round))
                .forEach((row: VoteCsvRow) => {
                  const summary = (byRound[row.round] ??= {
                    from: new Set<string>(),
                    tele: false,
                    jury: false,
                  });
                  summary.from.add(row.from_country_id);
                  summary.tele ||= parseInt(row.tele_points) > 0;
                  summary.jury ||= parseInt(row.jury_points) > 0;
                });

              resolve(
                ROUND_ORDER.filter((round) => byRound[round]).map((round) => ({
                  round: convertRoundToLongName(round).toLowerCase(),
                  fromCountryKeys: Array.from(byRound[round]!.from),
                  hasTeleVotes: byRound[round]!.tele,
                  hasJuryVotes: byRound[round]!.jury,
                })),
              );
            },
            error: (error: Error) => reject(error),
          });
        })
        .catch((error) => reject(error));
    });

    // don't cache failures, so a later attempt can retry
    roundSummaryCache[year].catch(() => delete roundSummaryCache[year]);
  }

  return roundSummaryCache[year];
}

const convertRoundToLongName = (round: string) => {
  switch (round) {
    case 'f':
      return 'Final';
    case 'sf':
      return 'Semi-Final';
    case 'sf1':
      return 'Semi-Final-1';
    case 'sf2':
      return 'Semi-Final-2';
    default:
      throw new Error(round + ' not supported');
  }
};

const convertRoundToShortName = (fullRound: string) => {
  switch (fullRound?.toLowerCase()) {
    case 'final':
      return 'f';
    case 'semi-final':
      return 'sf';
    case 'semi-final-1':
      return 'sf1';
    case 'semi-final-2':
      return 'sf2';
    default:
      throw new Error(fullRound + ' not supported');
  }
};

export function fetchDistinctFromCountryIdsForYear(year: string): Promise<string[]> {
  year = sanitizeYear(year);

  return new Promise((resolve, reject) => {
    fetch('/votes.csv')
      .then((response) => response.text())
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: CsvParseResult<VoteCsvRow>) => {
            const fromCountryIds = results.data
              .filter((row: VoteCsvRow) => row.year === year)
              .map((row: VoteCsvRow) => row.from_country_id)
              .filter(
                (value: string, index: number, self: string[]) => self.indexOf(value) === index,
              ); // Removing duplicates

            resolve(fromCountryIds);
          },
          error: (error: Error) => reject(error),
        });
      })
      .catch((error) => reject(error));
  });
}
