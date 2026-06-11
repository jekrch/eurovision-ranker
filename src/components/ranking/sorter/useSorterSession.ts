import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import {
  MAX_CACHED_STATES,
  ChoiceLogEntry,
  StateCache,
  NavigationAction,
  compressFullState,
  decompressFullState,
} from './sorterStateCodec';
import { CountryContestant } from '../../../data/CountryContestant';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { setRankedItems } from '../../../redux/rootSlice';
import { AppDispatch, AppState } from '../../../redux/store';
import { logger } from '../../../utilities/logger';
import {
  initSortState,
  processChoice,
  getSortedItems,
  SortState,
  getCurrentComparison,
} from '../../../utilities/SorterUtils';
import { updateUrlFromRankedItems } from '../../../utilities/UrlUtil';

/*
 * encapsulates the pairwise-comparison sorter's state machine: initialization,
 * user choices, history (back/forward), compressed state caching, and applying the
 * final ranked list. SorterModal consumes this and only renders the UI.
 */
export const useSorterSession = (
  isOpen: boolean,
  onClose: () => void,
  initialItems: CountryContestant[],
) => {
  const dispatch: AppDispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  const initialSortStateRef = useRef<SortState | null>(null); // stores the state *after* 0 comparisons (ready for first choice)
  const [choiceLog, setChoiceLog] = useState<ChoiceLogEntry[]>([]);
  const stateCacheRef = useRef<StateCache>({});
  const [cacheVersion, setCacheVersion] = useState<number>(0); // triggers re-renders when cache updates
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0); // number of choices made, corresponds to state cache key
  const [lastNavigationAction, setLastNavigationAction] = useState<NavigationAction>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false); // flag to indicate background state computation
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(false); // tracks if initSortState has successfully run for the current items

  // refs for tracking changes that require re-initialization
  const prevIsOpen = useRef(isOpen);
  const activeInitialItemsRef = useRef<CountryContestant[] | null>(null);

  /*
   * updates the state cache ref and increments cacheVersion to trigger hooks relying on it.
   */
  const updateCache = useCallback((newCache: StateCache) => {
    stateCacheRef.current = newCache;
    setCacheVersion((v) => v + 1);
  }, []);

  // handles initialization and state resets based on modal visibility and input items
  useEffect(() => {
    const needsInitialization =
      isOpen &&
      (!prevIsOpen.current || // modal just opened
        initialItems !== activeInitialItemsRef.current || // items changed
        !isSessionLoaded); // previous session failed or was reset

    if (needsInitialization && initialItems.length > 1) {
      setIsComputing(true); // indicate computation start
      setTimeout(() => {
        // yield thread for ui update
        const fullInitialState = initSortState(initialItems); // gets state ready for the first comparison

        if (!fullInitialState) {
          logger.error('initSortState returned null or undefined');
          // reset state fully on init failure
          setIsSessionLoaded(false);
          setChoiceLog([]);
          stateCacheRef.current = {};
          setCacheVersion(0);
          setCurrentHistoryIndex(0);
          setLastNavigationAction(null);
          initialSortStateRef.current = null;
          activeInitialItemsRef.current = null;
          setIsComputing(false);
          return;
        }

        initialSortStateRef.current = fullInitialState; // store state after 0 choices
        activeInitialItemsRef.current = initialItems;
        const compressedInitial = compressFullState(fullInitialState);

        setChoiceLog([]); // reset history
        stateCacheRef.current = compressedInitial ? { 0: compressedInitial } : {}; // cache state at index 0
        setCacheVersion((v) => v + 1); // update version
        setCurrentHistoryIndex(0); // start at 0 choices made
        setLastNavigationAction('init');
        setIsComputing(false); // computation finished
        setIsSessionLoaded(true); // mark session as ready
      }, 0);
    } else if (isOpen && initialItems.length <= 1) {
      // handle case where modal opens with insufficient items
      setIsSessionLoaded(false);
      setChoiceLog([]);
      stateCacheRef.current = {};
      setCacheVersion(0);
      setCurrentHistoryIndex(0);
      setLastNavigationAction(null);
      initialSortStateRef.current = null;
      activeInitialItemsRef.current = null;
      setIsComputing(false);
    } else if (!isOpen && prevIsOpen.current) {
      // closing modal, state persists silently until next open or item change
    }

    prevIsOpen.current = isOpen;
  }, [isOpen, initialItems, isSessionLoaded, updateCache]);

  /*
   * computes the sort state for a given comparison count (history index).
   * tries to load from cache first, otherwise replays choices from the
   * nearest valid cached state or from the initial state.
   * returns the computed state or null if initialization hasn't completed.
   */
  const computeStateAtIndex = useCallback(
    (targetIndex: number): SortState | null => {
      const stateAtIndexZero = initialSortStateRef.current; // state after 0 choices
      if (!isSessionLoaded || !stateAtIndexZero) {
        return null; // not initialized
      }
      if (targetIndex === 0) {
        return stateAtIndexZero; // base case
      }

      let closestCachedIndex = -1;
      let startState: SortState | null = null;
      const currentCache = stateCacheRef.current;
      const cachedIndices = Object.keys(currentCache)
        .map(Number)
        .sort((a, b) => b - a); // sort descending

      // find the closest valid cached state *before* or at the target index
      for (const index of cachedIndices) {
        if (index <= targetIndex) {
          const compressedData = currentCache[index];
          if (compressedData) {
            const decompressed = decompressFullState(compressedData);
            if (decompressed) {
              // validate cache consistency: comparison count must match index
              if (decompressed.totalComparisons === index) {
                startState = decompressed;
                closestCachedIndex = index;
                break; // found best starting point
              } else {
                logger.warn(
                  `compute: cache index ${index} state mismatch. expected ${index} comparisons, found ${decompressed.totalComparisons}. discarding.`,
                );
                // optionally remove invalid cache entry: delete currentCache[index]; updateCache({...currentCache});
              }
            } else {
              logger.error(`compute: failed to decompress state for index ${index}.`);
            }
          }
        }
      }

      // if no suitable cached state, start from the beginning (state at index 0)
      if (!startState || closestCachedIndex < 0) {
        startState = stateAtIndexZero;
        closestCachedIndex = 0;
      }

      // if we loaded the exact state needed, return it
      if (closestCachedIndex === targetIndex && startState) {
        return startState;
      }

      // replay choices from the start state up to the target index
      let currentState = startState;
      for (let i = closestCachedIndex; i < targetIndex; i++) {
        const logEntry = choiceLog[i];
        if (!logEntry) {
          logger.error(
            `compute error: missing log entry at index ${i} (target ${targetIndex}, start ${closestCachedIndex}).`,
          );
          return currentState; // return last valid state computed
        }
        if (currentState.isComplete) {
          logger.warn(
            `compute warning: state was complete at step ${i}, stopping replay for target ${targetIndex}.`,
          );
          break; // stop if state became complete earlier than expected
        }

        // get the state *after* choice `i` was made
        const nextState = processChoice(currentState, logEntry.choice);
        if (!nextState) {
          logger.error(
            `compute error: processChoice failed for step ${i} with choice ${logEntry.choice}.`,
          );
          return currentState; // return last valid state
        }
        currentState = nextState;

        // safety check: ensure totalComparisons matches index after processing
        if (currentState.totalComparisons !== i + 1) {
          logger.error(
            `compute error: state comparison count mismatch after step ${i}. expected ${i + 1}, got ${currentState.totalComparisons}.`,
          );
          return currentState; // return state before mismatch
        }

        // optimization: if state becomes complete, stop replay
        if (currentState.isComplete && i < targetIndex - 1) {
          break;
        }
      }
      return currentState;
    },
    [isSessionLoaded, choiceLog],
  ); // depends on initialization and choice history

  // memoized sort state for the current history index
  // uses cache if available and valid, otherwise triggers computation
  const currentSortState = useMemo((): SortState | null => {
    if (!isSessionLoaded) {
      return null;
    }
    const compressedData = stateCacheRef.current[currentHistoryIndex];
    if (compressedData) {
      //setIsComputing(false); // ensure computing flag is off if cache hit
      const decompressed = decompressFullState(compressedData);
      // validate decompressed state consistency
      if (decompressed && decompressed.totalComparisons === currentHistoryIndex) {
        if (isComputing) setIsComputing(false); // turn off if it was on
        return decompressed; // return valid cached state
      } else {
        logger.error(
          `memo: decompression failed or state inconsistent for cached index ${currentHistoryIndex}. expected ${currentHistoryIndex}, got ${decompressed?.totalComparisons}. falling back to compute...`,
        );
        // proceed to compute below
      }
    }

    // if cache miss or invalid, compute the state
    if (!isComputing) setIsComputing(true); // indicate computation start
    const computedState = computeStateAtIndex(currentHistoryIndex);
    if (isComputing) setIsComputing(false); // indicate computation end

    // validate computed state consistency (allow mismatch only if complete)
    if (
      computedState &&
      computedState.totalComparisons !== currentHistoryIndex &&
      !computedState.isComplete
    ) {
      logger.error(
        `memo: computed state inconsistent for index ${currentHistoryIndex}. expected ${currentHistoryIndex}, got ${computedState.totalComparisons}. state complete: ${computedState.isComplete}`,
      );
    } else if (
      computedState &&
      computedState.isComplete &&
      computedState.totalComparisons < currentHistoryIndex
    ) {
      logger.warn(
        `memo: sorting completed at ${computedState.totalComparisons} comparisons, but history index is ${currentHistoryIndex}.`,
      );
    }

    return computedState;
    // cacheVersion is intentional: bump it to force a recompute when the cache changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionLoaded, currentHistoryIndex, cacheVersion, computeStateAtIndex, isComputing]);

  // derived state for UI interaction checks
  const canInteract = isOpen && isSessionLoaded && !isComputing;

  /*
   * handles user selection of 'left' or 'right' item.
   * updates choice log, processes the choice using SorterUtils,
   * updates and prunes the state cache, and moves the history index forward.
   * if navigating forward into existing history with the same choice, just advances index.
   */
  const handleChoice = useCallback(
    (choice: 'left' | 'right') => {
      const stateBeforeChoice = currentSortState;

      if (!canInteract || !stateBeforeChoice || stateBeforeChoice.isComplete) {
        return; // exit if interaction is disabled or sort complete
      }

      // check if navigating forward into existing history with the same choice
      if (currentHistoryIndex < choiceLog.length) {
        const historicalEntry = choiceLog[currentHistoryIndex];
        if (historicalEntry?.choice === choice) {
          // matches history, just navigate forward
          setLastNavigationAction('forward');
          setCurrentHistoryIndex(currentHistoryIndex + 1);
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); // blur focus
          return; // don't reprocess
        }
        // choice differs from history, will prune future log/cache below
      }

      // process as a new choice or overwrite
      setLastNavigationAction('choice');

      // log based on the state *before* the choice
      const comparisonIndexForLog = stateBeforeChoice.comparisons.length - 1;
      if (comparisonIndexForLog < 0) {
        logger.error(`choice error: no comparisons found in state before choice.`);
        return;
      }
      const currentComparisonForLog = stateBeforeChoice.comparisons[comparisonIndexForLog];
      if (!currentComparisonForLog || currentComparisonForLog.choice) {
        logger.warn(
          `choice warning: last comparison missing or already has choice. index: ${comparisonIndexForLog}`,
        );
        // proceed anyway, SorterUtils might handle it
      }

      // get the state *after* the choice is processed
      const nextFullState = processChoice(stateBeforeChoice, choice);

      if (!nextFullState) {
        logger.error('choice error: processChoice returned null/undefined.');
        return;
      }
      // verify comparison count incremented correctly
      if (nextFullState.totalComparisons !== stateBeforeChoice.totalComparisons + 1) {
        logger.error(
          `choice error: comparison count mismatch. before: ${stateBeforeChoice.totalComparisons}, after: ${nextFullState.totalComparisons}`,
        );
        // proceed but log error, state might be recoverable
      }

      // history index moves to the new total comparison count
      const nextHistoryIndex = nextFullState.totalComparisons;
      const newLogEntry: ChoiceLogEntry = { comparisonIndex: comparisonIndexForLog, choice };

      // prune future log entries if history branched
      const newChoiceLog = [...choiceLog.slice(0, currentHistoryIndex), newLogEntry];
      setChoiceLog(newChoiceLog);

      // compress the new state for caching
      const compressedNextState = compressFullState(nextFullState);
      if (!compressedNextState) {
        logger.error('cache: failed to compress next state.');
      }

      // update cache
      const currentCache = stateCacheRef.current;
      const newCache = { ...currentCache };

      // prune future cache entries (indices > current history index)
      Object.keys(newCache)
        .map(Number)
        .forEach((index) => {
          if (index > currentHistoryIndex) {
            delete newCache[index];
          }
        });

      // add the new state to cache if compressed successfully
      // cache key is the number of comparisons made (nextHistoryIndex)
      if (compressedNextState) {
        newCache[nextHistoryIndex] = compressedNextState;
      }

      // cache pruning (simple LRU-like based on index)
      // keep state 0, prune oldest other states if limit exceeded
      const keys = Object.keys(newCache)
        .map(Number)
        .filter((k) => k !== 0)
        .sort((a, b) => a - b); // sort asc by index
      while (keys.length > MAX_CACHED_STATES) {
        const keyToRemove = keys.shift(); // remove lowest index (oldest non-zero)
        if (keyToRemove !== undefined) {
          delete newCache[keyToRemove];
        } else {
          break; // safety break
        }
      }

      updateCache(newCache); // update cache ref and trigger re-render
      setCurrentHistoryIndex(nextHistoryIndex); // move history forward

      if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); // blur focus
    },
    [canInteract, currentSortState, currentHistoryIndex, choiceLog, updateCache],
  );

  // handlers for back/forward history navigation
  const handleNavigation = useCallback(
    (direction: 'back' | 'forward') => {
      if (!isOpen || !isSessionLoaded || isComputing) return;
      const delta = direction === 'back' ? -1 : 1;
      const targetIndex = currentHistoryIndex + delta;

      // check boundaries
      if (direction === 'back' && targetIndex < 0) return;
      if (direction === 'forward' && targetIndex > choiceLog.length) return; // cannot go beyond logged choices

      setLastNavigationAction(direction);
      setCurrentHistoryIndex(targetIndex);

      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    },
    [isOpen, isSessionLoaded, isComputing, currentHistoryIndex, choiceLog.length],
  );

  /*
   * navigates back one step in the comparison history.
   */
  const handleBack = useCallback(() => handleNavigation('back'), [handleNavigation]);

  /*
   * navigates forward one step in the comparison history.
   */
  const handleForward = useCallback(() => handleNavigation('forward'), [handleNavigation]);

  /*
   * handler for applying the final ranking.
   * gets the sorted items, dispatches them to redux, updates the url, and closes the modal.
   */
  const handleApplyRanking = useCallback(() => {
    const stateForCheck = currentSortState;
    if (!canInteract || !stateForCheck || !stateForCheck.isComplete) {
      return; // only apply if complete and interactable
    }

    const sortedItems = getSortedItems(stateForCheck);

    if (sortedItems && sortedItems.length > 0) {
      // basic validation against original item count
      const expectedCount =
        activeInitialItemsRef.current?.filter((item) => !!item?.uid).length ?? 0;
      if (sortedItems.length !== expectedCount) {
        logger.warn(
          `count mismatch: getSortedItems returned ${sortedItems.length}, expected ${expectedCount}. state:`,
          stateForCheck,
        );
      }
      // ensure items have uids (fallback if necessary)
      const validItems = sortedItems.map((item, index) => ({
        ...item,
        uid: item.uid || `generated-uid-${index}-${Date.now()}`,
      }));

      dispatch(setRankedItems(validItems));
      updateUrlFromRankedItems(activeCategory, categories, validItems);
      onClose(); // close modal after applying
    } else {
      logger.error(
        'getSortedItems returned empty or null despite completion flag. state:',
        stateForCheck,
      );
      onClose(); // close modal even on error
    }
  }, [canInteract, currentSortState, dispatch, onClose, activeCategory, categories]);

  // derived state used for rendering the UI
  const progress = useMemo(() => {
    if (!isSessionLoaded || !currentSortState) return 0;

    const comparisonsMade = currentSortState.totalComparisons;
    // total potential = comparisons made + theoretical max remaining
    const maxPotentialTotal = comparisonsMade + currentSortState.maxRemainingComparisons;

    if (maxPotentialTotal <= 0) {
      return currentSortState.isComplete ? 100 : 0; // handle edge cases
    }

    // progress is comparisons made out of total potential
    return Math.min(100, Math.max(0, (comparisonsMade / maxPotentialTotal) * 100));
  }, [isSessionLoaded, currentSortState]);

  // the current comparison pair to display, if any
  const currentComparison = useMemo(
    () => (isSessionLoaded && currentSortState ? getCurrentComparison(currentSortState) : null),
    [isSessionLoaded, currentSortState],
  );

  // determines which choice was made at the current history step (used when navigating back/forward)
  const previousChoiceForThisStep = useMemo(
    () =>
      isSessionLoaded &&
      (lastNavigationAction === 'back' || lastNavigationAction === 'forward') && // only show when reviewing history
      currentHistoryIndex >= 0 &&
      currentHistoryIndex < choiceLog.length
        ? choiceLog[currentHistoryIndex]?.choice // show choice made *at* this step index
        : undefined,
    [isSessionLoaded, lastNavigationAction, currentHistoryIndex, choiceLog],
  );

  // navigation button states
  const canGoBack = isSessionLoaded && currentHistoryIndex > 0;
  const canGoForward = isSessionLoaded && currentHistoryIndex < choiceLog.length; // can go forward up to the last choice made

  return {
    categories,
    activeCategory,
    choiceLog,
    isComputing,
    isSessionLoaded,
    currentSortState,
    canInteract,
    progress,
    currentComparison,
    previousChoiceForThisStep,
    canGoBack,
    canGoForward,
    handleChoice,
    handleBack,
    handleForward,
    handleApplyRanking,
  };
};

export default useSorterSession;
