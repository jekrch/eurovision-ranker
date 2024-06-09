import Papa from 'papaparse';
import { Vote } from "../data/Vote";
import { sanitizeYear } from '../data/Contestants';


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

  return new Promise((resolve, reject) => {
    fetch('/votes.csv')
      .then(response => response.text())
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
                    row.from_country_id == countryKey
                  )  && 
                  (
                    !round || 
                    row.round == round
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



