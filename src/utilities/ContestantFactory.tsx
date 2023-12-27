import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2019, contestants2021, contestants2022, contestants2023, contestants2024, defaultYear, sanitizeYear } from '../data/Contestants';
import { Dispatch } from 'redux';
import Papa from 'papaparse';

const contestantCsvPath = '../data/contestants.csv';

export async function fetchCountryContestantsByYear(
  year: string,
  dispatch?: Dispatch<any>
): Promise<CountryContestant[]> {

  let contestants: Contestant[] = await getContestantsByYear(
    year, dispatch
  );

  //console.log(contestants)
  let countryContestants: CountryContestant[] = contestants.map(contestant => {
    let country = countries.find(country => country.key === contestant.countryKey);
    if (!country) {

      if (contestant.countryKey?.toLowerCase() === 'czech republic') {
        contestant.countryKey = 'Czechia';
      }
      country = countries.find(country => country.name === contestant.countryKey);

      if (country) {
        contestant.countryKey = country.key;
      }
    }

    if (!country) {
      throw new Error(`No matching country found for contestant with countryKey: ${contestant.countryKey}`);
    }
    return {
      id: country.id,
      country: country,
      contestant: contestant
    };
  }).sort((a, b) => a.country.name.localeCompare(b.country.name));

  return sanitizeYoutubeLinks(
    year, 
    countryContestants
  );
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

async function test(year: string) {
  console.log(await getContestantsForYear(year));
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

  // test(year);

  // switch (year) {
  //     case '2024': 
  //         return contestants2024;
  //     case '2023':
  //         return contestants2023;
  //     case `2022`:
  //         return contestants2022; 
  //     case `2021`:
  //         return contestants2021; 
  //     case `2019`:
  //         return contestants2019; 
  //     default:
  //         let errorMsg = `No contestants found for year: ${year}, loading default ${defaultYear}`;

  //         if (dispatch) {

  //             console.log(errorMsg);
  //             dispatch(
  //                 setYear(defaultYear)
  //             );
  //             return await (defaultYear);

  //         } else {
  //             throw new Error(errorMsg)
  //         }
  //}
}

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
                    finalsRank: row.place_contest,
                    semiFinalsRank: row.place_sf,
                  });
                } else {
                  // Update the existing entry
                  const existingEntry: any = tempStorage.get(countryKey);
                  if (row.place_contest) {
                    existingEntry.finalsRank = row.place_contest;
                  }
                  if (row.place_sf) {
                    existingEntry.semiFinalsRank = row.place_sf;
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




