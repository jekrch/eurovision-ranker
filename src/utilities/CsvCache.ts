import { ContestId, contests, DEFAULT_CONTEST } from '../data/Contests';

// One download per file, shared by every caller that needs it.
const fileCache = new Map<string, Promise<string>>();
// Concatenations of several files, keyed by the joined file list, so a
// multi-file request resolves to the same string every time it's asked for.
const joinedCache = new Map<string, Promise<string>>();

function getFileContents(file: string): Promise<string> {
  let promise = fileCache.get(file);
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}${file}`).then((response) => response.text());
    fileCache.set(file, promise);
  }
  return promise;
}

function getJoinedContents(files: string[]): Promise<string> {
  if (files.length === 1) return getFileContents(files[0]!);

  const key = files.join('+');
  let promise = joinedCache.get(key);
  if (!promise) {
    promise = Promise.all(files.map(getFileContents)).then((contents) => contents.join(''));
    joinedCache.set(key, promise);
  }
  return promise;
}

/**
 * Vote CSV covering the given year of a contest. Resolves to an empty string
 * when the contest has no vote data, so callers parse it as "no votes".
 */
export function fetchVoteCsv(year: string, contest: ContestId = DEFAULT_CONTEST): Promise<string> {
  const file = contests[contest].voteFile(year);
  return file ? getFileContents(file) : Promise.resolve('');
}

/**
 * Contestant CSV covering the given year of a contest. An empty year covers
 * every year of the contest.
 */
export function fetchContestantCsv(
  year: string = '',
  contest: ContestId = DEFAULT_CONTEST,
): Promise<string> {
  return getJoinedContents(contests[contest].contestantFiles(year));
}

/**
 * Lyrics CSV for a contest. Resolves to an empty string when the contest has
 * no lyrics.
 */
export function fetchLyricsCsv(contest: ContestId = DEFAULT_CONTEST): Promise<string> {
  const file = contests[contest].lyricsFile;
  return file ? getFileContents(file) : Promise.resolve('');
}
