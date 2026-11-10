import classNames from 'classnames';
import React, { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { IconType } from 'react-icons';
import { FaChartBar, FaQuestionCircle, FaSort, FaTv } from 'react-icons/fa';

import { modalPanel } from './modalStyles';
import escAsiaHeart from '../../assets/promos/esc-asia-heart.webp';
import { ContestId } from '../../data/Contests';
import { useAppDispatch } from '../../hooks/stateHooks';
import { setContest, setWelcomeOverlayIsOpen } from '../../redux/rootSlice';
import { AppDispatch } from '../../redux/store';
import '../../themes.css';
import { HeartIcon } from '../HeartIcon';
import IconButton from '../IconButton';

interface WelcomeOverlayProps {
  exiting: boolean;
  handleGetStarted: () => void;
  handleTakeTour: () => void;
}

/**
 * What the app can do beyond ranking. Each row fades in behind the one above it.
 * `icon` is either a react-icon or an image URL. `highlight` picks out a word in `text`
 * to colour and shimmer. `contest` adds a button that closes the modal on that contest.
 */
const FEATURES: {
  icon: IconType | string;
  text: string;
  highlight?: string;
  contest?: ContestId;
}[] = [
  { icon: escAsiaHeart, text: 'Rank ESC Asia 2026', highlight: 'Asia', contest: 'asia' },
  { icon: FaSort, text: 'Use a sorter to build your ranking' },
  { icon: FaTv, text: 'Create YouTube playlists' },
  { icon: FaChartBar, text: 'Explore past voting records' },
  { icon: FaQuestionCircle, text: 'Test your knowledge with a quiz' },
];

/**
 * Footer button sizing. Tighter than modalActionBtn so the pair sits under the
 * feature list instead of competing with it. Marked important for the same
 * reason modalActionBtn is: IconButton's own padding and radius win otherwise.
 */
const welcomeBtn = classNames(
  'rounded-md! px-3.5! py-2! font-medium! leading-none transition-colors duration-150',
  'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40',
);

/**
 * An overlay modal that is displayed when first loading the site if no ranking is
 * encoded in the URL yet. The goal here is to provide some initial info to the user
 * and provide them with the option to take the app tour
 */
const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  handleGetStarted,
  handleTakeTour,
  exiting,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  function getStarted() {
    if (closingRef.current) return;
    closingRef.current = true;
    dispatch(setWelcomeOverlayIsOpen(false));
    handleGetStarted();
  }

  // switching contest is all the header's contest picker does too; the URL sync
  // loads the new contest's entries while the card plays its exit
  function startWithContest(contest: ContestId) {
    if (closingRef.current) return;
    dispatch(setContest(contest));
    getStarted();
  }

  // read through a ref so the key listener below always calls the latest handler
  const getStartedRef = useRef(getStarted);
  getStartedRef.current = getStarted;

  // before paint, so nothing that hides behind the overlay flashes on first render
  useLayoutEffect(() => {
    dispatch(setWelcomeOverlayIsOpen(true));
  }, [dispatch]);

  // focus lands on "Get started", Escape dismisses like a click outside does,
  // and Tab cycles through the card's buttons instead of reaching the page behind
  useEffect(() => {
    const buttons = () => Array.from(overlayContentRef.current?.querySelectorAll('button') ?? []);

    buttons().at(-1)?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        getStartedRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = buttons();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = overlayContentRef.current?.contains(active) ?? false;

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClickOutside = (event: React.MouseEvent) => {
    if (overlayContentRef.current && !overlayContentRef.current.contains(event.target as Node)) {
      getStarted();
    }
  };

  const backdropOpacity = exiting ? 'opacity-0' : 'opacity-20';

  return (
    <div
      className="z-1000 w-full h-full fixed top-0 left-0 flex items-center justify-center"
      onClick={handleClickOutside}
    >
      <div
        className={classNames('overlay-bg transition-opacity duration-500', backdropOpacity)}
      ></div>
      <div
        className={classNames(
          'overlay-bg overlay-bg2 transition-opacity duration-500',
          backdropOpacity,
        )}
      ></div>
      <div
        className={classNames(
          'overlay-bg overlay-bg3 transition-opacity duration-500',
          backdropOpacity,
        )}
      ></div>

      <div
        ref={overlayContentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={classNames(
          'overlay welcome-card relative z-10 mx-5 w-full max-w-[19.5em] max-h-[calc(100%-3em)]',
          'flex flex-col px-6 py-6 gradient-background-modal text-(--er-text-tertiary)',
          modalPanel,
        )}
      >
        <div className="text-center">
          <h2 id={titleId} className="text-xl font-bold tracking-tight leading-tight">
            <span className="gradient-text">Eurovision Ranker</span>
            <span aria-hidden="true">
              <HeartIcon className="inline align-middle ml-[0.3em] mb-1 w-5 h-5 pulse-on-load my-heart-icon" />
            </span>
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-snug">
            Make your own ranking of any Eurovision contest since 1956.
          </p>
        </div>

        <div className="mt-5 flex-1 overflow-auto scrollbar-gutter-stable">
          <ul className="list-none space-y-2.5 text-sm">
            {FEATURES.map(({ icon: Icon, text, highlight, contest }, index) => (
              <li
                key={text}
                className="welcome-feature flex items-center"
                style={{ animationDelay: `${120 + index * 55}ms` }}
              >
                <span className="mr-3 flex w-7 flex-none justify-center">
                  {typeof Icon === 'string' ? (
                    <img src={Icon} alt="" width={28} height={28} className="-my-1.5 h-7 w-7" />
                  ) : (
                    <Icon
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-(--er-interactive-primary)"
                    />
                  )}
                </span>
                <span className={classNames('leading-snug', contest && 'whitespace-nowrap')}>
                  {highlight && text.includes(highlight) ? (
                    <>
                      {text.slice(0, text.indexOf(highlight))}
                      <span className="welcome-shimmer font-semibold">{highlight}</span>
                      {text.slice(text.indexOf(highlight) + highlight.length)}
                    </>
                  ) : (
                    text
                  )}
                </span>
                {contest && (
                  <button
                    type="button"
                    aria-label={text}
                    onClick={() => startWithContest(contest)}
                    className={classNames(
                      'ml-auto flex-none rounded-md px-2 py-1 text-xs font-medium leading-none',
                      'ring-1 ring-inset ring-white/15 hover:bg-white/6',
                      'text-(--er-text-secondary) hover:text-(--er-text-primary)',
                      'transition-colors duration-150 focus:outline-hidden focus-visible:ring-white/40',
                    )}
                  >
                    Start
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex gap-2">
          <IconButton
            className={classNames(
              welcomeBtn,
              'bg-transparent! hover:bg-white/6! ring-1 ring-inset ring-white/15',
              'text-(--er-text-secondary)! hover:text-(--er-text-primary)!',
            )}
            title="Take the tour"
            onClick={handleTakeTour}
          />
          <IconButton
            className={classNames(welcomeBtn, 'flex-1 font-semibold!')}
            title="Get started"
            onClick={getStarted}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
