import React, { useEffect, useState } from 'react';
import { CallBackProps, EVENTS, ACTIONS, STATUS } from 'react-joyride';

import TourExitPrompt from './TourExitPrompt';
import { tourDelay } from './tourTarget';
import { useTourSteps } from './useTourSteps';
import { CountryContestant } from '../data/CountryContestant';
import { useAppDispatch, useAppSelector } from '../hooks/stateHooks';
import { useResetRanking } from '../hooks/useResetRanking';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import {
  setYear,
  setName,
  setShowUnranked,
  setRankedItems,
  setUnrankedItems,
  setShowTotalRank,
  setHeaderMenuOpen,
  setContestants,
  setGlobalSearch,
  setTheme,
  clearAllCategoryRankings,
  closeHeaderMenu,
} from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';
import { tourSteps } from '../tour/steps';
import { clearCategories } from '../utilities/CategoryUtil';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { clone } from '../utilities/ContestantUtil';
import {
  joyrideFloaterProps,
  joyrideOptions,
  JOYRIDE_SPOTLIGHT_PADDING,
  SKIP_WELCOME_AFTER_TOUR_KEY,
} from '../utilities/JoyrideUtil';
import { logger } from '../utilities/logger';
import { goToUrl } from '../utilities/UrlUtil';

import type Joyride from 'react-joyride';

/** the contest year the tour walks the user through */
const TOUR_YEAR = '2023';

/**
 * How long a step waits for a piece of the app to finish moving before it
 * points at what's underneath. A step that lands mid-transition spotlights an
 * element that's still fading or sliding, and the highlight ends up off the
 * thing it's describing.
 */
const MENU_SETTLE_MS = 200;
const MODAL_OPEN_SETTLE_MS = 400;
const MODAL_CLOSE_SETTLE_MS = 320;

/**
 * How long after the reordering step arrives the tour swaps the top two
 * countries. Long enough for the list view to finish its entrance, short enough
 * that the swap happens while the user is still reading the step that describes
 * it.
 */
const REORDER_DEMO_MS = 450;

interface JoyrideTourProps {
  setRefreshUrl: (num: number) => void;
  openConfigModal: (tabName: string, force?: boolean) => void;
  setConfigModalShow: (show: boolean) => void;
  setRunTour: (run: boolean) => void;
  runTour: boolean;
}

