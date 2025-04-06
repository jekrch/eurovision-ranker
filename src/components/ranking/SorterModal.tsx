import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pako from 'pako';
import { CountryContestant } from '../../data/CountryContestant';
import { faChevronLeft, faChevronRight, faTimes, faCheck, faCheckCircle, faCancel } from '@fortawesome/free-solid-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { AppDispatch, AppState } from '../../redux/store';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import classNames from 'classnames';
import { setRankedItems } from '../../redux/rootSlice';
import {
  initSortState,
  processChoice,
  getSortedItems,
  SortState,
  ActionType,
} from '../../utilities/SorterUtils';
import { LazyLoadedFlag } from '../LazyFlag';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import TooltipHelp from '../TooltipHelp';
import SorterContestantCard from './SorterContestantCard';

// constants
const MAX_CACHED_STATES = 25;
const TOP_N_PREVIEW = 3; // number of top items to show in the final preview

// types
interface ChoiceLogEntry {
  comparisonIndex: number;
  choice: 'left' | 'right';
}

interface StateCache {
  [index: number]: Uint8Array;
}

type NavigationAction = 'choice' | 'back' | 'forward' | 'init' | null;

interface SorterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems: CountryContestant[];
}

// compression helper functions - unchanged
const jsonReplacer = (key: string, value: any) => {
  if (value instanceof Map) return { __dataType: 'Map', value: Array.from(value.entries()) };
  if (value instanceof Set) return { __dataType: 'Set', value: Array.from(value.values()) };
  return value;
};

const jsonReviver = (key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.__dataType === 'Map') return new Map(value.value);
    if (value.__dataType === 'Set') return new Set(value.value);
  }
  return value;
};

const compressFullState = (state: SortState): Uint8Array | null => {
  try {
    const jsonString = JSON.stringify(state, jsonReplacer);
    return pako.deflate(jsonString);
  } catch (e) {
    console.error("error compressing full state:", e);
    return null;
  }
};

const decompressFullState = (compressedData: Uint8Array): SortState | null => {
  if (!compressedData || compressedData.length === 0) return null;
  try {
    const jsonString = pako.inflate(compressedData, { to: 'string' });
    return JSON.parse(jsonString, jsonReviver) as SortState;
  } catch (e) {
    console.error("error decompressing full state:", e);
    return null;
  }
};

function estimateCompressedSize(data: Uint8Array): number {
  return data?.byteLength || 0;
}

