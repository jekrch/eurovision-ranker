import { Vote } from '../../../data/Vote';

export const SHOW_ENG_LYRICS_KEY = 'er-show-eng-lyrics';
export const ACTIVE_TAB_KEY = 'er-song-modal-tab';

export type TabKey = 'lyrics' | 'video' | 'votes';

// columns the votes table can be sorted by
export type SortKey = 'from' | 'jury' | 'tele' | 'total';

// preferred order of rounds when a song received votes in more than one round
export const ROUND_ORDER = ['Final', 'Semi-Final', 'Semi-Final-1', 'Semi-Final-2'];

export type RoundVotes = { round: string; votes: Vote[] };

// last tab the user viewed, remembered across modal opens within a session
export const readStickyTab = (): TabKey | null => {
  try {
    const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
    return stored === 'lyrics' || stored === 'video' || stored === 'votes' ? stored : null;
  } catch {
    return null;
  }
};

// pick which tab to show given what content this song actually has, preferring
// the user's last-viewed (sticky) tab when it's available for this song
export const resolveTab = (
  available: { lyrics: boolean; video: boolean; votes: boolean },
  sticky: TabKey | null,
): TabKey => {
  if (sticky && available[sticky]) {
    return sticky;
  }
  if (available.lyrics) return 'lyrics';
  if (available.video) return 'video';
  if (available.votes) return 'votes';
  return 'lyrics';
};

// a value is "present" if it's a non-empty, non-null cell from the vote CSV
export const isPresent = (value: unknown): boolean =>
  value !== undefined && value !== null && String(value).trim() !== '';

export const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function formatLyrics(lyrics: string | undefined, song: string | undefined) {
  if (!lyrics) {
    return lyrics;
  }

  let lines = lyrics.split('\\n');

  // if the first line is the song title and the second line is empty,
  // remove those lines
  if (lines.length >= 2 && lines[0] === song && !lines[1].trim()) {
    lines = lines.slice(2);
  }

  const finalLyrics = lines.join('\\n');

  return finalLyrics;
}
