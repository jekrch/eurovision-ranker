import { ContestantVotes } from "./Vote";

export interface ContestantData {
  id: string;
  countryKey: string;
  artist: string;
  song: string;
  youtube?: string;
  finalsRank?: number;
  semiFinalsRank?: number;
  votes?: ContestantVotes;
  year?: string;
}

export class Contestant implements ContestantData {
  id: string;
  countryKey: string;
  artist: string;
  song: string;
  private _youtube?: string;
  finalsRank?: number;
  semiFinalsRank?: number;
  votes?: ContestantVotes;
  year?: string;

  constructor(data: ContestantData) {
      this.id = data.id;
      this.countryKey = data.countryKey;
      this.artist = data.artist;
      this.song = data.song;
      this._youtube = data.youtube;
      this.finalsRank = data.finalsRank;
      this.semiFinalsRank = data.semiFinalsRank;
      this.votes = data.votes;
      this.year = data.year;
  }

  get youtube(): string | undefined {
      if (!this._youtube) {
          return undefined;
      }
      
      if (!this._youtube.includes('youtube.com') && !this._youtube.includes('youtu.be')) {
          this._youtube = `https://www.youtube.com/watch?v=${this._youtube}`;
      }
      
      return this._youtube;
  }

  set youtube(value: string | undefined) {
      this._youtube = value;
  }

  toJSON() {
    return {
      id: this.id,
      countryKey: this.countryKey,
      artist: this.artist,
      song: this.song,
      youtube: this.youtube, 
      finalsRank: this.finalsRank,
      semiFinalsRank: this.semiFinalsRank,
      votes: this.votes,
      year: this.year
    };
  }
}
  