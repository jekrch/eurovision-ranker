import { ContestantVotes } from "./Vote";

export type Contestant = {
    countryKey: string;
    artist: string;
    song: string;
    youtube?: string;
    finalsRank?: number;
    semiFinalsRank?: number;
    votes?: ContestantVotes;
  };
  