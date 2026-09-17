import {
  faCheck,
  faXmark,
  faArrowRight,
  faStopwatch,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { quizCorrect, quizIncorrect, quizPrimaryBtn, quizWell } from './quizStyles';
import { QuizAnswer, QuizOption, QuizQuestion } from '../../../data/quiz/quizTypes';
import { staggerStyle } from '../../../utilities/animationUtil';
import { formatDuration } from '../../../utilities/quiz/quizScoring';
import { getYoutubeThumbnail } from '../../../utilities/YoutubeUtil';
import { LazyLoadedFlag } from '../../LazyFlag';

interface QuizPlayProps {
  questions: QuizQuestion[];
  onFinish: (answers: QuizAnswer[], elapsedMs: number) => void;
}

const RevealCard: React.FC<{ option: QuizOption }> = ({ option }) => {
  const thumb = getYoutubeThumbnail(option.youtube);
  const caption = option.song ? `"${option.song}"` : option.label;
  const sub = [option.artist, option.countryName].filter(Boolean).join(' · ');

  const inner = (
    <div className="flex items-center gap-3">
      {thumb ? (
        <div className="relative flex-shrink-0">
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="w-24 h-[3.375rem] object-cover rounded-lg shadow-sm shadow-black/40 ring-1 ring-white/10"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-black/55 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="text-white text-xs ml-0.5" />
            </span>
          </span>
        </div>
      ) : (
        option.countryKey && (
          <LazyLoadedFlag
            code={option.countryKey}
            className="!w-12 !h-8 rounded-[3px] object-cover flex-shrink-0 ring-1 ring-black/20 shadow-sm shadow-black/30"
          />
        )
      )}
      <span className="min-w-0">
        <span className="block text-[var(--er-text-primary)] text-sm font-semibold truncate">
          {caption}
        </span>
        {sub && <span className="block text-[var(--er-text-subtle)] text-xs truncate">{sub}</span>}
      </span>
    </div>
  );

  if (!option.youtube) {
    return <div className={classNames(quizWell, 'p-2.5')}>{inner}</div>;
  }

  return (
    <a
      href={option.youtube}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames(
        quizWell,
        'block p-2.5 hover:bg-black/30 transition-colors duration-150',
      )}
    >
      {inner}
    </a>
  );
};

