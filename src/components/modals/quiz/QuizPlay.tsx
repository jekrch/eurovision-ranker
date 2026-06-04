import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faArrowRight, faStopwatch, faPlay } from '@fortawesome/free-solid-svg-icons';
import { LazyLoadedFlag } from '../../LazyFlag';
import { QuizAnswer, QuizOption, QuizQuestion } from '../../../data/quiz/quizTypes';
import { formatDuration } from '../../../utilities/quiz/quizScoring';
import { getYoutubeThumbnail } from '../../../utilities/YoutubeUtil';

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
            className="w-24 h-[3.375rem] object-cover rounded-md shadow ring-1 ring-white/10"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-black/55 flex items-center justify-center">
              <FontAwesomeIcon icon={faPlay} className="text-white text-xs ml-0.5" />
            </span>
          </span>
        </div>
      ) : (
        option.countryKey && (
          <LazyLoadedFlag code={option.countryKey} className="!w-12 !h-8 rounded-sm object-cover flex-shrink-0 shadow" />
        )
      )}
      <span className="min-w-0">
        <span className="block text-[var(--er-text-tertiary)] text-sm font-semibold truncate">{caption}</span>
        {sub && <span className="block text-[var(--er-text-subtle)] text-xs truncate">{sub}</span>}
      </span>
    </div>
  );

  if (!option.youtube) {
    return <div className="bg-black/20 rounded-lg p-2.5">{inner}</div>;
  }

  return (
    <a
      href={option.youtube}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-black/20 hover:bg-black/30 rounded-lg p-2.5 transition-colors"
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
    setAnswers((prev) => [...prev, { questionId: question.id, selectedOptionId: optionId, correct }]);
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
        <span className="text-[var(--r-accent-blue)] font-bold">{promptHighlight}</span>
        {after}
      </>
    );
  };

  return (
    // Fixed height so the modal never resizes as the answer is revealed; the
    // options list gives up space (and scrolls if needed) to the feedback area.
    <div className="flex flex-col h-[min(31rem,78vh)]">
      {/* progress + timer */}
      <div className="flex items-center justify-between text-xs text-[var(--er-text-subtle)] font-semibold flex-shrink-0 mr-8">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-[var(--er-text-tertiary)]">Score {score}</span>
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faStopwatch} />
            {formatDuration(elapsed)}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/30 overflow-hidden mt-2 flex-shrink-0">
        <div
          className="h-full bg-[var(--er-interactive-primary)] transition-all duration-300"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {/* prompt */}
      <div className="min-h-[3.5rem] flex items-center flex-shrink-0 mt-3">
        <h3 className="text-[var(--er-text-secondary)] text-lg font-semibold leading-snug">{renderPrompt()}</h3>
      </div>

      {/* options (scrolls within the fixed-height column) */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto min-h-0 px-1 -mx-1 py-1">
        {displayOptions.map((opt) => {
          const isCorrect = opt.id === question.correctOptionId;
          const isSelected = opt.id === selectedId;
          let stateClass = 'bg-[var(--er-surface-tertiary)] ring-white/10 hover:bg-[var(--er-surface-light)]';
          if (answered) {
            if (isCorrect) {
              stateClass = 'bg-green-500/20 ring-green-400';
            } else if (isSelected) {
              stateClass = 'bg-red-500/20 ring-red-400';
            } else {
              stateClass = 'bg-[var(--er-surface-tertiary)] ring-white/5 opacity-60';
            }
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(opt.id)}
              className={classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg ring-1 text-left transition-all duration-150 flex-shrink-0',
                stateClass,
                !answered && 'active:scale-[0.99] cursor-pointer'
              )}
            >
              {opt.countryKey && (
                <LazyLoadedFlag
                  code={opt.countryKey}
                  className="!w-8 !h-6 rounded-sm object-cover flex-shrink-0 shadow"
                />
              )}
              <span className="flex-grow min-w-0">
                <span className="block text-[var(--er-text-tertiary)] font-medium truncate">{opt.label}</span>
                {opt.sublabel && (
                  <span className="block text-[var(--er-text-subtle)] text-xs truncate">{opt.sublabel}</span>
                )}
              </span>
              {answered && isCorrect && (
                <FontAwesomeIcon icon={faCheck} className="text-green-400 flex-shrink-0" />
              )}
              {answered && isSelected && !isCorrect && (
                <FontAwesomeIcon icon={faXmark} className="text-red-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* feedback + next (fixed at the bottom of the column) */}
      <div className="flex-shrink-0 pt-3">
        {answered ? (
          <div className="flex flex-col gap-2">
            {correctOption && <RevealCard option={correctOption} />}
            <p className="text-[var(--er-text-subtle)] text-xs leading-snug line-clamp-2">{question.explanation}</p>
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 rounded-lg font-bold text-white bg-[var(--er-interactive-primary)] hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
            >
              {isLast ? 'See Results' : 'Next Question'}
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        ) : (
          <p className="text-center text-[var(--er-text-subtle)] text-xs py-3">Select an answer</p>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;
