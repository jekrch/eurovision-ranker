import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import Papa from 'papaparse';
import { assignVotesByCode, assignVotesByContestants, voteCodeHasSourceCountry } from "./VoteProcessor";
import { cachedYear, initialCountryContestantCache } from "../data/InitialContestants";
import { SongDetails } from "../data/SongDetails";
import { fetchContestantCsv, fetchLyricsCsv } from "./CsvCache";
import { clone } from "./ContestantUtil";
import { sanitizeYear } from "../data/Contestants";
import { getUrlParam } from "./UrlUtil";

const yearContestantCache: { [year: string]: Contestant[] } = {};
const idContestantCache: { [id: string]: Contestant } = {};

export async function fetchCountryContestantsByYear(
  year: string,
  voteCode: string = ''
): Promise<CountryContestant[]> {

  // if we're requesting the cached year and there's no source country in 
  // the vote code, return an already parsed json array (for performance)
  if (
    sanitizeYear(year) === cachedYear &&
    !voteCodeHasSourceCountry(voteCode)
  ) {
    return clone(initialCountryContestantCache);
  }

  return await fetchAndProcessCountryContestants(
    year, voteCode
  );
}

export async function fetchAndProcessCountryContestants(
  year: string, voteCode: string
) {
  let contestants: Contestant[] = await getContestantsByYear(
    year
  );

  return await mapContestantsWithVotes(contestants, voteCode);
}

