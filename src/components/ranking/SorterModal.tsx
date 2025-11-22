import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pako from 'pako';
import { CountryContestant } from '../../data/CountryContestant';
import { faChevronLeft, faChevronRight, faCheck, faCheckCircle, faCancel } from '@fortawesome/free-solid-svg-icons';
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
    getCurrentComparison
} from '../../utilities/SorterUtils'; // adjust path if necessary
import { LazyLoadedFlag } from '../LazyFlag';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import TooltipHelp from '../TooltipHelp';
import SorterContestantCard from './SorterContestantCard';

// modal constants
const MAX_CACHED_STATES = 25;

// component types
interface ChoiceLogEntry {
    comparisonIndex: number; // index within state.comparisons when choice was made
    choice: 'left' | 'right';
}

interface StateCache {
    [index: number]: Uint8Array; // index maps to comparison count (history index)
}

type NavigationAction = 'choice' | 'back' | 'forward' | 'init' | null;

interface SorterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialItems: CountryContestant[];
}

// json serialization helpers with support for map/set
const jsonReplacer = (key: string, value: any) => {
    if (value instanceof Map) return { __dataType: 'Map', value: Array.from(value.entries()) };
    if (value instanceof Set) return { __dataType: 'Set', value: Array.from(value.values()) };
    return value;
};

const jsonReviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.__dataType === 'Map') return new Map(value.value);
        if (value.__dataType === 'Set') return new Set(value.value);
        // add custom revival logic here if CountryContestant or other types need it
    }
    return value;
};


/*
 * compresses the full sorter state using pako (zlib).
 * returns null on error.
 */
const compressFullState = (state: SortState): Uint8Array | null => {
    try {
        const jsonString = JSON.stringify(state, jsonReplacer);
        const compressed = pako.deflate(jsonString);
        return compressed;
    } catch (e) {
        console.error("error compressing full state:", e);
        return null;
    }
};

/*
 * decompresses the sorter state using pako (zlib).
 * re-freezes array structures for consistency.
 * returns null on error or empty input.
 */
const decompressFullState = (compressedData: Uint8Array): SortState | null => {
    if (!compressedData || compressedData.length === 0) return null;
    try {
        const jsonString = pako.inflate(compressedData, { to: 'string' });
        const state = JSON.parse(jsonString, jsonReviver) as SortState;

        // re-freeze arrays after decompression
        const freezedState: SortState = {
            ...state,
            allItems: Object.freeze(state.allItems || []),
            comparisons: state.comparisons || [], // comparisons array is mutable within copies
            mergeStack: state.mergeStack ? Object.freeze(state.mergeStack.map(list => Object.freeze(list || []))) : Object.freeze([]),
            currentMergeStep: state.currentMergeStep ? {
                ...state.currentMergeStep,
                left: Object.freeze(state.currentMergeStep.left || []),
                right: Object.freeze(state.currentMergeStep.right || []),
                merged: state.currentMergeStep.merged || [], // merged array is mutable within steps
            } : null,
            currentRanking: state.currentRanking || [], // final ranking is a plain array copy
        };
        return freezedState;
    } catch (e) {
        console.error("error decompressing full state:", e);
        return null;
    }
};

/*
 * estimates the size of the compressed data in bytes.
 */
function estimateCompressedSize(data: Uint8Array): number {
    return data?.byteLength || 0;
}

/*
 * modal component for pairwise comparison sorting.
 * manages the sorting state, user choices, history (back/forward),
 * state caching with compression, and applying the final ranked list.
 */
