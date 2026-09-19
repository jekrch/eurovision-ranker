import { DragDropContext, OnDragEndResponder } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React, { Suspense, useCallback, useState } from 'react';

import { useModalController } from './modals/ModalControllerContext';
import EditNav from './nav/EditNav';
import ContentPlaceholder from './ranking/ContentPlaceholder';
import { Switch } from './Switch';
import TooltipHelp from './TooltipHelp';
import { useDetailsViewToggle } from '../hooks/useDetailsViewToggle';
import { useBulkMove } from '../hooks/useBulkMove';
import { useRankedExit } from '../hooks/useRankedExit';
import { useRankingDragDrop } from '../hooks/useRankingDragDrop';
import { RankingAddition } from '../hooks/useRecentlyAdded';
import { useViewSwitch } from '../hooks/useViewSwitch';

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
  handleOnDragEnd: ReturnType<typeof useRankingDragDrop>['handleOnDragEnd'];
  handleAddToRanked: ReturnType<typeof useRankingDragDrop>['handleAddToRanked'];
  updateGlobalSearch: (checked: boolean) => void;
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
  handleOnDragEnd,
  handleAddToRanked,
  updateGlobalSearch,
}) => {
  const toggleDetailsView = useDetailsViewToggle();
  const viewSwitch = useViewSwitch(showUnranked);
  const {
    openSongModalWithData,
    openMainModalWithTab,
    openConfigModalWithTab,
    openModal,
    openSorterModal,
    openLoginModal,
    setQuizModalOpen,
  } = useModalController();

  // Only an add from a country's "+" button gets the ranked list's entrance. A
  // dropped card has already been animated into its slot by the drag library.
  const [latestAddition, setLatestAddition] = useState<RankingAddition | null>(null);

  const handleAddWithButton: typeof handleAddToRanked = useCallback(
    (item) => {
      setLatestAddition({ id: item.uid ?? item.id, at: Date.now() });
      handleAddToRanked(item);
    },
    [handleAddToRanked],
  );

  // Removals from the ranked list, from a row's delete button or the edit bar's
  // Clear, wait for the rows to animate out before they leave the store.
  const rankedExit = useRankedExit();

  // Add All and Clear move a whole ranking between the two columns at once, so
  // the rows leave one column and arrive in the other.
  const bulkMove = useBulkMove();

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
              <div className="relative flex flex-col view-enter-left-animation">
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
                  <LazyUnrankedCountriesList
                    onAddToRanked={handleAddWithButton}
                    isAddingAll={bulkMove.isAddingAll}
                    isBulkMoving={bulkMove.isMoving}
                    onShowRanking={toggleDetailsView}
                    onOpenGlobalSearch={() => updateGlobalSearch(true)}
                  />
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
                {/* `key` changes with the view, so switching between select and
                    list mode remounts the column and its entrance animation
                    (see transitions.css) plays for the view being opened. The
                    two modes render different cards for every row anyway, so
                    this costs no render work the switch wasn't already doing. */}
                <LazyRankedCountriesList
                  key={showUnranked ? 'select-view' : 'list-view'}
                  latestAddition={latestAddition}
                  exitingIds={rankedExit.exitingIds}
                  isClearing={rankedExit.isClearing}
                  removeRanked={rankedExit.removeRanked}
                  isBulkMoving={bulkMove.isMoving}
                  viewSwitch={viewSwitch}
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
            onClick={toggleDetailsView}
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
          <EditNav
            setNameModalShow={() => openModal('name')}
            clearRanked={rankedExit.clearRanked}
            isClearing={rankedExit.isClearing}
            bulkMove={bulkMove}
          />
        </div>
      )}
    </div>
  );
};

export default AppContent;