async function mapContestantsWithVotes(
  contestants: Contestant[], 
  voteCode?: string
) {

  let countryContestants: CountryContestant[] = contestants.map(contestant => {

    // special handling for 1956 where two contestants were sent for each participating nation
    let secondaryContestant = sanitizeYear(contestant?.year!) === '1956' && contestant.countryKey.endsWith('2');

    let contestantCountryKey = contestant.countryKey;

    if (secondaryContestant) {
      // I appended '2' to the end of each secondary contestant's country key (e.g. fr and fr2)
      contestantCountryKey = contestantCountryKey.slice(0, -2);
    }

    let country = fetchCountryByKey(contestantCountryKey, contestant);

    if (!country) {
      throw new Error(
        `No matching country found for contestant with countryKey: ${contestant.countryKey}`
      );
    }

    if (secondaryContestant) {
      // if this is a secondary contestant reflect this in the country name 
      // to better distinguish them
      let countryB = { ...country };
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
  }).sort((a, b) => a.country.name.localeCompare(b.country.name));

  // add votes if requested
  // countryContestants = await assignVotesByCode(
  //   countryContestants, voteCode ?? ''
  // );

  let newCountryContestants = await assignVotesByContestants(
    countryContestants, 
    voteCode ?? ''
  )

  return newCountryContestants;
}

function fetchCountryByKey(
  contestantCountryKey: string,
  contestant: Contestant
) {
 
  let country = countries.find(country => country.key === contestantCountryKey);

  // some countries in the dataset have their name used as their two character 
  // country code. if we couldn't find the country using the code, try using 
  // the name, and fix the field assignment
  if (!country) {

    // consolidate cz on Czechia 
    if (contestant.countryKey?.toLowerCase() === 'czech republic') {
      contestant.countryKey = 'Czechia';
    }

    country = countries.find(
      country => country.name === contestant.countryKey
    );

    if (country) {
      contestant.countryKey = country.key;
    }
  }

  return country;
}

async function getContestantsByYear(
  year: string,
): Promise<Contestant[]> {

  year = sanitizeYear(year);
  return await getContestantsForYear(year);
}

// shared cache for contestants
const contestantCache: { [year: string]: Contestant[]; } = {};
const individualContestantCache: { [id: string]: Contestant } = {};

/**
 * parses CSV data and processes contestants
 * 
 * @param results - parsed CSV data
 * @param filterFn - function to filter relevant rows
 * @returns processed contestants
 */
function processContestants(
  results: any,
  filterFn: (row: any) => boolean
): Contestant[] {
  const tempStorage = new Map<string, Contestant>();

  results.data
    .filter(filterFn)
    .forEach((row: any) => {
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
function createContestant(row: any): Contestant {
  return {
    id: row.id,
    countryKey: row.to_country_id,
    artist: row.performer,
    song: row.song,
    youtube: row.youtube_url,
    finalsRank: row.place_contest?.length ? row.place_contest : row.place_final,
    semiFinalsRank: row.place_sf,
    year: row.year,
    votes: {
      round: 'Final',
      year: row.year,
      totalPoints: row.points_final,
      telePoints: row.points_tele_final,
      juryPoints: row.points_jury_final
    }
  };
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
  row: any
): void {
  const [year, countryKey] = id.split('-');
  if (year !== '1956') {
    console.debug('dupe found ' + year + ' ' + countryKey);
    // update the existing entry
    const existingEntry = tempStorage.get(id)!;
    if (row.place_contest) {
      existingEntry.finalsRank = row.place_contest;
    }
    if (row.place_sf) {
      existingEntry.semiFinalsRank = row.place_sf;
    }
  } else {
    // since 1956 had two songs per country, allow country dupes here
    tempStorage.set(`${id}-2`, {
      ...createContestant(row),
      countryKey: `${countryKey}-2`,
    });
  }
}

/**
 * fetches and parses contestant CSV data
 * 
 * @returns promise resolving to parsed CSV data
 */
function fetchAndParseCsv(): Promise<any> {
  return new Promise((resolve, reject) => {
    fetchContestantCsv()
      .then(response => response)
      .then(csvString => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => resolve(results),
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
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

  return fetchAndParseCsv()
    .then(results => {
      const contestants = processContestants(results, row => row.year === year);
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
  voteType: string = getUrlParam('v') ?? ''
): Promise<CountryContestant[]> {
  const contestants = await getContestantsByUids(uids);
  const countryContestants: CountryContestant[] = await mapContestantsWithVotes(
    contestants, voteType
  );
  
  // create a map for quick lookup
  const contestantMap = new Map(countryContestants.map(cc => [cc.uid, cc]));
  
  // create a new array with the correct order
  const orderedCountryContestants = uids.map(id => {
    const contestant = contestantMap.get(id);
    if (!contestant) {
      console.error(`No contestant found for id: ${id}`);
    }
    return contestant;
  }).filter((cc): cc is CountryContestant => cc !== undefined);

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

  ids.forEach(id => {
    if (id in individualContestantCache) {
      cachedContestants.push(individualContestantCache[id]);
    } else {
      idsToFetch.push(id);
    }
  });

  if (idsToFetch.length === 0) {
    return Promise.resolve(cachedContestants);
  }

  return fetchAndParseCsv()
    .then(results => {
      const fetchedContestants = processContestants(results, row => {
        return idsToFetch.includes(row.id);
      });

      fetchedContestants.forEach(contestant => {
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

  return fetchAndParseCsv()
    .then(results => {
      const fetchedContestants = processContestants(results, row => {
        return row.to_country?.toLowerCase() === country?.toLowerCase();
      });

      return fetchedContestants;
    });
}

export function getSongDetails(
  uid: string
): Promise<SongDetails | undefined> {
  return new Promise((resolve, reject) => {
    // first fetch composers and lyricists from main.csv
    fetchContestantCsv()
      .then(response => response)
      .then(mainCsvString => {
        Papa.parse(mainCsvString, {
          header: true,
          complete: (mainResults: any) => {
            const mainRow = mainResults.data.find(
              (row: any) => row.id === uid
            );

            if (!mainRow) {
              resolve(undefined);
              return;
            }

            // Then fetch lyrics from lyrics.csv
            fetchLyricsCsv()
              .then(response => response)
              .then(lyricsCsvString => {
                Papa.parse(lyricsCsvString, {
                  header: true,
                  complete: (lyricsResults: any) => {
                    const lyricsRow = lyricsResults.data.find(
                      (row: any) => row.id === uid
                    );

                    if (!lyricsRow) {
                      resolve(undefined);
                      return;
                    }

                    resolve({
                      lyrics: lyricsRow.lyrics,
                      engLyrics: lyricsRow.eng_lyrics,
                      composers: mainRow.composers,
                      lyricists: mainRow.lyricists
                    } as SongDetails);
                  },
                  error: (error: any) => reject(error)
                });
              })
              .catch(error => reject(error));
          },
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}