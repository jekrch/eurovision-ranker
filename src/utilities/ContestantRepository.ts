import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2019, contestants2021, contestants2022, contestants2023, contestants2024, defaultYear, sanitizeYear } from '../data/Contestants';
import { Dispatch } from 'redux';
import Papa from 'papaparse';
import { assignVotesByCode, voteCodeHasSourceCountry } from "./VoteProcessor";
import { cachedYear, initialCountryContestantCache } from "../data/InitialContestants";
import { SongDetails } from "../data/SongDetails";


export async function fetchCountryContestantsByYear(
  year: string,
  voteCode: string = '',
  dispatch?: Dispatch<any>
): Promise<CountryContestant[]> {

  // if we're requesting the cached year and there's no source country in 
  // the vote code, return an already parsed json array (for performance)
  if (
      sanitizeYear(year) === cachedYear && 
      !voteCodeHasSourceCountry(voteCode)
    ) {
    return initialCountryContestantCache;
  } 
  
  return await fetchAndProcessCountryContestants(
    year, voteCode, dispatch
  );
}

export async function fetchAndProcessCountryContestants(
   year: string,
   voteCode: string,
   dispatch: Dispatch<any> | undefined, 
) {
  let contestants: Contestant[] = await getContestantsByYear(
    year, dispatch
  );

  let countryContestants: CountryContestant[] = contestants.map(contestant => {

    // special handling for 1956 where two contestants were sent for each participating nation
    let secondaryContestant = sanitizeYear(year) === '1956' && contestant.countryKey.endsWith('2');

    let contestantCountryKey = contestant.countryKey;

    if (secondaryContestant) {
      // I appended '2' to the end of each secondary contestant's country key (e.g. fr and fr2)
      contestantCountryKey = contestantCountryKey.slice(0, -1);;
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
        country: countryB,
        contestant: contestant,
      };
    } else {
      return {
        id: country.id,
        country: country,
        contestant: contestant,
      };
    }
  }).sort((a, b) => a.country.name.localeCompare(b.country.name));

  // add votes if requested
  countryContestants = await assignVotesByCode(
    countryContestants, year, voteCode
  );

  countryContestants = sanitizeYoutubeLinks(
    year,
    countryContestants
  );
  return countryContestants;
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

/**
 * The csv data set has some youtube links that are currently region locked. Replace 
 * those with the youtube links from the legacy CountryContestant ts array data. 
 * 
 * @param year 
 * @param countryContestants 
 * @returns 
 */
function sanitizeYoutubeLinks(
  year: string,
  countryContestants: CountryContestant[],
): CountryContestant[] {

  year = sanitizeYear(year);
  let youtubeContestants: Contestant[];

  // only do this for the years we have youtube links for
  switch (year) {
    case '2023':
      youtubeContestants = contestants2023;
      break;
    case '2022':
      youtubeContestants = contestants2022;
      break;
    case '2021':
      youtubeContestants = contestants2021;
      break;
    case '2019':
      youtubeContestants = contestants2019;
      break;
    default:
      return countryContestants;
  }

  countryContestants.forEach(countryContestantToUpdate => {
    // Find the matching contestant 
    const matchingContestantWithYoutube = youtubeContestants.find(
      contestantInSecond =>
        contestantInSecond.countryKey?.toLowerCase() ===
        countryContestantToUpdate.country.key?.toLowerCase()
    );

    // Replace the youtube value if a match is found
    if (matchingContestantWithYoutube && countryContestantToUpdate?.contestant) {
      countryContestantToUpdate.contestant.youtube = matchingContestantWithYoutube.youtube;
    }
  });

  return countryContestants;
}

async function getContestantsByYear(
  year: string,
  dispatch?: Dispatch<any>
): Promise<Contestant[]> {

  year = sanitizeYear(year);

  if (year === '2024') {
    return contestants2024;
  }

  return await getContestantsForYear(year);
}

/**
 * Returns all contestants for the provided year 
 * @param year 
 * @returns 
 */
export function getContestantsForYear(year: string): Promise<Contestant[]> {
  return new Promise((resolve, reject) => {
    fetch('/contestants.csv')
      .then(response => response.text())
      .then(csvString => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => {
            const tempStorage = new Map<string, Contestant>();

            results.data
              .filter((row: any) => row.year === year)
              .forEach((row: any) => {
                const countryKey = row.to_country_id;

                // Check if this country already has an entry
                if (!tempStorage.has(countryKey)) {
                  // Create a new entry
                  tempStorage.set(countryKey, {
                    countryKey,
                    artist: row.performer,
                    song: row.song,
                    youtube: row.youtube_url,
                    finalsRank: row.place_final ?? row.place_contest,
                    semiFinalsRank: row.place_sf,
                  });
                } else {
                  if (year !== '1956') {
                    console.debug('dupe found ' + year + ' ' + countryKey);
                    // Update the existing entry
                    const existingEntry: any = tempStorage.get(countryKey);
                    if (row.place_contest) {
                      existingEntry.finalsRank = row.place_contest;
                    }
                    if (row.place_sf) {
                      existingEntry.semiFinalsRank = row.place_sf;
                    }
                  } else {
                    // since 1956 had two songs per country, I'm allowing country dupes here
                    tempStorage.set(countryKey + '2', {
                      countryKey: countryKey + '2',
                      artist: row.performer,
                      song: row.song,
                      youtube: row.youtube_url,
                      finalsRank: row.place_final ?? row.place_contest,
                      semiFinalsRank: row.place_sf,
                    });
                  }
                }
              });

            const contestants = Array.from(tempStorage.values());
            resolve(contestants);
          },
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}

export function getSongDetails(
  year: string, 
  songTitle: string
): Promise<SongDetails | undefined> {

  return new Promise((resolve, reject) => {

    fetch('/contestants.csv')
      .then(response => response.text())
      .then(csvString => {

        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => {
            const matchingRow = results.data.find(
              (row: any) => row.year === year && row.song === songTitle
            );

            if (matchingRow) {
              //console.log(matchingRow)
              resolve({
                lyrics: matchingRow.lyrics, 
                engLyrics: matchingRow.eng_lyrics,
                composers: matchingRow.composers,
                lyricists: matchingRow.lyricists
              } as SongDetails);

            } else {
              resolve(undefined);
            }
          },
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}
