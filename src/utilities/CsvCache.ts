let cachedVoteCsvPromise: Promise<string> | null = null;

export function fetchVoteCsv(): Promise<string> {
    if (cachedVoteCsvPromise) {
        return cachedVoteCsvPromise;
    }

    const promise = fetch('/votes.csv')
        .then(response => response.text());

    cachedVoteCsvPromise = promise;

    return promise;
}

let cachedContestantCsvPromise: Promise<string> | null = null;

export function fetchContestantCsv(): Promise<string> {

    if (cachedContestantCsvPromise) {
        return cachedContestantCsvPromise;
    }

    const promise = fetch('/contestants.csv')
        .then(response => response.text());

    cachedContestantCsvPromise = promise;
    return promise;
}
