import { CountryContestant } from "../data/CountryContestant";

export function clone(contestants: CountryContestant[]) {
    return JSON.parse(JSON.stringify(contestants));
}

/**
 * Return string array of all country contestant uids (contestant.id)
 * @param contestants 
 * @returns 
 */
export function getUids(contestants: CountryContestant[]): string[] {
    return contestants.filter(
        f =>
            f.uid && 
            f.uid !== null
    ).map(
        f => f.uid!
    );
}