const JoyrideTour: React.FC<JoyrideTourProps> = (props: JoyrideTourProps) => {
  const dispatch: AppDispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.root.year);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const [startTour, setStartTour] = useState<boolean>(false);
  const resetRanking = useResetRanking();
  const [originalUrlQuery, setOriginalUrlQuery] = useState<string>('');
  const [JoyrideComponent, setJoyrideComponent] = useState<typeof Joyride | null>(null);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  // bumped to remount joyride after a cancelled exit - see cancelExit
  const [joyrideKey, setJoyrideKey] = useState(0);

  const { stepIndex, goToStep } = useTourSteps({
    steps: tourSteps,
    running: startTour,
    prepareStep: executeTourStepActions,
    onFinish: endTour,
    onAbandon: endTour,
  });

  useEffect(() => {
    if (props.runTour) {
      // Only import when the tour is about to run
      import('react-joyride').then((module) => {
        setJoyrideComponent(() => module.default);
      });
    }

    if (props.runTour !== startTour) {
      // if we're starting the tour, save the current URL so we can
      // restore it after exiting the tour. Then clear the current
      // ranking state.
      if (props.runTour) {
        setOriginalUrlQuery(window.location.search);
        clearRankingForTour();
      }

      setStartTour(props.runTour);

      // if we're exiting the tour, return to the URL we had
      // when the tour began. Flag that we just came from the tour so
      // the reloaded app skips the welcome overlay and drops the user
      // straight into the select view instead.
      if (!props.runTour) {
        setExitPromptOpen(false);

        try {
          sessionStorage.setItem(SKIP_WELCOME_AFTER_TOUR_KEY, '1');
        } catch {
          /* sessionStorage may be unavailable */
        }
        goToUrl(originalUrlQuery, undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.runTour]);

  /**
   * In order to prepare for a tour, we should clear the theme, ensure
   * that we're not in advanced/global mode, and clear any current ranking.
   * Note that the original ranking will be restored when the tour ends.
   */
  function clearRankingForTour() {
    // The single URL writer projects `g` and `t` from the store, so just reset
    // them here; resetRanking clears the rankings and the writer reprojects.
    dispatch(setGlobalSearch(false));

    dispatch(setTheme(''));

    resetRanking();
  }

  function endTour() {
    setExitPromptOpen(false);
    props.setRunTour(false);
  }

  /**
   * Joyride treats a click on its overlay and a press of Escape as exits, the
   * same as the tooltip's close button, so every one of them asks first. The
   * step stays where it is until the user answers.
   */
  function requestExit() {
    setExitPromptOpen(true);
  }

  function cancelExit() {
    setExitPromptOpen(false);
    // joyride is left holding a "close" action it never got to carry out, and
    // it only reacts to an action that *changes*, so a second Escape or overlay
    // click would go unnoticed. Remounting it puts the current step back with a
    // clean slate.
    setJoyrideKey((key) => key + 1);
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      endTour();

      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
        requestExit();

        return;
      }

      goToStep(index + (action === ACTIONS.PREV ? -1 : 1));

      return;
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Don't skip ahead: the next step's target almost always depends on the
      // state this step was going to set up, so skipping cascades to the end of
      // the tour. The watchdog in useTourSteps waits for the element instead.
      logger.warn(`[tour] step ${index} target missing; waiting for it to return`);
    }
  };

  async function clearRanking(year: string) {
    const yearContestants = await fetchCountryContestantsByYear(year, '');

    dispatch(setContestants(yearContestants));
    dispatch(setUnrankedItems(yearContestants));

    dispatch(setRankedItems([]));
    dispatch(clearAllCategoryRankings());

    props.setRefreshUrl(Math.random());
  }

  /**
   * Each case statement corresponds to a step in the tour, and runs before that
   * step is shown so the elements it points at are on screen by then.
   * @param index
   */
  async function executeTourStepActions(index: number) {
    switch (index) {
      case 0:
        await clearRanking(year);

        break;

      case 1:
        if (year !== TOUR_YEAR) {
          dispatch(setYear(TOUR_YEAR));
          props.setRefreshUrl(Math.random());
        }

        await clearRanking(TOUR_YEAR);

        dispatch(setName(''));

        dispatch(setShowUnranked(true));

        clearCategories(0, dispatch);

        dispatch(setShowTotalRank(false));

        break;

      case 2: {
        const specificCountryCodes = ['fi', 'hr', 'es', 'cz', 'no', 'is'];

        // Filter out the specific items based on country codes
        const specificItems = unrankedItems.filter((item) =>
          specificCountryCodes.includes(item.country.key.toLowerCase()),
        );

        // Remove these items from unrankedItems
        const remainingUnrankedItems = unrankedItems.filter(
          (item) => !specificCountryCodes.includes(item.country.key.toLowerCase()),
        );

        // Sort the specific items in the desired order
        const sortedSpecificItems = specificCountryCodes
          .map((code) => specificItems.find((item) => item.country.key.toLowerCase() === code))
          .filter((item) => item !== undefined) as CountryContestant[];

        const newRankedItems = [...sortedSpecificItems, ...rankedItems];

        dispatch(setRankedItems(newRankedItems));
        dispatch(setUnrankedItems(remainingUnrankedItems));
        dispatch(setName("Sigrit's Top Picks"));

        props.setRefreshUrl(Math.random());

        break;
      }

      case 4: {
        dispatch(setShowUnranked(false));

        // This step is the one about reordering, so the tour demonstrates it
        // here rather than on the way out: the swap plays a beat after the step
        // lands, while the user is reading it.
        if (rankedItems.length >= 2) {
          const swappedRankedItems = clone(rankedItems);

          swappedRankedItems[0] = rankedItems[1];
          swappedRankedItems[1] = rankedItems[0];

          void tourDelay(REORDER_DEMO_MS).then(() => {
            dispatch(setRankedItems(swappedRankedItems));
            props.setRefreshUrl(Math.random());
          });
        }

        break;
      }

      case 6:
        // the menu the next few steps walk through. Step 5 points at the button
        // that opens it, so it stays shut until the user has clicked past that.
        dispatch(setHeaderMenuOpen(true));
        await tourDelay(MENU_SETTLE_MS);
        break;

      case 9:
        // done with the menu - put it away rather than leaving it hanging open
        // over the header the next two steps point at
        dispatch(closeHeaderMenu());
        await tourDelay(MENU_SETTLE_MS);
        break;

      case 11:
        dispatch(setShowUnranked(true));
        break;

      case 13:
        // forced: without it the panel reopens on whichever tab the user last
        // had, and the step talks about "Rankings"
        props.openConfigModal('rankings', true);
        // the panel fades and scales in; let it land before it's spotlighted,
        // or the highlight is drawn around where it no longer is
        await tourDelay(MODAL_OPEN_SETTLE_MS);
        break;

      case 14:
        props.setConfigModalShow(false);
        // likewise on the way out: the closing panel would otherwise sit over
        // the switch this step points at
        await tourDelay(MODAL_CLOSE_SETTLE_MS);
        break;

      case 17:
        // the last step. The example ranking has been the subject right up to
        // the URL step before this one, so it's only now cleared away, leaving
        // the app ready for the user's own.
        props.setConfigModalShow(false);
        dispatch(setName(''));
        await clearRanking(TOUR_YEAR);
        dispatch(setShowUnranked(true));
        break;
    }
  }

  if (!JoyrideComponent) return null;

  return (
    <>
      <JoyrideComponent
        key={joyrideKey}
        disableScrolling={true}
        disableScrollParentFix={true}
        continuous
        run={startTour}
        steps={tourSteps}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        showProgress={true}
        disableOverlay={false}
        spotlightPadding={JOYRIDE_SPOTLIGHT_PADDING}
        floaterProps={joyrideFloaterProps}
        styles={joyrideOptions}
      />
      <TourExitPrompt isOpen={exitPromptOpen} onConfirm={endTour} onCancel={cancelExit} />
    </>
  );
};

export default JoyrideTour;