// component
const SorterModal: React.FC<SorterModalProps> = ({
  isOpen,
  onClose,
  initialItems,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

  // state
  const initialSortStateRef = useRef<SortState | null>(null);
  const [choiceLog, setChoiceLog] = useState<ChoiceLogEntry[]>([]);
  const stateCacheRef = useRef<StateCache>({});
  const [cacheVersion, setCacheVersion] = useState<number>(0);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const [lastNavigationAction, setLastNavigationAction] = useState<NavigationAction>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(false);

  // refs to track changes triggering re-initialization
  const prevIsOpen = useRef(isOpen);
  const activeInitialItemsRef = useRef<CountryContestant[] | null>(null);

  // helper to update cache ref and trigger re-render via cacheVersion
  const updateCache = useCallback((newCache: StateCache) => {
    stateCacheRef.current = newCache;
    setCacheVersion(v => v + 1);
  }, []);

  // initialization & state management based on isOpen and initialItems
  useEffect(() => {
    const needsInitialization = isOpen && (
      !prevIsOpen.current ||
      initialItems !== activeInitialItemsRef.current ||
      !isSessionLoaded
    );

    if (needsInitialization && initialItems.length > 1) {
      const fullInitialState = initSortState(initialItems);

      if (!fullInitialState) {
         console.error("initSortState returned null");
         setIsSessionLoaded(false);
         setChoiceLog([]);
         stateCacheRef.current = {};
         setCacheVersion(0);
         setCurrentHistoryIndex(0);
         setLastNavigationAction(null);
         initialSortStateRef.current = null;
         activeInitialItemsRef.current = null;
         return;
      }

      initialSortStateRef.current = fullInitialState;
      activeInitialItemsRef.current = initialItems;
      const compressedInitial = compressFullState(fullInitialState);

      setChoiceLog([]);
      stateCacheRef.current = compressedInitial ? { 0: compressedInitial } : {};
      setCacheVersion(v => v + 1);
      setCurrentHistoryIndex(0);
      setLastNavigationAction('init');
      setIsComputing(false);
      setIsSessionLoaded(true);
    } else if (isOpen && initialItems.length <= 1) {
      setIsSessionLoaded(false);
      setChoiceLog([]);
      stateCacheRef.current = {};
      setCacheVersion(0);
      setCurrentHistoryIndex(0);
      setLastNavigationAction(null);
      initialSortStateRef.current = null;
      activeInitialItemsRef.current = null;
    } else if (!isOpen && prevIsOpen.current) {
       // closing, state persists
    }

    prevIsOpen.current = isOpen;
  }, [isOpen, initialItems, isSessionLoaded, updateCache]);


  // state computation logic
  const computeStateAtIndex = useCallback((targetIndex: number): SortState | null => {
    const fullInitialState = initialSortStateRef.current;
    if (!isSessionLoaded || !fullInitialState) return null;
    if (targetIndex === 0) return fullInitialState;

    let closestCachedIndex = -1;
    let startState: SortState | null = null;
    const currentCache = stateCacheRef.current;
    const cachedIndices = Object.keys(currentCache).map(Number).sort((a, b) => b - a);

    for (const index of cachedIndices) {
      if (index < targetIndex) {
        const compressedData = currentCache[index];
        if (compressedData) {
          const decompressed = decompressFullState(compressedData);
          if (decompressed) {
            startState = decompressed;
            closestCachedIndex = index;
            break;
          } else {
            console.error(`compute: failed to decompress state for earlier index ${index}.`);
          }
        }
      }
    }

    if (!startState) {
      startState = fullInitialState;
      closestCachedIndex = 0;
    }

    let currentState = startState;
    for (let i = closestCachedIndex; i < targetIndex; i++) {
      const logEntry = choiceLog[i];
      if (!logEntry) {
        console.error(`compute error: missing log entry at index ${i} (target ${targetIndex})`);
        return currentState;
      }
      const nextState = processChoice(currentState, logEntry.choice);
      if (!nextState) {
        console.error(`compute error: processChoice failed for step ${i}`);
        return currentState;
      }
      currentState = nextState;
      if (currentState.action === ActionType.DONE && i < targetIndex - 1) {
        break;
      }
    }
    return currentState;
  }, [isSessionLoaded, choiceLog]);


  // memoized current state
  const currentSortState = useMemo((): SortState | null => {
    if (!isSessionLoaded) {
      return null;
    }
    const compressedData = stateCacheRef.current[currentHistoryIndex];
    if (compressedData) {
      setIsComputing(false);
      const decompressed = decompressFullState(compressedData);
      if (!decompressed) {
        console.error(`memo: decompression failed for cached index ${currentHistoryIndex}. falling back to compute...`);
      } else {
        return decompressed;
      }
    }
    setIsComputing(true);
    const computedState = computeStateAtIndex(currentHistoryIndex);
    setIsComputing(false);
    return computedState;
  }, [isSessionLoaded, currentHistoryIndex, cacheVersion, computeStateAtIndex]);


  // memoized cache size calculation
  const currentCacheSizeBytes = useMemo(() => {
    if (!isSessionLoaded) return 0;
    return Object.values(stateCacheRef.current)
      .reduce((sum, compressedState) => sum + estimateCompressedSize(compressedState), 0);
  }, [isSessionLoaded, cacheVersion]);


  // derived state for UI control and checks
  const canInteract = isOpen && isSessionLoaded && !isComputing;


  // event handlers
  const handleChoice = useCallback((choice: 'left' | 'right') => {
    const stateForCheck = currentSortState;
    if (!canInteract || !stateForCheck || stateForCheck.isComplete) {
      return;
    }

    if (currentHistoryIndex < choiceLog.length) {
      const historicalEntry = choiceLog[currentHistoryIndex];
      if (historicalEntry?.choice === choice) {
        setLastNavigationAction('forward');
        setCurrentHistoryIndex(currentHistoryIndex + 1);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
    }

    setLastNavigationAction('choice');
    const stateBeforeChoice = stateForCheck;
    const comparisonIndexForLog = stateBeforeChoice.currentIndex;

    if (comparisonIndexForLog < 0 || comparisonIndexForLog >= stateBeforeChoice.comparisons.length) {
      console.error(`choice error: invalid comparison index (${comparisonIndexForLog}) in current state.`);
      return;
    }

    const nextFullState = processChoice(stateBeforeChoice, choice);
    if (!nextFullState) {
      console.error("choice error: processChoice returned null/undefined after choice.");
      return;
    }

    const nextHistoryIndex = currentHistoryIndex + 1;
    const newLogEntry: ChoiceLogEntry = { comparisonIndex: comparisonIndexForLog, choice };
    const compressedNextState = compressFullState(nextFullState);
    const newChoiceLog = [...choiceLog.slice(0, currentHistoryIndex), newLogEntry];
    setChoiceLog(newChoiceLog);

    const currentCache = stateCacheRef.current;
    const newCache = { ...currentCache };
    Object.keys(newCache).map(Number).forEach(index => {
      if (index > currentHistoryIndex) {
        delete newCache[index];
      }
    });

    if (compressedNextState) {
      newCache[nextHistoryIndex] = compressedNextState;
    } else {
      console.error("cache: failed to compress next state. cache not updated for this step.");
    }

    const keys = Object.keys(newCache).map(Number).filter(k => k !== 0).sort((a, b) => a - b);
    while (keys.length > MAX_CACHED_STATES) {
      const keyToRemove = keys.shift();
      if (keyToRemove !== undefined) {
        delete newCache[keyToRemove];
      } else {
        break;
      }
    }
    updateCache(newCache);
    setCurrentHistoryIndex(nextHistoryIndex);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

  }, [
      canInteract,
      currentSortState,
      currentHistoryIndex,
      choiceLog,
      updateCache
  ]);

  // navigation handlers
  const handleNavigation = useCallback((direction: 'back' | 'forward') => {
    if (!isOpen || !isSessionLoaded || isComputing) return;
    const delta = direction === 'back' ? -1 : 1;
    const targetIndex = currentHistoryIndex + delta;
    if (direction === 'back' && targetIndex < 0) return;
    if (direction === 'forward' && targetIndex > choiceLog.length) return;
    setLastNavigationAction(direction);
    setCurrentHistoryIndex(targetIndex);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, [isOpen, isSessionLoaded, isComputing, currentHistoryIndex, choiceLog.length]);

  const handleBack = useCallback(() => handleNavigation('back'), [handleNavigation]);
  const handleForward = useCallback(() => handleNavigation('forward'), [handleNavigation]);

  // apply ranking handler
  const handleApplyRanking = useCallback(() => {
    const stateForCheck = currentSortState;
    if (!canInteract || !stateForCheck || !stateForCheck.isComplete) return;

    const sortedItems = getSortedItems(stateForCheck);
    if (sortedItems.length > 0) {
      const expectedCount = activeInitialItemsRef.current?.length ?? 0;
      if (sortedItems.length !== expectedCount) {
        console.warn(`count mismatch: getSortedItems returned ${sortedItems.length}, expected ${expectedCount}`);
      }
      const validItems = sortedItems.map((item, index) => ({
        ...item,
        uid: item.uid || `item-${index}-${Date.now()}`
      }));
      dispatch(setRankedItems(validItems));
      updateUrlFromRankedItems(activeCategory, categories, validItems);
      onClose();
    } else {
      console.error("getSortedItems returned no items despite completion flag.");
      onClose();
    }
  }, [
    canInteract,
    currentSortState,
    dispatch,
    onClose,
    activeCategory,
    categories
  ]);

  // derived state for UI rendering
  const progress = useMemo(() => {
    if (!isSessionLoaded ||
        !currentSortState ||
        currentSortState.estimatedTotalComparisons <= 0) return 0;
    const comparisonsMade = currentSortState.totalComparisons;
    return Math.min(100, (comparisonsMade / currentSortState.estimatedTotalComparisons) * 100);
  }, [isSessionLoaded, currentSortState]);

  const currentComparison = useMemo(() => (
    isSessionLoaded &&
    currentSortState &&
    currentSortState.action === ActionType.COMPARE &&
    currentSortState.currentIndex >= 0 &&
    currentSortState.currentIndex < currentSortState.comparisons.length
      ? currentSortState.comparisons[currentSortState.currentIndex]
      : null
  ), [isSessionLoaded, currentSortState]);

  const previousChoiceForThisStep = useMemo(() => (
    isSessionLoaded &&
    (lastNavigationAction === 'back' || lastNavigationAction === 'forward') &&
    currentHistoryIndex >= 0 &&
    currentHistoryIndex < choiceLog.length
      ? choiceLog[currentHistoryIndex]?.choice
      : undefined
  ), [isSessionLoaded, lastNavigationAction, currentHistoryIndex, choiceLog]);

  const canGoBack = isSessionLoaded && currentHistoryIndex > 0;
  const canGoForward = isSessionLoaded && currentHistoryIndex < choiceLog.length;

  // --- render logic ---

  let content;

  if (isComputing) {
    content = <div className="text-center p-8 text-slate-400 min-h-[20em] flex items-center justify-center">Loading...</div>;
  } else if (isOpen && !isSessionLoaded && initialItems.length > 1) {
    content = <div className="text-center p-8 text-slate-400 min-h-[20em] flex items-center justify-center">Initializing sorter...</div>;
  } else if (isOpen && initialItems.length <= 1) {
    content = <div className="text-center p-8 text-slate-400 min-h-[20em] flex items-center justify-center">Need at least two items to sort.</div>;
  } else if (isSessionLoaded && currentSortState?.isComplete) {
    // improved completed view
    const finalRanking = currentSortState ? getSortedItems(currentSortState) : [];
    const topItems = finalRanking.slice(0, TOP_N_PREVIEW);

    content = (
      <div className="flex flex-col items-center justify-center px-4 pb-6 min-h-[20em] text-center">
        {/* large checkmark */}
        <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-[#119822] mb-4" />

        {/* completion message */}
        <p className="mb-6 text-slate-300">
          Your ranking is ready based on your choices!
        </p>

        {/* show top choices preview */}
        {topItems.length > 0 && (
          <div className="mb-6 w-full max-w-xs">
            <h4 className="text-md font-semibold text-slate-300 mb-3">Your Top {topItems.length}:</h4>
            <ol className="list-none p-0 m-0 space-y-2">
              {topItems.map((item, index) => (
                <li key={item.uid || index} className="flex items-center justify-start bg-slate-700/50 p-2 rounded">
                  <span className="text-lg font-bold text-slate-400 w-6 mr-3">{index + 1}.</span>
                  <LazyLoadedFlag code={item.country.key} className="w-6 h-auto mr-3 rounded-sm" />
                  <span className="text-slate-200 truncate">
                    <span className="text-xs text-slate-400 ml-auto truncate">
                      {item.contestant?.artist} - {item.contestant?.song}
                    </span>
                  </span>                
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-sm text-slate-400">
          You can go back to review choices, cancel, or apply this ranking.
        </p>
      </div>
    );
  } else if (isSessionLoaded && currentComparison) {
    // render comparison cards
    content = (
      <div className="flex flex-col justify-start items-center gap-2 mb-2 min-h-[20em] px-[0.1em]">
        <div
          onClick={() => handleChoice('left')}
          className={classNames(
            "w-full cursor-pointer transition-colors duration-200 rounded-lg",
            { "md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400": canInteract },
            { "pointer-events-none opacity-75": !canInteract }
          )}
        >
          <SorterContestantCard
            countryContestant={currentComparison.leftItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'left'}
          />
        </div>
        <div className="text-md font-bold text-slate-300 my-1">vs</div>
        <div
          onClick={() => handleChoice('right')}
          className={classNames(
            "w-full cursor-pointer transition-colors duration-200 rounded-lg",
            { "md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400": canInteract },
            { "pointer-events-none opacity-75": !canInteract }
          )}
        >
          <SorterContestantCard
            countryContestant={currentComparison.rightItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'right'}
          />
        </div>
      </div>
    );
  } else if (isSessionLoaded) {
    // fallback if session is loaded but no comparison/completion state yet
    content = <div className="text-center p-8 text-slate-400 min-h-[20em] flex items-center justify-center">Preparing comparison...</div>;
  } else {
    content = null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      closeWarning={'You have unsaved changes. Are you sure you want to close?'}
      shouldCloseWarn={isOpen && isSessionLoaded && !currentSortState?.isComplete}
      className="!max-h-[95vh] sort-tour-step-modal px-0 py-0"
    >
      <div className="flex flex-col max-h-[calc(95vh-2rem)] h-full">
        {/* header */}
        <div className="flex-shrink-0 px-4 pt-4">
          {/* title, category */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className={classNames("text-xl font-bold text-center w-full text-slate-300")}>
              {isSessionLoaded && !currentSortState?.isComplete &&
                  <TooltipHelp
                    content="Answer with your preferences and a ranking will be generated"
                    className="text-slate-300 align-middle mb-1 mr-2"
                    place='bottom-start'
                  />
                }
                {isSessionLoaded && currentSortState?.isComplete ? "Ranking Complete" : "Choose Your Preference"}
              </h2>
            </div>
            {activeCategory !== undefined && categories[activeCategory]?.name &&
              <div className="items-center w-full mb-0 text-center text-slate-400 text-sm">
                {categories[activeCategory]?.name}
              </div>
            }
          </div>

          {/* progress bar & counts */}
          {/* hide progress bar when complete */}
          {!currentSortState?.isComplete && isSessionLoaded && (
            <div className="mb-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 text-right mt-1 min-h-[1em]">
                {isOpen && !isSessionLoaded && initialItems.length > 1 ? (
                  <span>Loading...</span>
                ) : isSessionLoaded && currentSortState ? (
                  <span>
                    Comparisons: {currentSortState.totalComparisons} /
                    ~{currentSortState.estimatedTotalComparisons}
                    {isComputing && <span className="ml-2 text-orange-400">(Computing...)</span>}
                  </span>
                ) : (
                  <span>  </span>
                )}
              </div>
            </div>
          )}
          {/* add some space below header even when progress bar hidden */}
          {currentSortState?.isComplete && <div className="h-3"></div>}

        </div>

        {/* main content area - scrolls if needed */}
        <div className="flex-grow overflow-y-auto px-0 py-0 pt-1">
          {content}
        </div>

        {/* footer buttons */}
        <div className="flex-shrink-0 mt-auto px-4 pb-4 pt-2">
          {isSessionLoaded && currentSortState?.isComplete ? (
            // footer buttons for completed state
            <div className="flex justify-center items-center space-x-4">
              <IconButton
                onClick={handleBack}
                disabled={!canGoBack || !canInteract}
                className={classNames(
                  "px-4 pr-4 py-2 text-sm text-white rounded",
                  (!canGoBack || !canInteract)
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
                title="Back"
                icon={faChevronLeft}
              />

              <IconButton
                onClick={onClose}
                disabled={isComputing}
                className="px-4 pr-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500"
                title="Cancel" // more explicit title
                icon={faCancel}
              />

              <IconButton
                onClick={handleApplyRanking}
                disabled={!canInteract || !currentSortState?.isComplete}
                className="px-5 pr-4 py-2 text-sm font-semibold text-white bg-[#2A7221] rounded hover:bg-[#119822] disabled:bg-gray-700 disabled:text-gray-500"
                title="Apply Ranking"
                icon={faCheck}
              />

              {canGoForward &&
                <IconButton
                  onClick={handleForward}
                  disabled={!canGoForward || !canInteract}
                  className={classNames(
                    "px-4 py-2 text-sm text-white rounded",
                    (!canGoForward || !canInteract)
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                  title="Forward"
                  icon={faChevronRight}
                />
              }
            </div>
          ) : (
            // footer buttons for active comparison state
            isSessionLoaded && currentComparison && (
              <div className="flex justify-between items-center mt-1">
                <div className="w-1/3 flex justify-start">
                  {canGoBack && (
                    <IconButton
                      onClick={handleBack}
                      disabled={!canGoBack || !canInteract}
                      className={classNames(
                        "flex items-center px-4 py-2 text-sm rounded text-white",
                        (!canGoBack || !canInteract)
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                      title="Back"
                      icon={faChevronLeft}
                    />
                  )}
                </div>

                <div className="w-1/3 flex justify-center">
                  <IconButton
                    onClick={onClose}
                    disabled={isComputing}
                    className="px-4 py-2 pr-[1.2em] text-sm text-white bg-gray-500 rounded hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500"
                    title="Cancel"
                    icon={faCancel}
                  />
                </div>

                <div className="w-1/3 flex justify-end">
                  {canGoForward && (
                    <IconButton
                      onClick={handleForward}
                      disabled={!canGoForward || !canInteract}
                      className={classNames(
                        "flex items-center px-4 py-2 text-sm rounded text-white",
                        (!canGoForward || !canInteract)
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      )}
                      title="Forward"
                      icon={faChevronRight}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SorterModal;