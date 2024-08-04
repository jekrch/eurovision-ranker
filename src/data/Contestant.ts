import { ContestantVotes } from "./Vote";

export type Contestant = {
    id: string;
    countryKey: string;
    artist: string;
    song: string;
    youtube?: string;
    finalsRank?: number;
    semiFinalsRank?: number;
    votes?: ContestantVotes;
    year?: string;
  };
  