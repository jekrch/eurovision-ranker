import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2019, contestants2021, contestants2022, contestants2023, contestants2024 } from '../data/Contestants';


export function fetchCountryContestantsByYear(year: string): CountryContestant[] {

    let contestants: Contestant[] = getContestantsByYear(year);

    return contestants.map(contestant => {
        const country = countries.find(country => country.key === contestant.countryKey);
        if (!country) {
            throw new Error(`No matching country found for contestant with countryKey: ${contestant.countryKey}`);
        }
        return {
            id: country.id,
            country: country,
            contestant: contestant
        };
    });
}

function getContestantsByYear(year: string) {
    if (year?.length == 2) {
        year = '20' + year;
    }
    switch (year) {
        case '2024': 
            return contestants2024;
        case '2023':
            return contestants2023;
        case `2022`:
            return contestants2022; 
        case `2021`:
            return contestants2021; 
        case `2019`:
            return contestants2019; 
        default:
            throw new Error(`No contestants found for year: ${year}`);
    }
}
  