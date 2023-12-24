import { Contestant } from "../data/Contestant";
import { CountryContestant } from "../data/CountryContestant";
import { countries } from '../data/Countries';
import { contestants2019, contestants2021, contestants2022, contestants2023, contestants2024, defaultYear } from '../data/Contestants';
import { Dispatch } from 'redux';
import { setYear } from "../redux/actions";


export function fetchCountryContestantsByYear(
    year: string, 
    dispatch: Dispatch<any>
): CountryContestant[] {
    
    let contestants: Contestant[] = getContestantsByYear(
        year, dispatch
    );

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

function getContestantsByYear(
    year: string, 
    dispatch: Dispatch<any>
): Contestant[] {
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
            console.error(`No contestants found for year: ${year}, loading default ${defaultYear}`);
            dispatch(
                setYear(defaultYear)
            );
            return getContestantsByYear(defaultYear, dispatch);
    }
}
  