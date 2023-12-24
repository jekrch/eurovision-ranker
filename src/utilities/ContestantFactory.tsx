import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2021, contestants2022, contestants2023, contestants2024 } from '../data/Contestants';


export function fetchCountryContestantsByYear(year: string): CountryContestant[] {

    let contestants: Contestant[] = getContestantsByYear(year);

    return contestants.map(contestant => {
        const country = countries.find(country => country.key === contestant.countryKey);
        if (!country) {
            throw new Error(`No matching country found for contestant with countryKey: ${contestant.countryKey}`);
        }
        return {
            id: country.key,
            country: country,
            contestant: contestant
        };
    });
}

function getContestantsByYear(year: string) {
    switch (year) {
        case '2024': 
            return contestants2024;
        case '2023':
            return contestants2023;
        case `2022`:
            return contestants2022; 
        case `2021`:
            return contestants2021; 
        default:
            throw new Error(`No contestants found for year: ${year}`);
    }
}
  