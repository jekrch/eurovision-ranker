let cachedVoteCsvPromise: Promise<string> | null = null;

export function fetchVoteCsv(): Promise<string> {
    if (cachedVoteCsvPromise) {
        return cachedVoteCsvPromise;
    }

    const promise = fetch(`${import.meta.env.BASE_URL}votes.csv`)
        .then(response => response.text());

    cachedVoteCsvPromise = promise;

    return promise;
}

let cachedContestantCsvPromise: Promise<string> | null = null;

export function fetchContestantCsv(): Promise<string> {
    if (cachedContestantCsvPromise) {
        return cachedContestantCsvPromise;
    }

    const promise = fetch(`${import.meta.env.BASE_URL}main.csv`)
        .then(response => response.text());

    cachedContestantCsvPromise = promise;
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