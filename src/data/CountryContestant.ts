import { Contestant } from "./Contestant";
import { Country } from "./Country";

export class CountryContestant {
    id: string = 'N/A';
    country: Country;
    contestant?: Contestant;
    constructor(country: Country) {
      this.id = country.id;
      this.country = country;
    }
  };
  