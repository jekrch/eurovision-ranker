import { Contestant } from "./Contestant";
import { Country } from "./Country";

export interface CountryContestant {
    id: string;
    country: Country;
    contestant: Contestant | null;
  };
  
  export function createCountryContestant(country: Country): CountryContestant {
    return {
        id: country.id,
        country: country,
        contestant: null
    } as CountryContestant;
}