import Papa from 'papaparse';

import { fetchContestantCsv, fetchLyricsCsv } from './CsvCache';
import { logger } from './logger';
import { getUrlParam } from './UrlUtil';
import { assignVotesByContestants } from './VoteProcessor';
import { Contestant, ContestantData } from '../data/Contestant';
import { sanitizeYear } from '../data/Contestants';
import { countries } from '../data/Countries';
import { CountryContestant } from '../data/CountryContestant';
import { SongDetails } from '../data/SongDetails';

/** Shape of a row parsed from the contestants CSV (all cells are strings). */
/** Minimal structural view of a PapaParse result (only `data` is consumed). */
interface CsvParseResult<T> {
  data: T[];
}

interface ContestantCsvRow {
  id: string;
  year: string;
  to_country_id: string;
  performer: string;
  song: string;
  youtube_url: string;
  place_contest: string;
  place_final: string;
  place_sf: string;
  points_final: string;
  points_tele_final: string;
  points_jury_final: string;
  yearCountry?: string;
  [key: string]: string | undefined;
}

/** CSV cells are strings; parse a numeric column into a number (or undefined when blank/NaN). */
function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function fetchCountryContestantsByYear(
  year: string,
  voteCode: string = '',
): Promise<CountryContestant[]> {
  // // if we're requesting the cached year and there's no source country in
  // // the vote code, return an already parsed json array (for performance)
  // if (
  //   sanitizeYear(year) === cachedYear &&
  //   !voteCodeHasSourceCountry(voteCode)
  // ) {
  //   return clone(initialCountryContestantCache);
  // }

  return await fetchAndProcessCountryContestants(year, voteCode);
}

export async function fetchAndProcessCountryContestants(year: string, voteCode: string) {
  const contestants: Contestant[] = await getContestantsByYear(year);

  return await mapContestantsWithVotes(contestants, voteCode);
}

async function mapContestantsWithVotes(contestants: Contestant[], voteCode?: string) {
  const countryContestants: CountryContestant[] = contestants
    .map((contestant) => {
      // special handling for 1956 where two contestants were sent for each participating nation
      const secondaryContestant =
        sanitizeYear(contestant.year!) === '1956' && contestant.countryKey.endsWith('2');

      let contestantCountryKey = contestant.countryKey;

      if (secondaryContestant) {
        // I appended '2' to the end of each secondary contestant's country key (e.g. fr and fr2)
        contestantCountryKey = contestantCountryKey.slice(0, -2);
      }

      const country = fetchCountryByKey(contestantCountryKey, contestant);

      if (!country) {
        throw new Error(
          `No matching country found for contestant with countryKey: ${contestant.countryKey}`,
        );
      }

      if (secondaryContestant) {
        // if this is a secondary contestant reflect this in the country name
        // to better distinguish them
        const countryB = { ...country };
        countryB.name += ' (2)';
        return {
          id: '_' + country.id,
          uid: contestant?.id,
          country: countryB,
          contestant: contestant,
        };
      } else {
        return {
          id: country.id,
          uid: contestant?.id,
          country: country,
          contestant: contestant,
        };
      }
    })
    .sort((a, b) => a.country.name.localeCompare(b.country.name));

  // add votes if requested
  // countryContestants = await assignVotesByCode(
  //   countryContestants, voteCode ?? ''
  // );

  const newCountryContestants = await assignVotesByContestants(countryContestants, voteCode ?? '');

  return newCountryContestants;
}

function fetchCountryByKey(contestantCountryKey: string, contestant: Contestant) {
  let country = countries.find((country) => country.key === contestantCountryKey);

  // some countries in the dataset have their name used as their two character
  // country code. if we couldn't find the country using the code, try using
  // the name, and fix the field assignment
  if (!country) {
    // consolidate cz on Czechia
    if (contestant.countryKey?.toLowerCase() === 'czech republic') {
      contestant.countryKey = 'Czechia';
    }

    country = countries.find((country) => country.name === contestant.countryKey);

    if (country) {
      contestant.countryKey = country.key;
    }
  }

  return country;
}

async function getContestantsByYear(year: string): Promise<Contestant[]> {
  year = sanitizeYear(year);
  return await getContestantsForYear(year);
}

// shared cache for contestants
const contestantCache: { [year: string]: Contestant[] } = {};
const individualContestantCache: { [id: string]: Contestant } = {};

