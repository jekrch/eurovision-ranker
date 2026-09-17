import {
  faDownload,
  faLink,
  faRotateRight,
  faStopwatch,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { quizLabel, quizPrimaryBtn, quizSecondaryBtn, quizWell } from './quizStyles';
import { QuizResult } from '../../../data/quiz/quizTypes';
import { encodeQuizCode } from '../../../utilities/quiz/quizCode';
import { downloadQuizResultImage } from '../../../utilities/quiz/quizResultImage';
import {
  formatDuration,
  formatYearRanges,
  scoreMessage,
  typeBreakdown,
} from '../../../utilities/quiz/quizScoring';

interface QuizResultsProps {
  result: QuizResult;
  onPlayAgain: () => void;
  onNewQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, onPlayAgain, onNewQuiz }) => {
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
  const breakdown = typeBreakdown(result);

  // The ring and category bars mount empty and fill on the next frame, so the
  // score counts up into place instead of arriving already drawn.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const shownPct = filled ? pct : 0;
  const yearsLabel = formatYearRanges(result.config.years);

  // Same code → same questions for anyone who opens the link.
  const code = useMemo(() => encodeQuizCode(result.config, result.seed), [result]);
  const shareUrl = `${window.location.origin}/?quiz=${code}`;

  const copyChallengeLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Challenge link copied.');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  // The "By category" breakdown is the lowest-priority content: if the screen is too
  // short to fit everything, drop it rather than introduce a scrollbar in the middle.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Hide the breakdown the moment its presence would overflow the scroll area.
  // (When `showBreakdown` is false the content no longer overflows, so this no-ops.)
  // Intentionally runs every render to catch any layout change that introduces overflow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (showBreakdown && el.scrollHeight > el.clientHeight + 1) {
      setShowBreakdown(false);
    }
  });

  // The layout effect only sees sizes at render time. Anything that settles after the
  // first paint (fonts, the modal finishing its own entrance) is caught here instead,
  // by watching both the scroll area and the content inside it.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (el.scrollHeight > el.clientHeight + 1) setShowBreakdown(false);
    });
    observer.observe(el);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // On resize, optimistically try to show it again; the checks above re-hide it if
  // there still isn't room.
  useEffect(() => {
    const onResize = () => setShowBreakdown(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex flex-col min-h-0 flex-1 pt-2 pb-3 view-enter-animation">
      {/* static header: the result itself */}
      <div className="flex flex-col items-center gap-4 flex-shrink-0">
        <h2 className="text-[var(--er-text-primary)] text-xl font-semibold tracking-tight text-center">
          {scoreMessage(pct)}
        </h2>

        {/* score ring. overflow-visible so the arc's glow isn't clipped to the svg box */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--er-interactive-primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - shownPct / 100)}
              className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-150 motion-reduce:transition-none drop-shadow-[0_0_4px_var(--er-interactive-primary)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[var(--er-text-primary)] text-2xl font-bold tabular-nums tracking-tight">
              {result.score}/{result.total}
            </span>
            <span className="text-[var(--er-text-subtle)] text-xs font-semibold tabular-nums">
              {pct}%
            </span>
          </div>
        </div>

        {/* time and years as one quiet line; the score is already in the ring */}
        <div className="flex items-center justify-center gap-2.5 text-xs text-[var(--er-text-tertiary)] tabular-nums max-w-full">
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <FontAwesomeIcon icon={faStopwatch} className="text-[var(--er-text-subtle)]" />
            {formatDuration(result.elapsedMs)}
          </span>
          <span className="h-3 w-px bg-white/15 flex-shrink-0" aria-hidden="true" />
          <span className="flex items-center gap-1.5 min-w-0">
            <FontAwesomeIcon
              icon={faCalendar}
              className="text-[var(--er-text-subtle)] flex-shrink-0"
            />
            <span className="truncate" title={yearsLabel}>
              {yearsLabel}
            </span>
          </span>
        </div>
      </div>

      {/* middle: the breakdown, dropped entirely when there isn't room for it */}
      <div
        ref={scrollRef}
        className="flex flex-col justify-center flex-1 min-h-0 overflow-y-auto px-1 -mx-1 my-5"
      >
        <div ref={contentRef}>
          {showBreakdown && breakdown.length > 0 && (
            <div className={classNames(quizWell, 'w-full px-3.5 py-3')}>
              <div className={classNames(quizLabel, 'mb-2.5')}>By Category</div>
              <div className="flex flex-col gap-2">
                {breakdown.map((row) => {
                  const rowPct = row.total ? (row.correct / row.total) * 100 : 0;
                  return (
                    <div key={row.label} className="flex items-center gap-3 text-xs">
                      <span className="text-[var(--er-text-tertiary)] w-32 flex-shrink-0 truncate">
                        {row.label}
                      </span>
                      <div className="flex-grow h-1.5 rounded-full bg-black/25 ring-1 ring-inset ring-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--er-button-primary)] to-[var(--er-interactive-primary)] rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 motion-reduce:transition-none"
                          style={{ width: `${filled ? rowPct : 0}%` }}
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
        </div>
      </div>

      {/* static footer: share, then actions */}
      <div className="flex flex-col gap-5 flex-shrink-0">
        {/* challenge a friend: share the exact same quiz via a code/link */}
        <div className={classNames(quizWell, 'w-full p-3')}>
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className={quizLabel}>Challenge a Friend</span>
            <span className="text-[var(--er-text-subtle)] text-[0.7rem] truncate">
              Same questions, same order
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-grow min-w-0 truncate bg-black/25 ring-1 ring-inset ring-white/[0.08] rounded-lg px-3 py-2 text-[var(--er-text-secondary)] text-sm font-mono">
              {code}
            </code>
            <button
              type="button"
              onClick={copyChallengeLink}
              className={classNames(quizSecondaryBtn, 'flex-shrink-0 !py-2 px-3 text-sm')}
            >
              <FontAwesomeIcon icon={faLink} />
              Copy link
            </button>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => downloadQuizResultImage(result)}
            className={quizPrimaryBtn}
          >
            <FontAwesomeIcon icon={faDownload} />
            Download Result Image
          </button>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onPlayAgain}
              className={classNames(quizSecondaryBtn, 'flex-1')}
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Play Again
            </button>
            <button
              type="button"
              onClick={onNewQuiz}
              className={classNames(quizSecondaryBtn, 'flex-1')}
            >
              New Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
