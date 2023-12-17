import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2023 } from '../data/Contestants';


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
    let contestants: Contestant[];

    switch (year) {
        case '2023':
            contestants = contestants2023;
            break;
        default:
            throw new Error(`No contestants found for year: ${year}`);
    }
    return contestants;
}
  