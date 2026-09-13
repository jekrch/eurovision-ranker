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
  setContestants,
  setGlobalSearch,
  setTheme,
  clearAllCategoryRankings,
} from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';
import { clearCategories } from '../utilities/CategoryUtil';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { joyrideOptions, SKIP_WELCOME_AFTER_TOUR_KEY } from '../utilities/JoyrideUtil';
import { logger } from '../utilities/logger';
import { goToUrl } from '../utilities/UrlUtil';

import type Joyride from 'react-joyride';

/** the contest year the sorter tour walks the user through */
const TOUR_YEAR = '2025';

/** the countries the tour ranks on the user's behalf, in the order it ranks them */
const TOUR_COUNTRY_CODES = ['fi', 'se', 'dk', 'al', 'ee', 'pt'];

interface JoyrideTourSortProps {
  setRefreshUrl: (num: number) => void;
  openConfigModal: (tabName: string) => void;
  setConfigModalShow: (show: boolean) => void;
  setRunTour: (run: boolean) => void;
  runTour: boolean;
  openSortModal: () => void;
  closeSortModal: () => void;
}

// simplified tour steps with the new step added before the final one
const joyRideTourSteps = [
  {
    target: '.tour-step-2',
    content:
      'To use the Sorter, drag contestants you want to rank from the left to the right column',
    disableBeacon: true,
  },
  {
    target: '.tour-step-4',
    content: 'Click "View List" to see your unranked list',
    disableBeacon: true,
  },
  {
    target: '.tour-step-10',
    content: 'Click here to open the Sorter',
    disableBeacon: true,
  },
  {
    target: '.sort-tour-step-modal',
    content: 'Answer the prompts with the contestant you prefer',
    disableBeacon: true,
  },
  {
    target: '.tour-step-18',
    content:
      "Once you're done, you can generate a ranking that reflects all of your choices. Neat!",
    disableBeacon: true,
  },
  {
    target: '.tour-step-18',
    content: (
      <>
        <p>Enjoy your new ranking! You can save or share it by copying the URL.</p>
        <br />
        <p>
          Note that you can use the sorter in adv mode (across multiple years) and even with
          categorized rankings. Have fun!
        </p>
      </>
    ),
    disableBeacon: true,
  },
];

