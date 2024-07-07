import { countries } from "../data/Countries";
import { CountryContestant } from "../data/CountryContestant";

export function getSourceCountryKey(voteSource: string) {

    if (voteSource?.length && voteSource !== 'All') {
        const sourceCountryKey = countries.find(c => c.name === voteSource)?.key;

        if (!sourceCountryKey?.length) {
            console.error('Source country not found for ' + voteSource);
        }

        return sourceCountryKey;
    }
}
export function hasAnyJuryVotes(yearContestants: CountryContestant[]) {
    return yearContestants.some(cc => cc?.contestant?.votes?.juryPoints &&
        cc?.contestant?.votes?.juryPoints > 0
    );
}

export function hasAnyTeleVotes(yearContestants: CountryContestant[]) {
    return yearContestants.some(cc => cc?.contestant?.votes?.telePoints &&
        cc?.contestant?.votes?.telePoints > 0
    );
}

export function getVoteTypeOption(voteCode: string) {
    if (!voteCode?.length || voteCode === 'loading') {
        return 'None';
    }

    let codes = voteCode.split("-");

    switch (codes[1]) {
        case 'tv':
            return 'Tele';
        case 'j':
        case 'jury':
            return 'Jury';
        default:
            return 'Total';
    }
}

export function getVoteTypeCodeFromOption(
    optionName: string
) {
    if (!optionName) {
        return;
    }

    switch (optionName?.toLowerCase()) {
        case 'jury':
            return 'j'
        case 'total':
            return 't';
        case 'tele':
        case 'televote':
            return 'tv'
        default:
            return;
    }
}

    /**
     * Returns the vote code param for the provided round, type, and source (country)
     * 
     * @param round 
     * @param voteType 
     * @param voteSource 
     * @returns 
     */
    export function getVoteCode(
        round: string,
        voteType: string,
        voteSource: string
    ) {

        let voteCode = `${round}-${voteType}`;

        const countryKey = getSourceCountryKey(voteSource);

        if (countryKey?.length) {
            voteCode += `-${countryKey}`;
        }

        return voteCode;
    }