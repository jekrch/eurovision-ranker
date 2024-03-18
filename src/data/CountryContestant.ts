import { Contestant } from "./Contestant";
import { Country } from "./Country";

export class CountryContestant {
    id: string = 'N/A';
    country: Country;
    contestant?: Contestant;
    rankings: number[];
    // votes?: number;
    constructor(country: Country) {
      this.id = country.id;
      this.country = country;
      this.rankings = [];
    }
  };
  