const SorterModal: React.FC<SorterModalProps> = ({
    isOpen,
    onClose,
    initialItems,
}) => {
    const dispatch: AppDispatch = useAppDispatch();
    const categories = useAppSelector((state: AppState) => state.categories);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

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
        setCacheVersion(v => v + 1);
    }, []);

    // handles initialization and state resets based on modal visibility and input items
    useEffect(() => {
        const needsInitialization = isOpen && (
            !prevIsOpen.current || // modal just opened
            initialItems !== activeInitialItemsRef.current || // items changed
            !isSessionLoaded // previous session failed or was reset
        );

        if (needsInitialization && initialItems.length > 1) {
            setIsComputing(true); // indicate computation start
            setTimeout(() => { // yield thread for ui update
                const fullInitialState = initSortState(initialItems); // gets state ready for the first comparison

                if (!fullInitialState) {
                    console.error("initSortState returned null or undefined");
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
                setCacheVersion(v => v + 1); // update version
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
    const computeStateAtIndex = useCallback((targetIndex: number): SortState | null => {
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
        const cachedIndices = Object.keys(currentCache).map(Number).sort((a, b) => b - a); // sort descending

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
                            console.warn(`compute: cache index ${index} state mismatch. expected ${index} comparisons, found ${decompressed.totalComparisons}. discarding.`);
                            // optionally remove invalid cache entry: delete currentCache[index]; updateCache({...currentCache});
                        }
                    } else {
                        console.error(`compute: failed to decompress state for index ${index}.`);
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
                console.error(`compute error: missing log entry at index ${i} (target ${targetIndex}, start ${closestCachedIndex}).`);
                return currentState; // return last valid state computed
            }
            if (currentState.isComplete) {
                console.warn(`compute warning: state was complete at step ${i}, stopping replay for target ${targetIndex}.`);
                break; // stop if state became complete earlier than expected
            }

            // get the state *after* choice `i` was made
            const nextState = processChoice(currentState, logEntry.choice);
            if (!nextState) {
                console.error(`compute error: processChoice failed for step ${i} with choice ${logEntry.choice}.`);
                return currentState; // return last valid state
            }
            currentState = nextState;

            // safety check: ensure totalComparisons matches index after processing
            if (currentState.totalComparisons !== i + 1) {
                console.error(`compute error: state comparison count mismatch after step ${i}. expected ${i + 1}, got ${currentState.totalComparisons}.`);
                return currentState; // return state before mismatch
            }

            // optimization: if state becomes complete, stop replay
            if (currentState.isComplete && i < targetIndex - 1) {
                break;
            }
        }
        return currentState;
    }, [isSessionLoaded, choiceLog]); // depends on initialization and choice history


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
                console.error(`memo: decompression failed or state inconsistent for cached index ${currentHistoryIndex}. expected ${currentHistoryIndex}, got ${decompressed?.totalComparisons}. falling back to compute...`);
                // proceed to compute below
            }
        }

        // if cache miss or invalid, compute the state
        if (!isComputing) setIsComputing(true); // indicate computation start
        const computedState = computeStateAtIndex(currentHistoryIndex);
        if (isComputing) setIsComputing(false); // indicate computation end

        // validate computed state consistency (allow mismatch only if complete)
        if (computedState && computedState.totalComparisons !== currentHistoryIndex && !computedState.isComplete) {
            console.error(`memo: computed state inconsistent for index ${currentHistoryIndex}. expected ${currentHistoryIndex}, got ${computedState.totalComparisons}. state complete: ${computedState.isComplete}`);
        } else if (computedState && computedState.isComplete && computedState.totalComparisons < currentHistoryIndex) {
            console.warn(`memo: sorting completed at ${computedState.totalComparisons} comparisons, but history index is ${currentHistoryIndex}.`);
        }

        return computedState;
    }, [isSessionLoaded, currentHistoryIndex, cacheVersion, computeStateAtIndex, isComputing]); // dependencies


    // memoized calculation of current cache size in bytes
    const currentCacheSizeBytes = useMemo(() => {
        if (!isSessionLoaded) return 0;
        return Object.values(stateCacheRef.current)
            .reduce((sum, compressedState) => sum + estimateCompressedSize(compressedState), 0);
    }, [isSessionLoaded, cacheVersion]);


    // derived state for UI interaction checks
    const canInteract = isOpen && isSessionLoaded && !isComputing;


    /*
     * handles user selection of 'left' or 'right' item.
     * updates choice log, processes the choice using SorterUtils,
     * updates and prunes the state cache, and moves the history index forward.
     * if navigating forward into existing history with the same choice, just advances index.
     */
    const handleChoice = useCallback((choice: 'left' | 'right') => {
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
            console.error(`choice error: no comparisons found in state before choice.`);
            return;
        }
        const currentComparisonForLog = stateBeforeChoice.comparisons[comparisonIndexForLog];
        if (!currentComparisonForLog || currentComparisonForLog.choice) {
            console.warn(`choice warning: last comparison missing or already has choice. index: ${comparisonIndexForLog}`);
            // proceed anyway, SorterUtils might handle it
        }

        // get the state *after* the choice is processed
        const nextFullState = processChoice(stateBeforeChoice, choice);

        if (!nextFullState) {
            console.error("choice error: processChoice returned null/undefined.");
            return;
        }
        // verify comparison count incremented correctly
        if (nextFullState.totalComparisons !== stateBeforeChoice.totalComparisons + 1) {
            console.error(`choice error: comparison count mismatch. before: ${stateBeforeChoice.totalComparisons}, after: ${nextFullState.totalComparisons}`);
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
            console.error("cache: failed to compress next state.");
        }

        // update cache
        const currentCache = stateCacheRef.current;
        const newCache = { ...currentCache };

        // prune future cache entries (indices > current history index)
        Object.keys(newCache).map(Number).forEach(index => {
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
        const keys = Object.keys(newCache).map(Number).filter(k => k !== 0).sort((a, b) => a - b); // sort asc by index
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

    }, [
        canInteract,
        currentSortState,
        currentHistoryIndex,
        choiceLog,
        updateCache
    ]);


    // handlers for back/forward history navigation
    const handleNavigation = useCallback((direction: 'back' | 'forward') => {
        if (!isOpen || !isSessionLoaded || isComputing) return;
        const delta = direction === 'back' ? -1 : 1;
        const targetIndex = currentHistoryIndex + delta;

        // check boundaries
        if (direction === 'back' && targetIndex < 0) return;
        if (direction === 'forward' && targetIndex > choiceLog.length) return; // cannot go beyond logged choices

        setLastNavigationAction(direction);
        setCurrentHistoryIndex(targetIndex);

        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }, [isOpen, isSessionLoaded, isComputing, currentHistoryIndex, choiceLog.length]);

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
            const expectedCount = activeInitialItemsRef.current?.filter(item => !!item?.uid).length ?? 0;
            if (sortedItems.length !== expectedCount) {
                console.warn(`count mismatch: getSortedItems returned ${sortedItems.length}, expected ${expectedCount}. state:`, stateForCheck);
            }
            // ensure items have uids (fallback if necessary)
            const validItems = sortedItems.map((item, index) => ({
                ...item,
                uid: item.uid || `generated-uid-${index}-${Date.now()}`
            }));

            dispatch(setRankedItems(validItems));
            updateUrlFromRankedItems(activeCategory, categories, validItems);
            onClose(); // close modal after applying
        } else {
            console.error("getSortedItems returned empty or null despite completion flag. state:", stateForCheck);
            onClose(); // close modal even on error
        }
    }, [
        canInteract,
        currentSortState,
        dispatch,
        onClose,
        activeCategory,
        categories
    ]);

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
    const currentComparison = useMemo(() => (
        isSessionLoaded && currentSortState ? getCurrentComparison(currentSortState) : null
    ), [isSessionLoaded, currentSortState]);

    // determines which choice was made at the current history step (used when navigating back/forward)
    const previousChoiceForThisStep = useMemo(() => (
        isSessionLoaded &&
            (lastNavigationAction === 'back' || lastNavigationAction === 'forward') && // only show when reviewing history
            currentHistoryIndex >= 0 &&
            currentHistoryIndex < choiceLog.length
            ? choiceLog[currentHistoryIndex]?.choice // show choice made *at* this step index
            : undefined
    ), [isSessionLoaded, lastNavigationAction, currentHistoryIndex, choiceLog]);

    // navigation button states
    const canGoBack = isSessionLoaded && currentHistoryIndex > 0;
    const canGoForward = isSessionLoaded && currentHistoryIndex < choiceLog.length; // can go forward up to the last choice made

    // --- render ---

    let content;
    let comparisonDenominator: number | string = '?';
    if (currentSortState) {
        comparisonDenominator = currentSortState.totalComparisons + currentSortState.maxRemainingComparisons;
    }

    // show loading indicators first
    if (isComputing) {
        content = <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">Loading...</div>;
    } else if (isOpen && !isSessionLoaded && initialItems.length > 1) {
        // initializing message
        content = <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">Initializing sorter...</div>;
    } else if (isOpen && initialItems.length <= 1) {
        // message for insufficient items
        content = <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">Need at least two items to sort.</div>;
    } else if (isSessionLoaded && currentSortState?.isComplete) {
        // render completion screen
        const finalRanking = currentSortState ? getSortedItems(currentSortState) : [];

        content = (
            <>
                {/* Fixed header content */}
                <div className="flex-shrink-0 w-full flex flex-col items-center px-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-[#119822]x text-[var(--er-accent-success)] mb-3" />
                    <p className="mb-2 text-[var(--er-text-secondary)] text-sm">
                        Your ranking is ready based on {currentSortState.totalComparisons} choices!
                    </p>
                    <h4 className="text-md font-semibold text-[var(--er-text-secondary)] mb-3">Your Complete Ranking:</h4>
                </div>

                {/* Scrollable list */}
                {finalRanking.length > 0 && (
                    <div className="w-full max-w-md mx-auto flex-1 min-h-0 overflow-y-auto px-6 pr-2 mb-4">
                        <ol className="list-none p-0 m-0 space-y-3">
                            {finalRanking.map((item, index) => {
                                const rank = index + 1;
                                // Medal colors for top 3
                                let rankBoxColor = 'bg-[var(--er-surface-accent)]'; // default
                                if (rank === 1) rankBoxColor = 'bg-[var(--er-interactive-primary)]'; // gold
                                else if (rank === 2) rankBoxColor = 'bg-[var(--er-gradient-text-2)]'; // silver
                                else if (rank === 3) rankBoxColor = 'bg-[var(--er-gradient-text-3)]'; // bronze

                                return (
                                    <li
                                        key={item.uid || index}
                                        className="flex items-stretch bg-[var(--er-surface-accent-70)] rounded-lg shadow-md overflow-hidden"
                                    >
                                        {/* Rank box */}
                                        <div className={classNames(
                                            "flex items-center justify-center min-w-[3.5rem] px-2",
                                            rankBoxColor
                                        )}>
                                            <span className="text-xl font-bold text-white">{rank}</span>
                                        </div>

                                        {/* Flag box */}
                                        <div className="flex items-center justify-center px-3 py-2">
                                            {item.country?.key && (
                                                <LazyLoadedFlag
                                                    code={item.country.key}
                                                    className="w-12 h-auto rounded-sm"
                                                />
                                            )}
                                        </div>

                                        {/* Text content */}
                                        <div className="flex flex-col justify-center flex-1 px-4 py-2 min-w-0">
                                            <span className="text-[var(--er-text-primary)] font-semibold truncate">
                                                {item.contestant?.artist || 'Unknown Artist'}
                                            </span>
                                            {item.contestant?.song && (
                                                <span className="text-sm text-[var(--er-text-secondary)] truncate">
                                                    "{item.contestant.song}"
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}

                {/* Fixed footer text */}
                <p className="text-sm text-[var(--er-text-tertiary)] flex-shrink-0 px-4 pb-4 text-center">
                    You can go back to review choices, cancel, or apply this ranking.
                </p>
            </>
        );
    } else if (isSessionLoaded && currentComparison) {
        // render active comparison screen
        content = (
            <div className="flex flex-col justify-start items-center gap-2 mb-2 min-h-[20em] px-[0.1em] pt-1 w-full overflow-hidden min-w-0">
                {/* left choice card */}
                <div
                    onClick={() => handleChoice('left')}
                    className={classNames(
                        "w-full max-w-full cursor-pointer transition-colors duration-200 rounded-lg overflow-hidden min-w-0",
                        { "md:hover:ring-2 md:hover:ring-[var(--r-accent-ring)] active:ring-2 active:ring-[var(--r-accent-ring)]": canInteract },
                        { "pointer-events-none opacity-75": !canInteract }
                    )}
                >
                    <SorterContestantCard
                        countryContestant={currentComparison.leftItem}
                        showAsPreviousChoice={previousChoiceForThisStep === 'left'}
                    />
                </div>

                <div className="text-md font-bold text-[var(--er-text-secondary)] my-1">vs</div>

                {/* right choice card */}
                <div
                    onClick={() => handleChoice('right')}
                    className={classNames(
                        "w-full max-w-full cursor-pointer transition-colors duration-200 rounded-lg overflow-hidden",
                        { "md:hover:ring-2 md:hover:ring-[var(--r-accent-ring)] active:ring-2 active:ring-[var(--r-accent-ring)]": canInteract },
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
        // fallback view if state is indeterminate
        content = <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">Preparing comparison...</div>;
    } else {
        // default view (or null) if modal open but nothing else matches
        content = null;
    }


    // modal structure
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            closeWarning={'You have unsaved progress. Are you sure you want to close?'}
            shouldCloseWarn={isOpen && isSessionLoaded && !currentSortState?.isComplete && choiceLog.length > 0}
            className="!max-h-[95vh] w-[calc(100%-2rem)] max-w-2xl sort-tour-step-modal px-0 py-1"
        >
            <div className="flex flex-col max-h-[calc(95vh-2rem)] h-full bg-[var(--er-surface-dark)] text-[var(--er-text-primary)] overflow-hidden min-w-0">
                {/* header */}
                <div className={classNames("flex-shrink-0 px-4", currentSortState?.isComplete ? "pt-1" : "pt-3")}>
                    {/* title and category */}
                    <div className={classNames(currentSortState?.isComplete ? "mb-1" : "mb-4")}>
                        <div className="flex items-center justify-between">
                            <h2 className={classNames("text-xl font-bold text-center w-full text-[var(--er-text-secondary)]")}>
                                {isSessionLoaded && !currentSortState?.isComplete &&
                                    <TooltipHelp
                                        content="Answer with your preferences and a ranking will be generated"
                                        className="text-[var(--er-text-secondary)] align-middle mb-1 mr-2"
                                        place='bottom-start'
                                    />
                                }
                                {isSessionLoaded && currentSortState?.isComplete ? "Ranking Complete" : "Choose Your Preference"}
                            </h2>
                        </div>
                        {activeCategory !== undefined && categories[activeCategory]?.name &&
                            <div className="items-center w-full mb-0 text-center text-[var(--er-text-tertiary)] text-sm">
                                {categories[activeCategory]?.name}
                            </div>
                        }
                    </div>

                    {/* progress bar area */}
                    {/* show progress bar only when sorting is active */}
                    {!currentSortState?.isComplete && isSessionLoaded && (
                        <div className="mb-3">
                            <div className="w-full bg-[var(--er-button-secondary-hover)] rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-[var(--er-interactive-secondary)] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="text-xs text-[var(--er-text-tertiary)] text-right mt-1 min-h-[1em]">
                                {currentSortState ? (
                                    <span>
                                        Comparisons: {currentSortState.totalComparisons} / ~{comparisonDenominator}
                                        {isComputing && <span className="ml-2 text-orange-400">(Computing...)</span>}
                                    </span>
                                ) : (
                                    <span> </span> // non-breaking space for placeholder
                                )}
                            </div>
                        </div>
                    )}
                    {/* maintain space when progress bar is hidden to prevent layout shifts */}
                    {currentSortState?.isComplete && <div className="h-[0.5rem]"></div>}


                </div>

                {/* main content (scrollable) */}
                <div className={classNames(
                    "flex-grow px-0 py-0 pt-0",
                    currentSortState?.isComplete ? "flex flex-col overflow-hidden" : "overflow-y-auto"
                )}>
                    {content}
                </div>

                {/* footer buttons */}
                <div className="flex-shrink-0 mt-auto px-4 pb-3 pt-3 border-t border-[var(--er-border-subtle)]">
                    {isSessionLoaded && currentSortState?.isComplete ? (
                        // footer buttons for completed state
                        <div className="flex justify-center items-center space-x-4">
                            {/* back button (completed) */}
                            <IconButton
                                onClick={handleBack}
                                disabled={!canGoBack || !canInteract}
                                className={classNames(
                                    "px-4 py-2 text-sm text-white rounded",
                                    (!canGoBack || !canInteract)
                                        ? "bg-gray-600 text-[var(--er-text-subtle)] cursor-not-allowed"
                                        : "bg-[var(--er-interactive-secondary)] hover:bg-[var(--er-button-primary-hover)]"
                                )}
                                title="Back"
                                icon={faChevronLeft}
                            />

                            {/* cancel button (completed) */}
                            <IconButton
                                onClick={onClose}
                                disabled={isComputing}
                                className="px-4 pr-4 py-2 text-sm text-white  bg-[var(--er-button-secondary)] rounded hover:bg-[var(--er-button-secondary-hover)] disabled:bg-gray-700 disabled:text-[var(--er-text-muted)]"
                                title="Cancel"
                                icon={faCancel}
                            />

                            {/* apply button (completed) */}
                            <IconButton
                                onClick={handleApplyRanking}
                                disabled={!canInteract || !currentSortState?.isComplete}
                                className="pr-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-700 disabled:text-[var(--er-text-subtle)]"
                                title="Apply"
                                icon={faCheck}
                            />

                            {/* forward button (completed, conditional) */}
                            {/* wrapper to maintain layout width when forward button is hidden */}
                            <div className="w-[58px]x flex justify-center">
                                {canGoForward &&
                                    <IconButton
                                        onClick={handleForward}
                                        disabled={!canGoForward || !canInteract}
                                        className={classNames(
                                            "px-4 py-2 text-sm text-white rounded",
                                            (!canGoForward || !canInteract)
                                                ? "bg-gray-600 text-[var(--er-text-subtle)] cursor-not-allowed"
                                                : "bg-[var(--er-interactive-secondary)] hover:bg-[var(--er-button-primary-hover)]"
                                        )}
                                        title="Forward"
                                        icon={faChevronRight}
                                    />
                                }
                            </div>
                        </div>
                    ) : (
                        // footer buttons for active comparison state
                        isSessionLoaded && currentComparison && (
                            <div className="flex justify-between items-center mt-1">
                                {/* back button area */}
                                <div className="w-1/3 flex justify-start">
                                    <IconButton
                                        onClick={handleBack}
                                        disabled={!canGoBack || !canInteract}
                                        className={classNames(
                                            "flex items-center px-4 py-2 text-sm rounded text-white",
                                            (!canGoBack || !canInteract)
                                                ? "bg-gray-600 text-[var(--er-text-subtle)] cursor-not-allowed"
                                                : "bg-[var(--er-interactive-secondary)] hover:bg-[var(--er-button-primary-hover)]",
                                            !canGoBack && "invisible" // hide but maintain space
                                        )}
                                        title="Back"
                                        icon={faChevronLeft}
                                    />
                                </div>

                                {/* cancel button area */}
                                <div className="w-1/3 flex justify-center">
                                    <IconButton
                                        onClick={onClose}
                                        disabled={isComputing}
                                        className="px-4 pr-4 py-2 text-sm text-white  bg-[var(--er-button-secondary)] rounded hover:bg-[var(--er-button-secondary-hover)] disabled:bg-gray-700 disabled:text-[var(--er-text-muted)]"
                                        title="Cancel"
                                        icon={faCancel}
                                    />
                                </div>

                                {/* forward button area */}
                                <div className="w-1/3 flex justify-end">
                                    <IconButton
                                        onClick={handleForward}
                                        disabled={!canGoForward || !canInteract}
                                        className={classNames(
                                            "flex items-center px-4 py-2 text-sm rounded text-white",
                                            (!canGoForward || !canInteract)
                                                ? "bg-gray-600 text-[var(--er-text-subtle)] cursor-not-allowed"
                                                : "bg-[var(--er-interactive-secondary)] hover:bg-[var(--er-button-primary-hover)]",
                                            !canGoForward && "invisible" // hide but maintain space
                                        )}
                                        title="Forward"
                                        icon={faChevronRight}
                                    />
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