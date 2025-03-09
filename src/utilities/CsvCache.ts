import { defaultYear } from "../data/Contestants";

let cachedVoteCsvPromise: Promise<string> | null = null;
let cachedVoteCurrentCsvPromise: Promise<string> | null = null;

export function fetchVoteCsv(year: string): Promise<string> {

    const isCurrentYear = year === defaultYear;

    const file: string = isCurrentYear ? 'votesCurrent.csv' : `votes.csv`;

    if (!isCurrentYear && cachedVoteCsvPromise) {
        return cachedVoteCsvPromise;
    } else if (isCurrentYear && cachedVoteCurrentCsvPromise) {
        return cachedVoteCurrentCsvPromise;
    }

    const promise = fetch(`${import.meta.env.BASE_URL}${file}`)
        .then(response => response.text());

    if (isCurrentYear) {
        cachedVoteCurrentCsvPromise = promise;
    } else {
        cachedVoteCsvPromise = promise;
    }

    return promise;
}

let cachedContestantCsvPromise: Promise<string> | null = null;
let cachedContestantCurrentCsvPromise: Promise<string> | null = null;

export function fetchContestantCsv(year: string = ''): Promise<string> {

    const isCurrentYear = year === defaultYear;

    const file: string = isCurrentYear ? 'mainCurrent.csv' : `main.csv`;

    if (!isCurrentYear && cachedContestantCsvPromise) {
        return cachedContestantCsvPromise;
    } else if (isCurrentYear && cachedContestantCurrentCsvPromise) {
        return cachedContestantCurrentCsvPromise;
    }

    const promise = fetch(`${import.meta.env.BASE_URL}${file}`)
        .then(response => response.text());

    if (isCurrentYear) {
        cachedContestantCurrentCsvPromise = promise;
    } else {
        cachedContestantCsvPromise = promise;
    }
    
    return promise;
}

let cachedLyricsCsvPromise: Promise<string> | null = null;

export function fetchLyricsCsv(): Promise<string> {
    if (cachedLyricsCsvPromise) {
        return cachedLyricsCsvPromise;
    }

    const promise = fetch(`${import.meta.env.BASE_URL}lyrics.csv`)
        .then(response => response.text());

        cachedLyricsCsvPromise = promise;
    return promise;
}