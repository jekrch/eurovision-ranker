import { faCheck, faGlasses } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { IconType } from 'react-icons';
import { FaList, FaTv, FaGlobe, FaCog, FaSort, FaQuestionCircle } from 'react-icons/fa';

import {
  eyebrow,
  hairline,
  iconChip,
  modalActionBtn,
  modalBackdrop,
  modalPanel,
} from './modalStyles';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { setWelcomeOverlayIsOpen } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import { logger } from '../../utilities/logger';
import '../../themes.css';
import { HeartIcon } from '../HeartIcon';
import IconButton from '../IconButton';

interface WelcomeOverlayProps {
  exiting: boolean;
  handleGetStarted: () => void;
  handleTakeTour: () => void;
}

/** The "where you can..." pitch. Each row fades in behind the one above it. */
const FEATURES: { icon: IconType; iconClassName: string; text: string }[] = [
  { icon: FaList, iconClassName: 'text-indigo-400', text: 'rank contests going back to 1956' },
  {
    icon: FaTv,
    iconClassName: 'text-[var(--er-interactive-primary)]',
    text: 'create YouTube playlists',
  },
  { icon: FaGlobe, iconClassName: 'text-sky-400', text: 'view a heat map of your ranking' },
  {
    icon: FaCog,
    iconClassName: 'text-[var(--er-text-subtle)]',
    text: 'explore past voting records',
  },
  { icon: FaSort, iconClassName: 'text-purple-400', text: 'use a sorter to generate rankings' },
  {
    icon: FaQuestionCircle,
    iconClassName: 'text-pink-400',
    text: 'test your knowledge with a quiz',
  },
];

/**
 * An overlay modal that is displayed when first loading the site if no ranking is
 * encoded in the URL yet. The goal here is to provide some initial info to the user
 * and provide them with the option to take the app tour
 *
 * @param param0
 * @returns
 */
const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  handleGetStarted,
  handleTakeTour,
  exiting,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const welcomeOverlayIsOpen = useAppSelector((state: AppState) => state.root.welcomeOverlayIsOpen);
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const [closed, setClosed] = useState(false);

  if (!welcomeOverlayIsOpen && !closed) {
    dispatch(setWelcomeOverlayIsOpen(true));
    logger.log('set');
  }

  const handleClickOutside = (event: React.MouseEvent) => {
    if (overlayContentRef.current && !overlayContentRef.current.contains(event.target as Node)) {
      getStarted();
    }
  };

  function getStarted() {
    dispatch(setWelcomeOverlayIsOpen(false));
    setClosed(true);
    logger.log('closed');
    handleGetStarted();
  }

  // the colour fields sit at different strengths so they read as depth rather
  // than one flat wash
  const fieldOpacity = (resting: string) => (exiting ? 'opacity-0' : resting);

  return (
    <div
      className="z-[1000] w-full h-full fixed top-0 left-0 flex items-center justify-center"
      onClick={handleClickOutside}
    >
      {/* dim + blur sits beneath the drifting colour fields so they read as light
          over a dark ground rather than as stripes over the app */}
      <div
        className={classNames(
          'absolute inset-0 z-0 transition-opacity duration-500',
          modalBackdrop,
          exiting ? 'opacity-0' : 'opacity-100',
        )}
      ></div>
      <div
        className={classNames(
          'overlay-bg z-[1] transition-opacity duration-500',
          fieldOpacity('opacity-40'),
        )}
      ></div>
      <div
        className={classNames(
          'overlay-bg overlay-bg2 z-[1] transition-opacity duration-500',
          fieldOpacity('opacity-30'),
        )}
      ></div>
      <div
        className={classNames(
          'overlay-bg overlay-bg3 z-[1] transition-opacity duration-500',
          fieldOpacity('opacity-25'),
        )}
      ></div>

      <div
        ref={overlayContentRef}
        className={classNames(
          'overlay welcome-card relative z-10 mx-5 w-full max-w-[21em] max-h-[calc(100%-3em)]',
          'flex flex-col px-6 py-6 gradient-background-modal text-[var(--er-text-tertiary)]',
          modalPanel,
        )}
      >
        <div className="text-center">
          <div className={eyebrow}>Welcome to</div>
          <div className="mt-1 text-xl font-bold tracking-tight leading-tight">
            <span className="gradient-text">Eurovision Ranker</span>
            <HeartIcon
              alt="Heart"
              className="inline align-middle ml-[0.3em] mb-1 w-5 h-5 pulse-on-load my-heart-icon"
            />
          </div>
          <div className={classNames(hairline, 'mt-4')}></div>
        </div>

        <div className="mt-4 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <div className="mb-3 text-xs italic text-[var(--er-text-subtle)]">where you can...</div>
          <ul className="list-none space-y-2 text-[0.82rem]">
            {FEATURES.map(({ icon: Icon, iconClassName, text }, index) => (
              <li
                key={text}
                className="welcome-feature flex items-center"
                style={{ animationDelay: `${120 + index * 55}ms` }}
              >
                <span className={classNames(iconChip, 'mr-2.5')}>
                  <Icon className={classNames('h-3 w-3', iconClassName)} />
                </span>
                <span className="leading-snug">{text}</span>
              </li>
            ))}
            <li
              className="welcome-feature flex items-center text-[var(--er-text-subtle)]"
              style={{ animationDelay: `${120 + FEATURES.length * 55}ms` }}
            >
              <span className="mr-2.5 h-6 w-6 flex-none"></span>
              <span className="leading-snug">...and more!</span>
            </li>
          </ul>
        </div>

        <div className="mt-5 flex gap-2.5">
          <IconButton
            icon={faCheck}
            className={classNames(modalActionBtn, 'flex-1')}
            iconClassName="mr-[3px]"
            title="Get Started"
            onClick={getStarted}
          />
          <IconButton
            icon={faGlasses}
            className={classNames(modalActionBtn, 'flex-1 bg-[var(--er-button-primary-hover)]')}
            title="Take Tour"
            onClick={handleTakeTour}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