const JoyrideTourSort: React.FC<JoyrideTourSortProps> = (props: JoyrideTourSortProps) => {
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
    steps: joyRideTourSteps,
    running: startTour,
    prepareStep: executeTourStepActions,
    onFinish: endTour,
    onAbandon: endTour,
  });

  // initialize joyride when the tour starts
  useEffect(() => {
    if (props.runTour) {
      // only import when the tour is about to run
      import('react-joyride').then((module) => {
        setJoyrideComponent(() => module.default);
      });
    }

    if (props.runTour !== startTour) {
      // starting tour
      if (props.runTour) {
        logger.log('[JoyrideTourSort] Tour started');
        setOriginalUrlQuery(window.location.search);
        clearRankingForTour();
      }
      // ending tour
      else if (!props.runTour && startTour) {
        logger.log('[JoyrideTourSort] Tour ended');
        setExitPromptOpen(false);
        // Flag that we just came from the tour so the reloaded app skips the
        // welcome overlay and drops the user straight into the select view.
        try {
          sessionStorage.setItem(SKIP_WELCOME_AFTER_TOUR_KEY, '1');
        } catch {
          /* sessionStorage may be unavailable */
        }
        goToUrl(originalUrlQuery, undefined);
      }

      setStartTour(props.runTour);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.runTour]);

  // clear theme and ranking for the tour
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

  // handle joyride events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    logger.log(
      `[JoyrideTourSort] Joyride callback: type=${type}, index=${index}, status=${status}, action=${action}`,
    );

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
      logger.warn(`[JoyrideTourSort] step ${index} target missing; waiting for it to return`);
    }
  };

  /**
   * Clears the ranking for the given year and hands back that year's
   * contestants, so a caller can seed the tour's example ranking from the list
   * it just loaded rather than from whatever the store held a render ago.
   */
  async function clearRanking(year: string): Promise<CountryContestant[]> {
    logger.log(`[JoyrideTourSort] Clearing ranking for year ${year}`);
    try {
      const yearContestants = await fetchCountryContestantsByYear(year, '');

      dispatch(setContestants(yearContestants));
      dispatch(setUnrankedItems(yearContestants));
      dispatch(setRankedItems([]));
      dispatch(clearAllCategoryRankings());
      props.setRefreshUrl(Math.random());

      logger.log('[JoyrideTourSort] Ranking cleared successfully');

      return yearContestants;
    } catch (error) {
      logger.error('[JoyrideTourSort] Error clearing ranking:', error);

      return [];
    }
  }

  /**
   * Seeds the ranking the tour demonstrates the sorter on. Derived entirely
   * from `source`, so calling it twice with the same list is a no-op rather
   * than a second, different ranking.
   */
  function moveCountriesToRanked(source: CountryContestant[]) {
    const specificItems = source.filter((item) =>
      TOUR_COUNTRY_CODES.includes(item.country.key.toLowerCase()),
    );

    logger.log(`[JoyrideTourSort] Found ${specificItems.length} countries to rank`);

    // if we can't find the countries by code, just use the first 6 available
    if (specificItems.length === 0) {
      logger.warn('[JoyrideTourSort] No matching countries found in unranked items');

      if (source.length >= 6) {
        dispatch(setRankedItems(source.slice(0, 6)));
        dispatch(setUnrankedItems(source.slice(6)));
        dispatch(setName('Example Ranking'));
        props.setRefreshUrl(Math.random());
      }

      return;
    }

    // rank them in the order the tour lists them
    const rankedTourItems = TOUR_COUNTRY_CODES.map((code) =>
      specificItems.find((item) => item.country.key.toLowerCase() === code),
    ).filter((item) => item !== undefined) as CountryContestant[];

    logger.log(`[JoyrideTourSort] Setting ${rankedTourItems.length} ranked items`);
    dispatch(setRankedItems(rankedTourItems));
    dispatch(
      setUnrankedItems(
        source.filter((item) => !TOUR_COUNTRY_CODES.includes(item.country.key.toLowerCase())),
      ),
    );
    dispatch(setName('Example Ranking'));

    props.setRefreshUrl(Math.random());
  }

  /**
   * Puts the app into the state a step describes. Runs before that step is
   * shown, so the element it points at is on screen by the time the tooltip is.
   */
  async function executeTourStepActions(index: number) {
    logger.log(`[JoyrideTourSort] Executing step ${index} actions`);

    try {
      switch (index) {
        case 0: {
          // first step - initialize ranking state and add ranked items
          if (year !== TOUR_YEAR) {
            dispatch(setYear(TOUR_YEAR));
            props.setRefreshUrl(Math.random());
          }

          const yearContestants = await clearRanking(TOUR_YEAR);
          dispatch(setName(''));
          dispatch(setShowUnranked(true));
          clearCategories(0, dispatch);
          dispatch(setShowTotalRank(false));

          // the example ranking fills in a beat after the step lands, so the
          // user sees the drag the step is describing actually happen
          void tourDelay(600).then(() => moveCountriesToRanked(yearContestants));
          break;
        }

        case 1: // second step - the "View List" button, which needs a ranking to point at
          // the demonstration above may not have landed yet if they clicked
          // through quickly, and this step has nothing to point at without it
          if (rankedItems.length === 0) {
            moveCountriesToRanked(unrankedItems);
          }
          dispatch(setShowUnranked(true));
          break;

        case 2: // third step - sort button, which only exists in the list view
          dispatch(setShowUnranked(false));
          props.setRefreshUrl(Math.random());
          break;

        case 3: // fourth step - the sorter itself
          props.openSortModal();
          break;

        case 4: // fifth step - back out of the sorter
          props.closeSortModal();
          // the modal fades out over its own transition; let it clear the screen
          await tourDelay(300);
          break;

        case 5: // final step - reset ranking
          logger.log('[JoyrideTourSort] Final step, resetting ranking');
          await clearRanking(TOUR_YEAR);
          dispatch(setName(''));
          dispatch(setShowUnranked(true));
          break;

        default:
          logger.log(`[JoyrideTourSort] No actions for step ${index}`);
      }
    } catch (error) {
      logger.error(`[JoyrideTourSort] Error in step ${index}:`, error);
    }
  }

  // don't render if Joyride hasn't loaded
  if (!JoyrideComponent) return null;

  return (
    <>
      <JoyrideComponent
        key={joyrideKey}
        callback={handleJoyrideCallback}
        continuous={true}
        run={startTour}
        stepIndex={stepIndex}
        steps={joyRideTourSteps}
        styles={joyrideOptions}
        disableOverlay={false}
        disableScrolling={true}
        disableScrollParentFix={true}
        showProgress={true}
      />
      <TourExitPrompt isOpen={exitPromptOpen} onConfirm={endTour} onCancel={cancelExit} />
    </>
  );
};

export default JoyrideTourSort;
