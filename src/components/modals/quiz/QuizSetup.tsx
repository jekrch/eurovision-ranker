import { faCheck, faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';

import {
  quizChip,
  quizLabel,
  quizPrimaryBtn,
  quizSelected,
  quizTitle,
  quizWell,
} from './quizStyles';
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
  <div className={classNames(quizWell, 'flex w-full gap-0.5 p-0.5 !rounded-lg')}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={classNames(
          'flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150',
          value === o.value
            ? 'bg-[var(--er-interactive-primary)] bg-gradient-to-b from-white/[0.12] to-transparent text-white shadow-sm shadow-black/30 ring-1 ring-inset ring-white/15'
            : 'text-[var(--er-text-subtle)] hover:bg-white/[0.06] hover:text-[var(--er-text-secondary)]',
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
    <div className="flex flex-col gap-5 flex-1 min-h-0 view-enter-animation">
      <div className="-mt-3 pr-8 shrink-0">
        <h2 className={quizTitle}>Eurovision Quiz</h2>
        <p className="text-[var(--er-text-subtle)] text-xs mt-0.5 truncate">
          Test your contest knowledge across the years
        </p>
      </div>

      {/* Years */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <label className={classNames(quizLabel, 'flex items-center gap-2')}>
            Years
            <span className="normal-case tracking-normal font-medium tabular-nums text-[var(--er-text-tertiary)]">
              {years.length} selected
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
                className={classNames(
                  quizChip,
                  'text-[0.7rem] px-2.5 py-0.5 hover:bg-white/[0.1] hover:text-[var(--er-text-secondary)] transition-colors duration-150',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className={classNames(quizWell, 'flex-1 min-h-0 overflow-y-auto p-2')}>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUIZ_YEARS.map((y) => {
              const active = years.includes(y);
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => toggleYear(y)}
                  className={classNames(
                    'text-xs px-2 py-1 rounded-md font-medium tabular-nums text-center ring-1 ring-inset transition-colors duration-100',
                    active
                      ? 'bg-[var(--er-interactive-primary)] bg-gradient-to-b from-white/[0.12] to-transparent text-white ring-white/15 shadow-sm shadow-black/30'
                      : 'bg-white/[0.04] ring-white/[0.06] text-[var(--er-text-subtle)] hover:bg-white/[0.08] hover:text-[var(--er-text-secondary)]',
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
        {sortedSelected.length === 0 && (
          <p className="text-[var(--er-accent-error)] text-[0.7rem] mt-1.5 shrink-0">
            Select at least one year
          </p>
        )}
      </div>

      {/* Difficulty & length */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
        <div>
          <label className={classNames(quizLabel, 'block mb-2')}>Difficulty</label>
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
          <label className={classNames(quizLabel, 'block mb-2')}>Length</label>
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
        <label className={classNames(quizLabel, 'block mb-2 shrink-0')}>Question types</label>
        <div className={classNames(quizWell, 'flex-1 min-h-0 overflow-y-auto p-2')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUESTION_GROUP_META.map((meta) => {
              const active = meta.types.every((t) => types.includes(t));
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => toggleGroup(meta.types)}
                  className={classNames(
                    'text-left px-3 py-2 rounded-lg ring-1 ring-inset transition-colors duration-100',
                    active
                      ? quizSelected
                      : 'bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.07]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={classNames(
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[0.55rem] text-white ring-1 ring-inset transition-colors duration-100',
                        active
                          ? 'bg-[var(--er-interactive-primary)] ring-white/15'
                          : 'bg-black/30 ring-white/10',
                      )}
                    >
                      {active && <FontAwesomeIcon icon={faCheck} />}
                    </span>
                    <span
                      className={classNames(
                        'text-sm font-medium',
                        active ? 'text-[var(--er-text-primary)]' : 'text-[var(--er-text-tertiary)]',
                      )}
                    >
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
          <p className="text-[var(--er-accent-error)] text-[0.7rem] mt-1.5 shrink-0">
            Select at least one question type
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className={classNames(
          'shrink-0 mt-1',
          canStart
            ? quizPrimaryBtn
            : 'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] text-[var(--er-text-subtle)] cursor-not-allowed',
        )}
      >
        <FontAwesomeIcon icon={faPlay} />
        Start Quiz
      </button>
    </div>
  );
};

export default QuizSetup;
