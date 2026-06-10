import {
  faPlay,
  faCircleQuestion,
  faCalendar,
  faGaugeHigh,
  faListOl,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo } from 'react';

import {
  DIFFICULTY_META,
  LENGTH_META,
  QUESTION_GROUP_META,
  QUESTION_TYPE_META,
  QuizConfig,
} from '../../../data/quiz/quizTypes';

interface QuizPreviewProps {
  config: QuizConfig;
  onBegin: () => void;
}

/**
 * Shown when a quiz is opened from a shared ?quiz=… link. Instead of dropping the
 * player straight into the first question, we surface the quiz's parameters and let
 * them start on their own terms (so the timer doesn't begin before they're ready).
 */
const QuizPreview: React.FC<QuizPreviewProps> = ({ config, onBegin }) => {
  // Prefer the setup-screen group labels (e.g. "Contest winners"), falling back to
  // individual type labels for any leftover types not covered by a complete group.
  const typeLabels = useMemo(() => {
    const selected = new Set(config.questionTypes);
    const labels: string[] = [];
    const covered = new Set<string>();
    for (const group of QUESTION_GROUP_META) {
      if (group.types.every((t) => selected.has(t))) {
        labels.push(group.label);
        group.types.forEach((t) => covered.add(t));
      }
    }
    for (const t of config.questionTypes) {
      if (!covered.has(t)) {
        labels.push(QUESTION_TYPE_META.find((m) => m.type === t)?.label ?? t);
      }
    }
    return labels;
  }, [config.questionTypes]);

  const yearSummary = useMemo(() => {
    const sorted = [...config.years].sort();
    const count = `${sorted.length} ${sorted.length === 1 ? 'year' : 'years'}`;
    if (sorted.length <= 1) return sorted[0] ?? count;
    return `${count} · ${sorted[0]}–${sorted[sorted.length - 1]}`;
  }, [config.years]);

  const rows = [
    { icon: faCalendar, label: 'Years', value: yearSummary },
    { icon: faGaugeHigh, label: 'Difficulty', value: DIFFICULTY_META[config.difficulty].label },
    {
      icon: faListOl,
      label: 'Length',
      value: `${LENGTH_META[config.length].label} · ${LENGTH_META[config.length].count} questions`,
    },
  ];

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="text-center">
        <div className="text-[var(--er-text-secondary)] text-2xl font-bold flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faCircleQuestion} className="text-[var(--r-accent-blue)]" />
          Eurovision Quiz
        </div>
        <p className="text-[var(--er-text-subtle)] text-xs mt-1">
          You've been challenged to this quiz. Here's what's in it
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-2.5 ring-1 ring-white/5"
          >
            <FontAwesomeIcon
              icon={row.icon}
              className="text-[var(--er-text-subtle)] w-4 flex-shrink-0"
            />
            <span className="text-[var(--er-text-subtle)] text-xs font-semibold w-20 flex-shrink-0">
              {row.label}
            </span>
            <span className="text-[var(--er-text-tertiary)] text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[var(--er-text-subtle)] text-xs font-semibold mb-2">Question types</p>
        <div className="flex flex-wrap gap-1.5">
          {typeLabels.map((label) => (
            <span
              key={label}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--er-surface-tertiary)] text-[var(--er-text-tertiary)] ring-1 ring-white/5"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBegin}
        className="mt-1 w-full py-3 rounded-lg font-bold text-white bg-[var(--er-interactive-primary)] hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg transition-all duration-150"
      >
        <FontAwesomeIcon icon={faPlay} />
        Begin Quiz
      </button>
    </div>
  );
};

export default QuizPreview;
