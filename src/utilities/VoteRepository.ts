import Papa from 'papaparse';
import { Vote } from "../data/Vote";
import { sanitizeYear } from '../data/Contestants';
import { fetchVoteCsv } from './CsvCache';

const voteCache: { [key: string]: Vote[] } = {};

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
): Promise<Vote[]> {
  year = sanitizeYear(year);
  countryKey = countryKey?.toLowerCase();

  if (round)
    round = convertRoundToShortName(round);

  const cacheKey = `${year}-${countryKey}-${round}`;

  if (voteCache[cacheKey]) {
    return Promise.resolve(voteCache[cacheKey]);
  }

  return new Promise((resolve, reject) => {
    fetchVoteCsv()
      .then(response => response)
      .then(csvString => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => {
            // Filter and map the data
            const votes = results.data
              .filter(
                (row: any) =>
                  row.year === year &&
                  (
                    !countryKey ||
                    row.from_country_id === countryKey
                  ) &&
                  (
                    !round ||
                    row.round === round
                  )
              ).map((row: any) => ({
                year: row.year,
                round: convertRoundToLongName(row.round),
                fromCountryKey: row.from_country_id,
                toCountryKey: row.to_country_id,
                totalPoints: row.total_points ?? parseInt(row.total_points),
                telePoints: row.tele_points ?? parseInt(row.tele_points),
                juryPoints: row.jury_points ?? parseInt(row.jury_points),
              }));

            voteCache[cacheKey] = votes;
            resolve(votes);
          },
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}

/**
 * fetches votes for multiple years and countries
 * @param yearCountryPairs - array of objects containing year and country key
 * @param round - optional round filter
 */
export async function fetchVotesForYearsAndCountries(
  yearCountryPairs: Array<{ year: string, countryKey: string }>,
  round?: string
): Promise<Vote[]> {
  const uniqueYears = new Set(yearCountryPairs.map(pair => sanitizeYear(pair.year)));
  const uniqueCountries = new Set(yearCountryPairs.map(pair => pair.countryKey.toLowerCase()));

  if (round) {
    round = convertRoundToShortName(round);
  }

  const cacheKey = `${Array.from(uniqueYears).join(',')}-${Array.from(uniqueCountries).join(',')}-${round}`;

  if (voteCache[cacheKey]) {
    return Promise.resolve(voteCache[cacheKey]);
  }

  return new Promise((resolve, reject) => {
    fetchVoteCsv()
      .then(response => response)
      .then(csvString => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => {
            const votes = results.data
              .filter((row: any) =>
                uniqueYears.has(row.year) &&
                uniqueCountries.has(row.to_country_id) &&
                (!round || row.round === round)
              )
              .map((row: any) => ({
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
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}

const convertRoundToLongName = (round: string) => {
  switch (round) {
    case 'f':
      return 'Final'
    case 'sf':
      return 'Semi-Final';
    case 'sf1':
      return 'Semi-Final-1'
    case 'sf2':
      return 'Semi-Final-2'
    default:
      throw new Error(round + ' not supported');
  }
}

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

export function fetchDistinctFromCountryIdsForYear(
  year: string
): Promise<string[]> {
  year = sanitizeYear(year);

  return new Promise((resolve, reject) => {
    fetch('/votes.csv')
      .then(response => response.text())
      .then(csvString => {
        Papa.parse(csvString, {
          header: true,
          complete: (results: any) => {
            const fromCountryIds = results.data
              .filter((row: any) => row.year === year)
              .map((row: any) => row.from_country_id)
              .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Removing duplicates

            resolve(fromCountryIds);
          },
          error: (error: any) => reject(error)
        });
      })
      .catch(error => reject(error));
  });
}



