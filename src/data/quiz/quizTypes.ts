/**
 * Types and configuration for the Eurovision quiz mode.
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type QuizQuestionType =
  | 'country'      // which country did {artist} represent in {year}
  | 'artist'       // which artist performed "{song}" in {year}
  | 'winner'       // which country won {year}
  | 'placement'    // which country finished 2nd/3rd in {year}
  | 'zeroPoints'   // which country scored zero points in {year}
  | 'televote'     // which country won the televote in {year}
  | 'jury';        // which country won the jury vote in {year}

export type QuizLength = 'short' | 'medium' | 'long';

export interface QuestionTypeMeta {
  type: QuizQuestionType;
  label: string;
  description: string;
  defaultOn: boolean;
}

export const QUESTION_TYPE_META: QuestionTypeMeta[] = [
  { type: 'country', label: 'Country of artist', description: 'Which country did an artist represent?', defaultOn: true },
  { type: 'artist', label: 'Artist of song', description: 'Which artist performed a song?', defaultOn: true },
  { type: 'winner', label: 'Contest winner', description: 'Which country won the final?', defaultOn: true },
  { type: 'placement', label: 'Podium finish', description: 'Which country finished 2nd or 3rd?', defaultOn: true },
  { type: 'televote', label: 'Televote winner', description: 'Which country won the televote? (2016+)', defaultOn: false },
  { type: 'jury', label: 'Jury winner', description: 'Which country won the jury vote? (2016+)', defaultOn: false },
  { type: 'zeroPoints', label: 'Nul points', description: 'Which country scored zero points?', defaultOn: false },
];

/**
 * Setup-screen grouping of question types. Most groups map to a single type, but
 * "Contest winners" bundles the final / televote / jury winner questions behind a
 * single toggle. The underlying QuizQuestionType values are unchanged, so the
 * generator, scoring and shareable-code encoding keep working as before.
 */
export interface QuestionGroupMeta {
  id: string;
  label: string;
  description: string;
  types: QuizQuestionType[];
  defaultOn: boolean;
}

export const QUESTION_GROUP_META: QuestionGroupMeta[] = [
  { id: 'country', label: 'Country of artist', description: 'Which country did an artist represent?', types: ['country'], defaultOn: true },
  { id: 'artist', label: 'Artist of song', description: 'Which artist performed a song?', types: ['artist'], defaultOn: true },
  { id: 'winners', label: 'Contest winners', description: 'Which country won the final, televote or jury vote? (vote winners 2016+)', types: ['winner', 'televote', 'jury'], defaultOn: true },
  { id: 'placement', label: 'Podium & nul points', description: 'Which country finished 2nd/3rd or scored zero points?', types: ['placement', 'zeroPoints'], defaultOn: true },
];

export const DIFFICULTY_META: Record<QuizDifficulty, { label: string; optionCount: number; nearDistractors: boolean }> = {
  easy: { label: 'Easy', optionCount: 3, nearDistractors: false },
  medium: { label: 'Medium', optionCount: 4, nearDistractors: false },
  hard: { label: 'Hard', optionCount: 4, nearDistractors: true },
};

export const LENGTH_META: Record<QuizLength, { label: string; count: number }> = {
  short: { label: 'Short', count: 10 },
  medium: { label: 'Medium', count: 20 },
  long: { label: 'Long', count: 30 },
};

export interface QuizConfig {
  years: string[];
  difficulty: QuizDifficulty;
  questionTypes: QuizQuestionType[];
  length: QuizLength;
}

export interface QuizOption {
  id: string;
  label: string;       // main text (country name or artist)
  sublabel?: string;   // secondary text (song / artist)
  countryKey?: string; // for rendering a flag
  // extra context used only when the answer is revealed
  artist?: string;
  song?: string;
  countryName?: string;
  youtube?: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  year: string;
  prompt: string;            // full question text
  promptHighlight?: string;  // song/artist to emphasize within the prompt
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;       // shown after answering
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface QuizResult {
  config: QuizConfig;
  /** Seed the quiz was generated from; with config it reproduces the quiz. */
  seed: number;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;
  total: number;
  elapsedMs: number;
}