const QuizPlay: React.FC<QuizPlayProps> = ({ questions, onFinish }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // live timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => clearInterval(t);
  }, []);

  const question = questions[index];
  const answered = selectedId !== null;
  const isLast = index === questions.length - 1;
  const score = answers.filter((a) => a.correct).length;
  const correctOption = question.options.find((o) => o.id === question.correctOptionId);

  // The question + option set is fixed by the quiz code, but the on-screen order
  // is randomized per player (with real Math.random, not the seed) so the answer
  // doesn't sit in the same slot for everyone who shares a code.
  const displayOptions = useMemo(() => {
    const a = [...question.options];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (optionId: string) => {
    if (answered) return;
    const correct = optionId === question.correctOptionId;
    setSelectedId(optionId);
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, selectedOptionId: optionId, correct },
    ]);
  };

  const handleNext = () => {
    if (isLast) {
      onFinish(answers, Date.now() - startRef.current);
      return;
    }
    setIndex((i) => i + 1);
    setSelectedId(null);
  };

  // split the prompt around the highlighted phrase for emphasis
  const renderPrompt = () => {
    const { prompt, promptHighlight } = question;
    if (!promptHighlight || !prompt.includes(promptHighlight)) {
      return <>{prompt}</>;
    }
    const [before, ...rest] = prompt.split(promptHighlight);
    const after = rest.join(promptHighlight);
    return (
      <>
        {before}
        <span className="text-[var(--er-interactive-primary)] font-bold">{promptHighlight}</span>
        {after}
      </>
    );
  };

  return (
    // Fixed height so the modal never resizes as the answer is revealed; the
    // options list gives up space (and scrolls if needed) to the feedback area.
    <div className="flex flex-col h-[min(31rem,78vh)]">
      {/* progress + timer */}
      <div className="flex items-center justify-between text-xs text-[var(--er-text-subtle)] font-medium tabular-nums flex-shrink-0 mr-8">
        <span>
          Question{' '}
          <span className="font-semibold text-[var(--er-text-secondary)]">{index + 1}</span> /{' '}
          {questions.length}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10 px-2 py-0.5">
            Score <span className="font-semibold text-[var(--er-text-primary)]">{score}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10 px-2 py-0.5">
            <FontAwesomeIcon icon={faStopwatch} className="text-[0.65rem]" />
            {formatDuration(elapsed)}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/25 ring-1 ring-inset ring-white/5 overflow-hidden mt-2.5 flex-shrink-0">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--er-button-primary)] to-[var(--er-interactive-primary)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {/* prompt */}
      <div className="min-h-[3.5rem] flex items-center flex-shrink-0 mt-3">
        {/* keyed by question so each new question replays its entrance */}
        <h3
          key={question.id}
          className={classNames(
            'text-[var(--er-text-primary)] text-lg font-semibold tracking-tight leading-snug',
            // the first question arrives with the screen itself, so only later ones travel
            index > 0 && 'view-enter-from-right-animation',
          )}
        >
          {renderPrompt()}
        </h3>
      </div>

      {/* options (scrolls within the fixed-height column) */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto overflow-x-hidden min-h-0 px-1 -mx-1 py-1">
        {displayOptions.map((opt, optionIndex) => {
          const isCorrect = opt.id === question.correctOptionId;
          const isSelected = opt.id === selectedId;
          let stateClass =
            'bg-white/[0.04] ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.08] hover:ring-white/15';
          if (answered) {
            if (isCorrect) {
              stateClass = quizCorrect;
            } else if (isSelected) {
              stateClass = quizIncorrect;
            } else {
              stateClass = 'bg-white/[0.02] ring-white/[0.05] opacity-50';
            }
          }
          return (
            <button
              key={`${question.id}-${opt.id}`}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(opt.id)}
              style={staggerStyle(optionIndex)}
              className={classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 ring-inset text-left transition-all duration-150 flex-shrink-0 quiz-option-enter-animation',
                stateClass,
                !answered && 'active:scale-[0.99] cursor-pointer motion-reduce:transform-none',
              )}
            >
              {opt.countryKey && (
                <LazyLoadedFlag
                  code={opt.countryKey}
                  className="!w-8 !h-6 rounded-[3px] object-cover flex-shrink-0 ring-1 ring-black/20 shadow-sm shadow-black/30"
                />
              )}
              <span className="flex-grow min-w-0">
                <span className="block text-[var(--er-text-primary)] font-medium truncate">
                  {opt.label}
                </span>
                {opt.sublabel && (
                  <span className="block text-[var(--er-text-subtle)] text-xs truncate">
                    {opt.sublabel}
                  </span>
                )}
              </span>
              {answered && isCorrect && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--er-accent-success)_20%,transparent)] text-[var(--er-accent-success)] text-xs">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--er-accent-error)_20%,transparent)] text-[var(--er-accent-error)] text-xs">
                  <FontAwesomeIcon icon={faXmark} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* feedback + next (fixed at the bottom of the column) */}
      <div className="flex-shrink-0 pt-3">
        {answered ? (
          <div className="flex flex-col gap-2 tab-panel-enter-animation">
            {correctOption && <RevealCard option={correctOption} />}
            <p className="text-[var(--er-text-subtle)] text-xs leading-snug line-clamp-2">
              {question.explanation}
            </p>
            <button type="button" onClick={handleNext} className={quizPrimaryBtn}>
              {isLast ? 'See Results' : 'Next Question'}
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        ) : (
          <p className="text-center text-[var(--er-text-subtle)] text-xs py-3 tab-panel-enter-animation">
            Select an answer
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;