/**
 * parses CSV data and processes contestants
 *
 * @param results - parsed CSV data
 * @param filterFn - function to filter relevant rows
 * @returns processed contestants
 */
function processContestants(
  results: CsvParseResult<ContestantCsvRow>,
  filterFn: (row: ContestantCsvRow) => boolean,
): Contestant[] {
  const tempStorage = new Map<string, Contestant>();

  results.data.filter(filterFn).forEach((row: ContestantCsvRow) => {
    const year = row.year;
    const countryKey = row.to_country_id;
    const id = `${year}-${countryKey}`;
    row.yearCountry = id;
    if (!tempStorage.has(id)) {
      // create a new entry
      tempStorage.set(id, createContestant(row));
    } else {
      handleDuplicateEntry(tempStorage, id, row);
    }
  });

  return Array.from(tempStorage.values());
}

/**
 * creates a contestant object from a row of data
 *
 * @param row - CSV row data
 * @returns contestant object
 */
function createContestant(row: ContestantCsvRow): Contestant {
  const contestantData: ContestantData = {
    id: row.id,
    countryKey: row.to_country_id,
    artist: row.performer,
    song: row.song,
    youtube: row.youtube_url,
    finalsRank: parseOptionalInt(row.place_contest?.length ? row.place_contest : row.place_final),
    semiFinalsRank: parseOptionalInt(row.place_sf),
    year: row.year,
    votes: {
      round: 'Final',
      year: row.year,
      totalPoints: parseOptionalInt(row.points_final),
      telePoints: parseOptionalInt(row.points_tele_final),
      juryPoints: parseOptionalInt(row.points_jury_final),
    },
  };

  return new Contestant(contestantData);
}

/**
 * handles duplicate entries in the data
 *
 * @param tempStorage - map of processed contestants
 * @param id - contestant ID
 * @param row - CSV row data
 */
function handleDuplicateEntry(
  tempStorage: Map<string, Contestant>,
  id: string,
  row: ContestantCsvRow,
): void {
  const [year, countryKey] = id.split('-');
  if (year !== '1956') {
    logger.debug('dupe found ' + year + ' ' + countryKey);
    // update the existing entry
    const existingEntry = tempStorage.get(id)!;
    if (row.place_contest) {
      existingEntry.finalsRank = parseOptionalInt(row.place_contest);
    }
    if (row.place_sf) {
      existingEntry.semiFinalsRank = parseOptionalInt(row.place_sf);
    }
  } else {
    // since 1956 had two songs per country, allow country dupes here
    // tempStorage.set(`${id}-2`, {
    //   ...createContestant(row),
    //   countryKey: `${countryKey}-2`,
    // });
    const contestant = createContestant(row);
    contestant.countryKey = `${countryKey}-2`;
    tempStorage.set(`${id}-2`, contestant);
  }
}

/**
 * fetches and parses contestant CSV data
 *
 * @returns promise resolving to parsed CSV data
 */
function fetchAndParseCsv(year: string = ''): Promise<CsvParseResult<ContestantCsvRow>> {
  return new Promise((resolve, reject) => {
    fetchContestantCsv(year)
      .then((response) => response)
      .then((csvString) => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: CsvParseResult<ContestantCsvRow>) => resolve(results),
          error: (error: Error) => reject(error),
        });
      })
      .catch((error) => reject(error));
  });
}

/**
 * returns all contestants for the provided year
 * caches each result set by year
 *
 * @param year
 * @returns promise resolving to an array of contestants
 */
export function getContestantsForYear(year: string): Promise<Contestant[]> {
  if (contestantCache[year]) {
    return Promise.resolve(contestantCache[year]);
  }

  return fetchAndParseCsv(year).then((results) => {
    const contestants = processContestants(results, (row) => row.year === year);
    contestantCache[year] = contestants;
    return contestants;
  });
}

/**
 * return country contestants by their global ids and in the order of ids
 *
 * @param uids
 * @param voteType
 * @returns
 */
