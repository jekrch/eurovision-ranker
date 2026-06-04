import React, { useMemo } from 'react';
import classNames from 'classnames';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faLink, faRotateRight, faStopwatch, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { QuizResult } from '../../../data/quiz/quizTypes';
import { formatDuration, formatYearRanges, scoreMessage, typeBreakdown } from '../../../utilities/quiz/quizScoring';
import { downloadQuizResultImage } from '../../../utilities/quiz/quizResultImage';
import { encodeQuizCode } from '../../../utilities/quiz/quizCode';

interface QuizResultsProps {
  result: QuizResult;
  onPlayAgain: () => void;
  onNewQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, onPlayAgain, onNewQuiz }) => {
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
  const breakdown = typeBreakdown(result);
  const yearsLabel = formatYearRanges(result.config.years);

  // Same code → same questions for anyone who opens the link.
  const code = useMemo(() => encodeQuizCode(result.config, result.seed), [result]);
  const shareUrl = `${window.location.origin}/?quiz=${code}`;

  const copyChallengeLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Challenge link copied — same quiz for whoever opens it.');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-center">
        <FontAwesomeIcon icon={faTrophy} className="text-[var(--er-interactive-primary)] text-3xl mb-2" />
        <h2 className="text-[var(--er-text-secondary)] text-2xl font-bold">{scoreMessage(pct)}</h2>
      </div>

      {/* score ring */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--er-interactive-primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[var(--er-text-primary)] text-3xl font-bold">
            {result.score}/{result.total}
          </span>
          <span className="text-[var(--er-text-subtle)] text-sm font-semibold">{pct}%</span>
        </div>
      </div>

      {/* stat pills */}
      <div className="flex items-center justify-center gap-3 text-center flex-wrap">
        <div className="bg-[var(--er-surface-tertiary)] rounded-lg px-4 py-2">
          <div className="text-[var(--er-text-subtle)] text-[0.65rem] font-semibold tracking-wide">TIME</div>
          <div className="text-[var(--er-text-tertiary)] font-bold flex items-center gap-1.5 justify-center">
            <FontAwesomeIcon icon={faStopwatch} className="text-xs" />
            {formatDuration(result.elapsedMs)}
          </div>
        </div>
        <div className="bg-[var(--er-surface-tertiary)] rounded-lg px-4 py-2">
          <div className="text-[var(--er-text-subtle)] text-[0.65rem] font-semibold tracking-wide">CORRECT</div>
          <div className="text-[var(--er-text-tertiary)] font-bold">
            {result.score} of {result.total}
          </div>
        </div>
        <div className="bg-[var(--er-surface-tertiary)] rounded-lg px-4 py-2 max-w-[12rem]">
          <div className="text-[var(--er-text-subtle)] text-[0.65rem] font-semibold tracking-wide">YEARS</div>
          <div className="text-[var(--er-text-tertiary)] font-bold truncate" title={yearsLabel}>
            {yearsLabel}
          </div>
        </div>
      </div>

      {/* per-category breakdown */}
      {breakdown.length > 0 && (
        <div className="w-full bg-black/20 rounded-lg p-3">
          <div className="text-[var(--er-text-subtle)] text-[0.65rem] font-semibold tracking-wide mb-2">
            BY CATEGORY
          </div>
          <div className="flex flex-col gap-2">
            {breakdown.map((row) => {
              const rowPct = row.total ? (row.correct / row.total) * 100 : 0;
              return (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--er-text-tertiary)] w-28 flex-shrink-0 truncate">{row.label}</span>
                  <div className="flex-grow h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[var(--er-interactive-primary)] rounded-full transition-all duration-500"
                      style={{ width: `${rowPct}%` }}
                    />
                  </div>
                  <span className="text-[var(--er-text-subtle)] w-9 text-right flex-shrink-0 tabular-nums">
                    {row.correct}/{row.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* challenge a friend — share the exact same quiz via a code/link */}
      <div className="w-full bg-black/20 rounded-lg p-3 ring-1 ring-white/5">
        <div className="text-[var(--er-text-subtle)] text-[0.65rem] font-semibold tracking-wide mb-2">
          CHALLENGE A FRIEND
        </div>
        <p className="text-[var(--er-text-subtle)] text-[0.7rem] leading-snug mb-2">
          Anyone who opens this link gets the exact same questions.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-grow min-w-0 truncate bg-[var(--er-surface-tertiary)] rounded-md px-3 py-2 text-[var(--er-text-tertiary)] text-sm font-mono">
            {code}
          </code>
          <button
            type="button"
            onClick={copyChallengeLink}
            className="flex-shrink-0 py-2 px-3 rounded-md font-semibold text-sm bg-[var(--er-interactive-primary)] text-white hover:brightness-110 active:scale-[0.98] flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faLink} />
            Copy link
          </button>
        </div>
      </div>

      {/* actions */}
      <div className="w-full flex flex-col gap-2 mt-1">
        <button
          type="button"
          onClick={() => downloadQuizResultImage(result)}
          className="w-full py-3 rounded-lg font-bold text-white bg-[var(--er-interactive-primary)] hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
        >
          <FontAwesomeIcon icon={faDownload} />
          Download Result Image
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className={classNames(
              'flex-1 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2',
              'bg-[var(--er-surface-tertiary)] text-[var(--er-text-tertiary)] hover:bg-[var(--er-surface-light)]'
            )}
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Play Again
          </button>
          <button
            type="button"
            onClick={onNewQuiz}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-[var(--er-surface-tertiary)] text-[var(--er-text-tertiary)] hover:bg-[var(--er-surface-light)]"
          >
            New Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
