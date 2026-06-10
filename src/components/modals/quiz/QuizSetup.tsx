import { faPlay, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';

import {
  DIFFICULTY_META,
  LENGTH_META,
  QUESTION_GROUP_META,
  QuizConfig,
  QuizDifficulty,
  QuizLength,
  QuizQuestionType,
} from '../../../data/quiz/quizTypes';
import { QUIZ_YEARS } from '../../../utilities/quiz/quizGenerator';

interface QuizSetupProps {
  onStart: (config: QuizConfig) => void;
}

const defaultYears = QUIZ_YEARS.slice(0, 5); // last 5 contests

const Segmented = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <div className="flex w-full rounded-lg overflow-hidden ring-1 ring-white/10">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={classNames(
          'flex-1 py-2 text-xs font-semibold transition-colors duration-150',
          value === o.value
            ? 'bg-[var(--er-interactive-primary)] text-white'
            : 'bg-[var(--er-surface-tertiary)] text-[var(--er-text-tertiary)] hover:bg-[var(--er-surface-light)]',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const QuizSetup: React.FC<QuizSetupProps> = ({ onStart }) => {
  const [years, setYears] = useState<string[]>(defaultYears);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [length, setLength] = useState<QuizLength>('medium');
  const [types, setTypes] = useState<QuizQuestionType[]>(
    QUESTION_GROUP_META.filter((g) => g.defaultOn).flatMap((g) => g.types),
  );

  const toggleYear = (y: string) =>
    setYears((prev) => (prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]));

  // A group is on when all of its underlying types are selected; toggling flips
  // every type in the group together so the "Contest winners" bundle stays atomic.
  const toggleGroup = (groupTypes: QuizQuestionType[]) =>
    setTypes((prev) => {
      const active = groupTypes.every((t) => prev.includes(t));
      return active
        ? prev.filter((t) => !groupTypes.includes(t))
        : [...new Set([...prev, ...groupTypes])];
    });

  const decadePreset = (predicate: (y: number) => boolean) =>
    setYears(QUIZ_YEARS.filter((y) => predicate(parseInt(y, 10))));

  const sortedSelected = useMemo(() => [...years].sort(), [years]);

  const canStart = types.length > 0 && years.length > 0;

  const handleStart = () => {
    if (!canStart) return;
    onStart({ years, difficulty, questionTypes: types, length });
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="text-center shrink-0">
        <div className="text-[var(--er-text-secondary)] text-2xl font-bold flex items-center justify-center gap-2">
          <FontAwesomeIcon
            size="sm"
            icon={faCircleQuestion}
            className="text-[var(--r-accent-blue)] mt-[4px]"
          />
          Eurovision Quiz
        </div>
        <p className="text-[var(--er-text-subtle)] text-xs mt-1">
          Test your contest knowledge across the years
        </p>
      </div>

      {/* Years */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <label className="text-[var(--er-text-tertiary)] text-sm font-semibold">
            Years{' '}
            <span className="text-[var(--er-text-subtle)] font-normal">
              ({years.length} selected)
            </span>
          </label>
          <div className="flex gap-1 flex-wrap justify-end">
            {[
              { label: 'Last 10', fn: () => setYears(QUIZ_YEARS.slice(0, 10)) },
              { label: '2020s', fn: () => decadePreset((y) => y >= 2020) },
              // { label: '2010s', fn: () => decadePreset((y) => y >= 2010 && y < 2020) },
              // { label: '2000s', fn: () => decadePreset((y) => y >= 2000 && y < 2010) },
              { label: 'All', fn: () => setYears(QUIZ_YEARS) },
              { label: 'Clear', fn: () => setYears([]) },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.fn}
                className="text-[0.7rem] px-2 py-0.5 rounded-full bg-[var(--er-surface-tertiary)] text-[var(--er-text-subtle)] hover:bg-[var(--er-surface-light)] hover:text-[var(--er-text-tertiary)]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg bg-black/20 p-2 ring-1 ring-white/5">
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUIZ_YEARS.map((y) => {
              const active = years.includes(y);
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => toggleYear(y)}
                  className={classNames(
                    'text-xs px-2 py-1 rounded-md font-medium tabular-nums text-center transition-colors duration-100',
                    active
                      ? 'bg-[var(--er-interactive-primary)] text-white'
                      : 'bg-[var(--er-surface-tertiary)] text-[var(--er-text-subtle)] hover:bg-[var(--er-surface-light)]',
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
        {sortedSelected.length === 0 && (
          <p className="text-[var(--er-error,#f87171)] text-[0.7rem] mt-1 shrink-0">
            Select at least one year
          </p>
        )}
      </div>

      {/* Difficulty & length */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
        <div>
          <label className="text-[var(--er-text-tertiary)] text-sm font-semibold block mb-2">
            Difficulty
          </label>
          <Segmented
            value={difficulty}
            onChange={setDifficulty}
            options={(Object.keys(DIFFICULTY_META) as QuizDifficulty[]).map((d) => ({
              value: d,
              label: DIFFICULTY_META[d].label,
            }))}
          />
        </div>
        <div>
          <label className="text-[var(--er-text-tertiary)] text-sm font-semibold block mb-2">
            Length
          </label>
          <Segmented
            value={length}
            onChange={setLength}
            options={(Object.keys(LENGTH_META) as QuizLength[]).map((l) => ({
              value: l,
              label: `${LENGTH_META[l].label} (${LENGTH_META[l].count})`,
            }))}
          />
        </div>
      </div>

      {/* Question types */}
      <div className="flex flex-col min-h-0 flex-1">
        <label className="text-[var(--er-text-tertiary)] text-sm font-semibold block mb-2 shrink-0">
          Question types
        </label>
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg bg-black/20 p-2 ring-1 ring-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUESTION_GROUP_META.map((meta) => {
              const active = meta.types.every((t) => types.includes(t));
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => toggleGroup(meta.types)}
                  className={classNames(
                    'text-left px-3 py-2 rounded-lg ring-1 transition-colors duration-100',
                    active
                      ? 'bg-[var(--er-interactive-primary)]/15 ring-[var(--er-interactive-primary)]'
                      : 'bg-[var(--er-surface-tertiary)] ring-transparent hover:bg-[var(--er-surface-light)]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={classNames(
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[0.6rem] text-white',
                        active ? 'bg-[var(--er-interactive-primary)]' : 'bg-black/30',
                      )}
                    >
                      {active && '✓'}
                    </span>
                    <span className="text-[var(--er-text-tertiary)] text-sm font-medium">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[var(--er-text-subtle)] text-[0.7rem] mt-0.5 ml-6">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        {types.length === 0 && (
          <p className="text-[var(--er-error,#f87171)] text-[0.7rem] mt-1 shrink-0">
            Select at least one question type
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className={classNames(
          'shrink-0 mt-1 w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all duration-150',
          canStart
            ? 'bg-[var(--er-interactive-primary)] hover:brightness-110 active:scale-[0.99] shadow-lg'
            : 'bg-[var(--er-surface-tertiary)] text-[var(--er-text-subtle)] cursor-not-allowed',
        )}
      >
        <FontAwesomeIcon icon={faPlay} />
        Start Quiz
      </button>
    </div>
  );
};

export default QuizSetup;