export async function getCountryContestantsByUids(
  uids: string[],
  voteType: string = getUrlParam('v') ?? '',
): Promise<CountryContestant[]> {
  const contestants = await getContestantsByUids(uids);
  const countryContestants: CountryContestant[] = await mapContestantsWithVotes(
    contestants,
    voteType,
  );

  // create a map for quick lookup
  const contestantMap = new Map(countryContestants.map((cc) => [cc.uid, cc]));

  // create a new array with the correct order
  const orderedCountryContestants = uids
    .map((id) => {
      const contestant = contestantMap.get(id);
      if (!contestant) {
        logger.error(`No contestant found for id: ${id}`);
      }
      return contestant;
    })
    .filter((cc): cc is CountryContestant => cc !== undefined);

  return orderedCountryContestants;
}

/**
 * fetches contestants by a list of ID strings
 * utilizes and updates an individual contestant cache
 *
 * @param ids - array of contestant IDs (format: 'year-countryKey')
 * @returns promise resolving to an array of contestants
 */
export function getContestantsByUids(ids: string[]): Promise<Contestant[]> {
  const cachedContestants: Contestant[] = [];
  const idsToFetch: string[] = [];

  ids.forEach((id) => {
    if (id in individualContestantCache) {
      cachedContestants.push(individualContestantCache[id]);
    } else {
      idsToFetch.push(id);
    }
  });

  if (idsToFetch.length === 0) {
    return Promise.resolve(cachedContestants);
  }

  return fetchAndParseCsv().then((results) => {
    const fetchedContestants = processContestants(results, (row) => {
      return idsToFetch.includes(row.id);
    });

    fetchedContestants.forEach((contestant) => {
      individualContestantCache[`${contestant.year}-${contestant.countryKey}`] = contestant;
    });

    return [...cachedContestants, ...fetchedContestants];
  });
}

/**
 * get all contestants for a specific country
 * @param country
 * @returns
 */
export function getContestantsByCountry(country: string): Promise<Contestant[]> {
  if (!country?.length) {
    return Promise.resolve([]);
  }

  return fetchAndParseCsv().then((results) => {
    const fetchedContestants = processContestants(results, (row) => {
      return row.to_country?.toLowerCase() === country?.toLowerCase();
    });

    return fetchedContestants;
  });
}

export function getSongDetails(uid: string, year: string = ''): Promise<SongDetails | undefined> {
  return new Promise((resolve, reject) => {
    const fetchMain = (csvYear: string): Promise<CsvParseResult<ContestantCsvRow>> =>
      fetchContestantCsv(csvYear).then(
        (csvString) =>
          new Promise((res, rej) =>
            Papa.parse(csvString, {
              header: true,
              complete: (results: CsvParseResult<ContestantCsvRow>) => res(results),
              error: (error: Error) => rej(error),
            }),
          ),
      );

    const findRow = (results: CsvParseResult<ContestantCsvRow>) =>
      results.data.find((row: ContestantCsvRow) => row.id === uid);

    const fetchLyricsAndResolve = (mainRow: ContestantCsvRow) => {
      fetchLyricsCsv()
        .then((lyricsCsvString) => {
          Papa.parse(lyricsCsvString, {
            header: true,
            complete: (lyricsResults: CsvParseResult<ContestantCsvRow>) => {
              const lyricsRow = lyricsResults.data.find((row: ContestantCsvRow) => row.id === uid);

              // Return main details with or without lyrics
              resolve({
                lyrics: lyricsRow?.lyrics || '',
                engLyrics: lyricsRow?.eng_lyrics || '',
                composers: mainRow.composers,
                lyricists: mainRow.lyricists,
              } as SongDetails);
            },
            error: (error: Error) => reject(error),
          });
        })
        .catch(() => {
          // If lyrics CSV fails to load, still return main details
          resolve({
            lyrics: '',
            engLyrics: '',
            composers: mainRow.composers,
            lyricists: mainRow.lyricists,
          } as SongDetails);
        });
    };

    fetchMain(year)
      .then((results) => {
        const mainRow = findRow(results);
        if (mainRow) {
          fetchLyricsAndResolve(mainRow);
        } else if (year !== '') {
          // Fall back to full CSV if year-specific didn't have it
          fetchMain('')
            .then((results) => {
              const mainRow = findRow(results);
              if (!mainRow) {
                resolve(undefined);
                return;
              }
              fetchLyricsAndResolve(mainRow);
            })
            .catch((error) => reject(error));
        } else {
          resolve(undefined);
        }
      })
      .catch((error) => reject(error));
  });
}
