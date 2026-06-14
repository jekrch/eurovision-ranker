import React, { useEffect, useState, useRef } from 'react';
import { CallBackProps, EVENTS, ACTIONS, STATUS } from 'react-joyride';

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
  const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);
  const [JoyrideComponent, setJoyrideComponent] = useState<typeof Joyride | null>(null);

  // refs for tracking state between renders
  const stepExecutedRef = useRef<{ [key: number]: boolean }>({});
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // initialize joyride when the tour starts
  useEffect(() => {
    if (props.runTour) {
      // only import when the tour is about to run
      import('react-joyride').then((module) => {
        setJoyrideComponent(() => module.default);
        // reset step index
        setJoyrideStepIndex(0);
        // clear executed steps tracking
        stepExecutedRef.current = {};
      });
    }

    if (props.runTour !== startTour) {
      // starting tour
      if (props.runTour) {
        logger.log('[JoyrideTourSort] Tour started');
        setOriginalUrlQuery(window.location.search);
        clearRankingForTour();
        setJoyrideStepIndex(0);
        stepExecutedRef.current = {};
      }
      // ending tour
      else if (!props.runTour && startTour) {
        logger.log('[JoyrideTourSort] Tour ended');
        // Flag that we just came from the tour so the reloaded app skips the
        // welcome overlay and drops the user straight into the select view.
        try {
          sessionStorage.setItem(SKIP_WELCOME_AFTER_TOUR_KEY, '1');
        } catch {
          /* sessionStorage may be unavailable */
        }
        goToUrl(originalUrlQuery, undefined);

        // clear any pending timers
        if (stepTimerRef.current) {
          clearTimeout(stepTimerRef.current);
          stepTimerRef.current = null;
        }
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

  // execute actions for the current step
  useEffect(() => {
    if (!startTour) return;

    const currentStep = joyrideStepIndex;
    logger.log(`[JoyrideTourSort] Current step index: ${currentStep}`);

    // check if we've already executed this step
    if (stepExecutedRef.current[currentStep]) {
      logger.log(`[JoyrideTourSort] Step ${currentStep} already executed, skipping`);
      return;
    }

    // mark this step as executed
    stepExecutedRef.current[currentStep] = true;

    // execute step actions
    logger.log(`[JoyrideTourSort] Executing actions for step ${currentStep}`);
    executeTourStepActions(currentStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joyrideStepIndex, startTour]);

  // handle joyride events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    logger.log(
      `[JoyrideTourSort] Joyride callback: type=${type}, index=${index}, status=${status}, action=${action}`,
    );

    // initialize on first step
    if (type === EVENTS.STEP_BEFORE && index === 0) {
      logger.log('[JoyrideTourSort] Initializing first step');
      clearRanking(year);
    }

    // handle tour completion
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      props.setRunTour(false);
      setJoyrideStepIndex(0);
      return;
    }

    // handle tour close
    if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
      logger.log('[JoyrideTourSort] Tour closed');
      props.setRunTour(false);
      return;
    }

    // handle step navigation
    if (type === EVENTS.STEP_AFTER) {
      // clear any pending timers
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }

      // calculate next step
      const nextStep = index + (action === ACTIONS.PREV ? -1 : 1);
      logger.log(`[JoyrideTourSort] Moving to step ${nextStep}`);

      // use a timer to ensure UI updates before changing steps
      stepTimerRef.current = setTimeout(() => {
        logger.log(`[JoyrideTourSort] Setting step index to ${nextStep}`);
        setJoyrideStepIndex(nextStep);
      }, 100);
    }
  };

  // clear ranking for the given year
  async function clearRanking(year: string) {
    logger.log(`[JoyrideTourSort] Clearing ranking for year ${year}`);
    try {
      const yearContestants = await fetchCountryContestantsByYear(year, '');

      dispatch(setContestants(yearContestants));
      dispatch(setUnrankedItems(yearContestants));
      dispatch(setRankedItems([]));
      dispatch(clearAllCategoryRankings());
      props.setRefreshUrl(Math.random());

      logger.log('[JoyrideTourSort] Ranking cleared successfully');
    } catch (error) {
      logger.error('[JoyrideTourSort] Error clearing ranking:', error);
    }
  }

  // move selected countries to ranked items
  function moveCountriesToRanked() {
    // list of country codes to select
    const specificCountryCodes = ['fi', 'se', 'dk', 'al', 'ee', 'pt'];

    // filter out the specific items based on country codes
    const specificItems = unrankedItems.filter((item) =>
      specificCountryCodes.includes(item.country.key.toLowerCase()),
    );

    logger.log(`[JoyrideTourSort] Found ${specificItems.length} countries to rank`);

    if (specificItems.length === 0) {
      logger.warn('[JoyrideTourSort] No matching countries found in unranked items');
      // if we can't find the countries by code, just use the first 6 available
      if (unrankedItems.length >= 6) {
        const firstSixItems = unrankedItems.slice(0, 6);
        const remainingUnrankedItems = unrankedItems.slice(6);

        dispatch(setRankedItems(firstSixItems));
        dispatch(setUnrankedItems(remainingUnrankedItems));
        dispatch(setName('Example Ranking'));
        props.setRefreshUrl(Math.random());
      }
      return;
    }

    // remove these items from unrankedItems
    const remainingUnrankedItems = unrankedItems.filter(
      (item) => !specificCountryCodes.includes(item.country.key.toLowerCase()),
    );

    // sort the specific items in the desired order
    const sortedSpecificItems = specificCountryCodes
      .map((code) => specificItems.find((item) => item.country.key.toLowerCase() === code))
      .filter((item) => item !== undefined) as CountryContestant[];

    // create new ranked items list
    const newRankedItems = [...sortedSpecificItems, ...rankedItems];

    // update state
    logger.log(`[JoyrideTourSort] Setting ${newRankedItems.length} ranked items`);
    dispatch(setRankedItems(newRankedItems));
    dispatch(setUnrankedItems(remainingUnrankedItems));
    dispatch(setName('Example Ranking'));

    // refresh URL to update UI
    props.setRefreshUrl(Math.random());
  }

  // execute actions for specific steps
  async function executeTourStepActions(index: number) {
    logger.log(`[JoyrideTourSort] Executing step ${index} actions`);

    try {
      switch (index) {
        case 0: // first step - initialize ranking state and add ranked items
          if (year !== '2025') {
            dispatch(setYear('2025'));
            props.setRefreshUrl(Math.random());
          }

          await clearRanking(year);
          dispatch(setName(''));
          dispatch(setShowUnranked(true));
          clearCategories(0, dispatch);
          dispatch(setShowTotalRank(false));

          // critical: add a delay then move countries to ranked to prepare for next step
          setTimeout(() => {
            moveCountriesToRanked();
          }, 500);
          break;

        case 1: // second step - view details
          // ensure countries are showing in ranked view
          if (rankedItems.length === 0) {
            logger.log('[JoyrideTourSort] No ranked items found, adding them now');
            moveCountriesToRanked();
          }
          // keep showing unranked items to see the "View List" button
          dispatch(setShowUnranked(true));
          break;

        case 2: // third step - sort button
          // critical: toggle to show only ranked items (details view)
          dispatch(setShowUnranked(false));
          props.setRefreshUrl(Math.random());
          break;

        case 3: // fourth step - open sort modal
          // use a delay to ensure UI is ready
          setTimeout(() => {
            logger.log('[JoyrideTourSort] Opening sort modal now');
            props.openSortModal();
          }, 300);
          break;

        case 4: // fifth step - close sort modal
          // close the sort modal with a delay
          setTimeout(() => {
            logger.log('[JoyrideTourSort] Closing sort modal now');
            props.closeSortModal();
          }, 300);
          break;

        case 5: // final step - reset ranking
          logger.log('[JoyrideTourSort] Step 5: Final step, resetting ranking');
          await clearRanking(year);
          dispatch(setName(''));
          dispatch(setShowUnranked(true));
          break;

        case 6: // end of tour
          props.setRunTour(false);
          setJoyrideStepIndex(0);
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
        callback={handleJoyrideCallback}
        continuous={true}
        run={startTour}
        stepIndex={joyrideStepIndex}
        steps={joyRideTourSteps}
        styles={joyrideOptions}
        disableOverlay={false}
        disableScrolling={true}
        disableScrollParentFix={true}
        showProgress={true}
        // force re-render on step change with a key
        key={`joyride-tour-${joyrideStepIndex}`}
      />
    </>
  );
};

export default JoyrideTourSort;
