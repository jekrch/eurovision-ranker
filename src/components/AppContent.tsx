import { DragDropContext, OnDragEndResponder } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React, { Suspense } from 'react';

import { Switch } from './Switch';
import TooltipHelp from './TooltipHelp';
import { CountryContestant } from '../data/CountryContestant';
import { setShowUnranked } from '../redux/rootSlice';
import EditNav from './nav/EditNav';
import ContentPlaceholder from './ranking/ContentPlaceholder';
import { UseModalReturn } from '../hooks/useModal';
import { useRankingDragDrop } from '../hooks/useRankingDragDrop';
import { AppDispatch } from '../redux/store';

// lazy load the list views to reduce initial bundle size
const LazyRankedCountriesList = React.lazy(() => import('./ranking/RankedCountriesList'));
const LazyUnrankedCountriesList = React.lazy(() => import('./ranking/UnrankedCountriesList'));
const LazyRankedCountriesTable = React.lazy(() => import('./ranking/RankedCountriesTable'));
const LazyNavbar = React.lazy(() => import('./nav/NavBar'));

interface AppContentProps {
  theme: string;
  showUnranked: boolean;
  globalSearch: boolean;
  showOverlay: boolean;
  isOverlayExit: boolean;
  dispatch: AppDispatch;
  handleOnDragEnd: ReturnType<typeof useRankingDragDrop>['handleOnDragEnd'];
  handleAddToRanked: ReturnType<typeof useRankingDragDrop>['handleAddToRanked'];
  updateGlobalSearch: (checked: boolean) => void;
  openSongModalWithData: (countryContestant: CountryContestant) => void;
  openMainModalWithTab: (tabName: string) => void;
  openConfigModalWithTab: (tabName: string, force?: boolean) => void;
  openModal: UseModalReturn['openModal'];
  openSorterModal: (items?: CountryContestant[]) => void;
  openLoginModal: () => void;
  setQuizModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * The primary app surface: the navbar, the drag-and-drop ranked/unranked list
 * area (or the global-search table), the hidden view/edit toggle, and the
 * EditNav bar. Extracted from App so the root stays focused on state wiring;
 * the render tree is unchanged.
 */
const AppContent: React.FC<AppContentProps> = ({
  theme,
  showUnranked,
  globalSearch,
  showOverlay,
  isOverlayExit,
  dispatch,
  handleOnDragEnd,
  handleAddToRanked,
  updateGlobalSearch,
  openSongModalWithData,
  openMainModalWithTab,
  openConfigModalWithTab,
  openModal,
  openSorterModal,
  openLoginModal,
  setQuizModalOpen,
}) => {
  return (
    <div
      className={classNames(
        'site-content flex flex-col tour-step-16 tour-step-17 tour-step-18 normal-bg',
        {
          'star-sky': theme.includes('ab'),
          'view-mode': !showUnranked,
          'h-screen': showUnranked,
        },
      )}
    >
      {theme.includes('ab') && (
        <div className="star-container z-10">
          <div className="star" id="stars"></div>
          <div className="star" id="stars2"></div>
          <div className="star" id="stars3"></div>
        </div>
      )}
      <Suspense fallback={<div />}>
        <LazyNavbar openModal={openMainModalWithTab} openConfigModal={openConfigModalWithTab} />
      </Suspense>

      <div className="flex-grow overflow-auto overflow-x-hidden bg-[#040241] flex justify-center bg-opacity-0">
        <DragDropContext
          onDragEnd={handleOnDragEnd as OnDragEndResponder}
          key={`drag-drop-context`}
          onDragStart={() => {
            if (window.navigator.vibrate) {
              window.navigator.vibrate(100);
            }
          }}
        >
          <div
            className={classNames(
              'flex flex-row justify-center gap-4 py-2',
              globalSearch ? 'px-1 sm:px-4' : 'px-4',
            )}
          >
            {/* Unranked Countries List */}
            {showUnranked && !globalSearch && (
              <div className="relative flex flex-col">
                <div className="tour-step-15 sticky top-0 rounded-t-md round-b-sm text-center font-bold bg-[var(--er-surface-bar)] gradient-background-reverse text-[var(--er-text-secondary)] tracking-tighter shadow-md z-50">
                  <div className="flex items-center justify-center gap-1 py-1 px-0">
                    <TooltipHelp
                      content="Select countries across all contest years"
                      className="text-[var(--er-text-secondary)] align-middle mb-1 mr-1 -ml-1"
                    />
                    <Switch
                      label="adv"
                      className="items-center align-middle font-normal"
                      labelClassName="text-sm text-[var(--er-text-tertiary)]"
                      checked={globalSearch}
                      setChecked={updateGlobalSearch}
                    />
                  </div>
                </div>
                <Suspense fallback={<ContentPlaceholder />}>
                  <LazyUnrankedCountriesList onAddToRanked={handleAddToRanked} />
                </Suspense>
              </div>
            )}

            {/* Ranked Countries List */}

            {globalSearch && showUnranked ? (
              <Suspense fallback={<ContentPlaceholder />}>
                <LazyRankedCountriesTable />
              </Suspense>
            ) : (
              <Suspense fallback={<ContentPlaceholder />}>
                <LazyRankedCountriesList
                  openSongModal={openSongModalWithData}
                  openModal={openMainModalWithTab}
                  openConfigModal={openConfigModalWithTab}
                  setRunTour={() => openModal('tour')}
                  setRunSortTour={() => openModal('sortTour')}
                  openNameModal={() => openModal('name')}
                  openMapModal={() => openModal('map')}
                  openSorterModal={openSorterModal}
                  openAuthModal={openLoginModal}
                  openQuizModal={() => setQuizModalOpen(true)}
                />
              </Suspense>
            )}
          </div>
        </DragDropContext>
      </div>

      <div className="hidden fixed bottom-[3em] left-[1em] z-50">
        <div className="p-2 bg-slate-300 bg-opacity-40 rounded-lg">
          <button
            onClick={() => {
              dispatch(setShowUnranked(!showUnranked));
            }}
            className={
              'w-[4em] py-3 bg-[var(--er-surface-bar)] hover:bg-[var(--er-interactive-dark)] z-50 relative' +
              'overflow-hidden text-[var(--er-text-primary)] font-normal py-1 px-3 ' +
              'rounded-full border-[var(--er-border-tertiary)] border-[0.1em] text-base shadow-lg ' +
              'bg-opacity-80'
            }
          >
            <div className="text-[var(--er-text-primary)]">{showUnranked ? 'VIEW' : 'EDIT'}</div>
          </button>
        </div>
      </div>

      {showUnranked && (!showOverlay || isOverlayExit) && (
        /* `key` is derived from the theme so a theme switch REMOUNTS just this
           EditNav (the bar whose dark fill the iOS Safari bottom toolbar
           samples). Replacing this exact node forces iOS to re-sample its tint
           to the new theme color, while the main list above is left untouched
           (no glitchy reload). The bar's slide-up animation replays on remount,
           which is the accepted trade-off. */
        <div
          key={`edit-nav-${theme}`}
          className={`edit-nav-container ${(!showOverlay || isOverlayExit) && 'slide-up-animation'}`}
        >
          <EditNav setNameModalShow={() => openModal('name')} />
        </div>
      )}
    </div>
  );
};

export default AppContent;
