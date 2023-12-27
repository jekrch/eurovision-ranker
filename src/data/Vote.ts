export type Vote = {
    year: string;
    round: string;
    fromCountryKey: string;
    toCountryKey: string;
    totalPoints?: number;
    telePoints?: number;
    juryPoints?: number;
  };