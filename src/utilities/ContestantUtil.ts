import { CountryContestant } from "../data/CountryContestant";

export function clone(contestants: CountryContestant[]) {
    return JSON.parse(JSON.stringify(contestants));
}