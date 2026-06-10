import { describe, it, expect } from 'vitest';

import { QUIZ_YEARS } from './quizGenerator';
import { formatDuration, formatYearRanges, typeBreakdown, scoreMessage } from './quizScoring';
import { QuizAnswer, QuizQuestion, QuizResult } from '../../data/quiz/quizTypes';

describe('formatDuration', () => {
  it('formats sub-hour durations as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9_000)).toBe('0:09');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(600_000)).toBe('10:00');
  });

  it('formats hour-plus durations as h:mm:ss', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(1_499)).toBe('0:01');
    expect(formatDuration(1_500)).toBe('0:02');
  });
});

describe('formatYearRanges', () => {
  it('returns "All years" for empty or full selections', () => {
    expect(formatYearRanges([])).toBe('All years');
    expect(formatYearRanges([...QUIZ_YEARS])).toBe('All years');
  });

  it('collapses runs that are contiguous among available contest years', () => {
    // 2020 had no contest, so 2019 and 2021 are adjacent in the available ordering
    expect(formatYearRanges(['2019', '2021', '2022', '2023'])).toBe('2019–2023');
  });

  it('renders a single year as itself', () => {
    expect(formatYearRanges(['2016'])).toBe('2016');
  });

  it('joins non-contiguous blocks with commas', () => {
    const result = formatYearRanges(['2016', '2018', '2019']);
    expect(result).toBe('2016, 2018–2019');
  });

  it('ignores years not in the available set', () => {
    expect(formatYearRanges(['1900', '1901'])).toBe('All years');
  });
});

describe('scoreMessage', () => {
  it('maps percentage bands to the right headline', () => {
    expect(scoreMessage(100)).toBe('Douze points! Perfect score!');
    expect(scoreMessage(95)).toBe('Eurovision legend!');
    expect(scoreMessage(90)).toBe('Eurovision legend!');
    expect(scoreMessage(80)).toBe('Grand finalist!');
    expect(scoreMessage(75)).toBe('Grand finalist!');
    expect(scoreMessage(50)).toBe('Semi-final qualifier');
    expect(scoreMessage(25)).toBe('Semi-final qualifier');
    expect(scoreMessage(10)).toBe('Nul points... try again!');
    expect(scoreMessage(0)).toBe('Nul points... try again!');
  });
});

describe('typeBreakdown', () => {
  const question = (id: string, type: QuizQuestion['type']): QuizQuestion => ({
    id,
    type,
    year: '2023',
    prompt: 'q',
    options: [],
    correctOptionId: 'x',
    explanation: 'e',
  });

  const answer = (questionId: string, correct: boolean): QuizAnswer => ({
    questionId,
    selectedOptionId: 'x',
    correct,
  });

  it('aggregates correct/total per setup question group', () => {
    const questions = [
      question('q1', 'winner'),
      question('q2', 'televote'),
      question('q3', 'country'),
    ];
    const result = {
      questions,
      answers: [answer('q1', true), answer('q2', false), answer('q3', true)],
    } as QuizResult;

    const rows = typeBreakdown(result);

    // winner + televote both fold into the "Contest winners" group
    const winners = rows.find((r) => r.label === 'Contest winners');
    expect(winners).toEqual({ label: 'Contest winners', correct: 1, total: 2 });

    const country = rows.find((r) => r.label === 'Country of artist');
    expect(country).toEqual({ label: 'Country of artist', correct: 1, total: 1 });
  });

  it('orders rows by the canonical group list and omits empty groups', () => {
    const questions = [question('q1', 'country'), question('q2', 'winner')];
    const result = {
      questions,
      answers: [answer('q1', true), answer('q2', true)],
    } as QuizResult;

    const labels = typeBreakdown(result).map((r) => r.label);
    // "Country of artist" precedes "Contest winners" in QUESTION_GROUP_META
    expect(labels).toEqual(['Country of artist', 'Contest winners']);
  });

  it('counts an unanswered question as incorrect', () => {
    const result = {
      questions: [question('q1', 'country')],
      answers: [],
    } as unknown as QuizResult;

    expect(typeBreakdown(result)).toEqual([{ label: 'Country of artist', correct: 0, total: 1 }]);
  });
});
