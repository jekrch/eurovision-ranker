import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import pako from 'pako';
import { CountryContestant } from '../../data/CountryContestant';
import { faChevronLeft, faChevronRight, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
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
import { getYoutubeThumbnail } from '../../utilities/YoutubeUtil';
import Modal from '../modals/Modal';
import IconButton from '../IconButton';
import { FaYoutube } from 'react-icons/fa';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import TooltipHelp from '../TooltipHelp';

// --- constants ---
const MAX_CACHED_STATES = 25;

// --- types ---
// No CachedSortState needed, we compress the full state
interface ChoiceLogEntry { comparisonIndex: number; choice: 'left' | 'right'; }
interface StateCache { [index: number]: Uint8Array; } // Stores compressed FULL states
type NavigationAction = 'choice' | 'back' | 'forward' | 'init' | null;
interface SorterModalProps { isOpen: boolean; onClose: () => void; initialItems: CountryContestant[]; }
interface ContestantCardProps { countryContestant: CountryContestant; showAsPreviousChoice?: boolean; }

// --- helper functions (Compression related) ---
const jsonReplacer = (key: string, value: any) => {
    if (value instanceof Map) return { __dataType: 'Map', value: Array.from(value.entries()) };
    if (value instanceof Set) return { __dataType: 'Set', value: Array.from(value.values()) };
    // Crucially, ensure CountryContestant objects are fully serialized if they have methods or complex properties not handled by default JSON
    // If CountryContestant is just data, default serialization is likely fine.
    return value;
};
const jsonReviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.__dataType === 'Map') return new Map(value.value);
        if (value.__dataType === 'Set') return new Set(value.value);
    }
    return value;
};
// Compress takes the FULL SortState now
const compressFullState = (state: SortState): Uint8Array | null => {
    try {
        const jsonString = JSON.stringify(state, jsonReplacer);
        return pako.deflate(jsonString);
    } catch (e) { console.error("Error compressing full state:", e); return null; }
};
// Decompress returns the FULL SortState now
const decompressFullState = (compressedData: Uint8Array): SortState | null => {
    if (!compressedData || compressedData.length === 0) return null;
    try {
        const jsonString = pako.inflate(compressedData, { to: 'string' });
        return JSON.parse(jsonString, jsonReviver) as SortState;
    } catch (e) { console.error("Error decompressing full state:", e); return null; }
};
function estimateCompressedSize(data: Uint8Array): number {
    return data?.byteLength || 0;
}

// --- component ---
const SorterModal: React.FC<SorterModalProps> = ({
    isOpen,
    onClose,
    initialItems,
}) => {
    const dispatch: AppDispatch = useAppDispatch();
    const categories = useAppSelector((state: AppState) => state.categories);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

    // --- state ---
    // No allItemsRef needed if we cache full state
    const initialSortStateRef = useRef<SortState | null>(null); // Holds the full initial state
    const [choiceLog, setChoiceLog] = useState<ChoiceLogEntry[]>([]);
    // Use ref for cache to avoid dependency loops when updating cache inside handlers
    const stateCacheRef = useRef<StateCache>({});
    const [cacheVersion, setCacheVersion] = useState<number>(0); // Trigger re-renders on cache changes
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
    const [lastNavigationAction, setLastNavigationAction] = useState<NavigationAction>(null);
    const [isComputing, setIsComputing] = useState<boolean>(false); // Only for cache misses
    const [isSorterActive, setIsSorterActive] = useState<boolean>(false);

    // Helper to update cache ref and trigger re-render
    const updateCache = useCallback((newCache: StateCache) => {
        stateCacheRef.current = newCache;
        setCacheVersion(v => v + 1);
    }, []);

    // --- initialization & cleanup ---
    useEffect(() => {
        let didInitialize = false;
        if (isOpen && initialItems.length > 1) {
            const fullInitialState = initSortState(initialItems);
            initialSortStateRef.current = fullInitialState;

            // Compress and cache the full initial state
            const compressedInitial = compressFullState(fullInitialState);

            setChoiceLog([]);
            stateCacheRef.current = compressedInitial ? { 0: compressedInitial } : {};
            setCacheVersion(0);
            setCurrentHistoryIndex(0);
            setLastNavigationAction('init');
            setIsComputing(false);
            didInitialize = true;
        } else if (!isOpen) {
            initialSortStateRef.current = null;
            setChoiceLog([]);
            stateCacheRef.current = {};
            setCacheVersion(0);
            setCurrentHistoryIndex(0);
            setLastNavigationAction(null);
            setIsComputing(false);
            didInitialize = false;
        }
        setIsSorterActive(didInitialize);
    }, [isOpen, initialItems, updateCache]); // Added updateCache dependency

    // --- state computation logic (Pure computation, no caching side-effects) ---
    const computeStateAtIndex = useCallback((targetIndex: number): SortState | null => {
        // console.log(`computeStateAtIndex: Computing state for index ${targetIndex} (no caching here)`);
        const fullInitialState = initialSortStateRef.current;
        if (!isSorterActive || !fullInitialState) return null;
        if (targetIndex === 0) return fullInitialState;

        let closestCachedIndex = -1;
        let startState: SortState | null = null;

        // Find nearest earlier *cached* state to start replay from
        const currentCache = stateCacheRef.current;
        const cachedIndices = Object.keys(currentCache).map(Number).sort((a, b) => b - a);
        for (const index of cachedIndices) {
            if (index < targetIndex) { // Strictly earlier
                const compressedData = currentCache[index];
                if (compressedData) {
                    const decompressed = decompressFullState(compressedData);
                    if (decompressed) {
                        startState = decompressed; // Use the decompressed full state
                        closestCachedIndex = index;
                        // console.log(`Starting computation from decompressed index ${index}`);
                        break;
                    } else {
                        console.error(`Failed to decompress state for earlier index ${index}.`);
                    }
                }
            }
        }

        // Fallback to initial state if no suitable cache found
        if (!startState) {
            // console.log(`Starting computation from initial state (index 0)`);
            startState = fullInitialState;
            closestCachedIndex = 0;
        }

        let currentState = startState;
        // Replay choices from the starting point up to the target index
        for (let i = closestCachedIndex; i < targetIndex; i++) {
            const logEntry = choiceLog[i];
            if (!logEntry) {
                console.error(`Compute error: Missing log entry at index ${i}`);
                return currentState; // Return state computed so far
            }
            const nextState = processChoice(currentState, logEntry.choice);
            if (!nextState) {
                 console.error(`Compute error: processChoice failed for step ${i}`);
                 return currentState;
            }
            currentState = nextState;

            // Check for DONE *after* processing choice i
            if (currentState.action === ActionType.DONE && i < targetIndex - 1) {
                // console.warn(`Replay loop breaking early at step ${i+1}`);
                break;
            }
        }
        // console.log(`Finished computing state for index ${targetIndex}. Final action: ${currentState.action}`);
        return currentState; // Return the final computed state

    }, [isSorterActive, choiceLog]); // Depends only on log and active status

    // --- memoized current state (Retrieves from cache or computes) ---
    const currentSortState = useMemo((): SortState | null => {
        if (!isSorterActive) return null;

        const compressedData = stateCacheRef.current[currentHistoryIndex];
        if (compressedData) {
            // Cache hit: Decompress
            // console.log(`Cache hit for index ${currentHistoryIndex}. Decompressing...`);
            setIsComputing(false); // Not computing if cache hit
            const decompressed = decompressFullState(compressedData);
            if (!decompressed) {
                 console.error(`Decompression failed for index ${currentHistoryIndex}. Triggering compute...`);
                 // Fall through to compute if decompression fails
            } else {
                return decompressed;
            }
        }

        // Cache miss or decompression failed: Compute the state
        // console.log(`Cache miss for index ${currentHistoryIndex}. Computing...`);
        setIsComputing(true); // Set computing flag
        const computedState = computeStateAtIndex(currentHistoryIndex);
        setIsComputing(false); // Unset computing flag after computation
        return computedState;

    }, [isSorterActive, currentHistoryIndex, cacheVersion, computeStateAtIndex]); // Depends on index, cacheVersion

    // --- memoized cache size ---
    const currentCacheSizeBytes = useMemo(() => {
         if (!isSorterActive) return 0;
         return Object.values(stateCacheRef.current).reduce((sum, compressedState) => sum + estimateCompressedSize(compressedState), 0);
    }, [isSorterActive, cacheVersion]); // Depend on cacheVersion


    // --- event handlers ---
    const handleChoice = useCallback((choice: 'left' | 'right') => {
        // Use the memoized state for checks
        const stateForCheck = currentSortState;
        // Block if computing (which only happens on cache miss now), inactive, state missing, or complete
        if (isComputing || !isSorterActive || !stateForCheck || stateForCheck.isComplete) {
             return;
        }

        setLastNavigationAction('choice');
        const stateBeforeChoice = stateForCheck;
        const comparisonIndexForLog = stateBeforeChoice.currentIndex;

        if (comparisonIndexForLog < 0 || comparisonIndexForLog >= stateBeforeChoice.comparisons.length) {
             console.error(`Invalid comparison index (${comparisonIndexForLog})`); return;
        }

        // Process choice to get the next *full* state
        const nextFullState = processChoice(stateBeforeChoice, choice);
        if (!nextFullState) {
             console.error("processChoice returned null/undefined after choice."); return;
        }

        const nextHistoryIndex = currentHistoryIndex + 1;
        const newLogEntry: ChoiceLogEntry = { comparisonIndex: comparisonIndexForLog, choice };

        // Compress the *full* next state
        const compressedNextState = compressFullState(nextFullState);

        // Update log first
        const newChoiceLog = [...choiceLog.slice(0, currentHistoryIndex), newLogEntry];
        setChoiceLog(newChoiceLog);

        // Update cache ref: Prune future, add next, prune oldest
        if (compressedNextState) {
            const currentCache = stateCacheRef.current;
            const newCache = { ...currentCache };

            Object.keys(newCache).map(Number).forEach(index => {
                if (index > currentHistoryIndex) delete newCache[index];
            });
            newCache[nextHistoryIndex] = compressedNextState;

            const keys = Object.keys(newCache).map(Number).filter(k => k !== 0).sort((a, b) => a - b);
            while (keys.length > MAX_CACHED_STATES) {
                const keyToRemove = keys.shift();
                if (keyToRemove !== undefined) delete newCache[keyToRemove];
                else break;
            }
            updateCache(newCache); // Update ref and trigger re-render
        } else {
            console.error("Failed to compress next state. Cache not updated for this step.");
             // Prune future states even if compression fails
             const currentCache = stateCacheRef.current;
             const newCache = { ...currentCache };
             Object.keys(newCache).map(Number).forEach(index => {
                 if (index > currentHistoryIndex) delete newCache[index];
             });
             updateCache(newCache);
        }

        // Update index last
        setCurrentHistoryIndex(nextHistoryIndex);

        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    }, [isComputing, isSorterActive, currentSortState, currentHistoryIndex, choiceLog, updateCache]); // Added currentSortState, updateCache

    // --- Navigation Handlers ---
     const handleNavigation = useCallback((direction: 'back' | 'forward') => {
        // Prevent navigation only if computing state due to a cache miss
        if (isComputing || !isSorterActive) return;
        const delta = direction === 'back' ? -1 : 1;
        const targetIndex = currentHistoryIndex + delta;

        if (direction === 'back' && targetIndex < 0) return;
        if (direction === 'forward' && targetIndex > choiceLog.length) return;

        setLastNavigationAction(direction);
        // Just update the index. useMemo will handle cache check/computation.
        setCurrentHistoryIndex(targetIndex);

        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    }, [isComputing, isSorterActive, currentHistoryIndex, choiceLog.length]);

    const handleBack = useCallback(() => handleNavigation('back'), [handleNavigation]);
    const handleForward = useCallback(() => handleNavigation('forward'), [handleNavigation]);

    // --- handleApplyRanking ---
    const handleApplyRanking = useCallback(() => {
        const stateForCheck = currentSortState;
        if (isComputing || !isSorterActive || !stateForCheck || !stateForCheck.isComplete) return;

        const sortedItems = getSortedItems(stateForCheck);
        if (sortedItems.length > 0) {
             // Use initialItems directly for count check as ref is gone
             if (sortedItems.length !== initialItems.length) {
                 console.warn(`Count mismatch: getSortedItems returned ${sortedItems.length}, initial ${initialItems.length}`);
             }
             const validItems = sortedItems.map((item, index) => ({ ...item, uid: item.uid || `item-${index}-${Date.now()}` }));
             dispatch(setRankedItems(validItems));
             updateUrlFromRankedItems(activeCategory, categories, validItems);
             onClose();
         } else {
             console.error("getSortedItems returned no items."); onClose();
         }
    }, [isComputing, isSorterActive, currentSortState, dispatch, onClose, activeCategory, categories, initialItems]); // Added currentSortState, initialItems

    // Use currentSortState derived from useMemo for rendering checks
    const progress = useMemo(() => {
        if (!isSorterActive || !currentSortState || currentSortState.estimatedTotalComparisons <= 0) return 0;
        const comparisonsMade = currentSortState.totalComparisons;
        return Math.min(100, (comparisonsMade / currentSortState.estimatedTotalComparisons) * 100);
    }, [isSorterActive, currentSortState]);

    const currentComparison = useMemo(() => (
        isSorterActive && currentSortState &&
        currentSortState.action === ActionType.COMPARE &&
        currentSortState.currentIndex >= 0 &&
        currentSortState.currentIndex < currentSortState.comparisons.length
        ? currentSortState.comparisons[currentSortState.currentIndex]
        : null
    ), [isSorterActive, currentSortState]);

    const previousChoiceForThisStep = useMemo(() => (
        isSorterActive && (lastNavigationAction === 'back' || lastNavigationAction === 'forward') &&
        currentHistoryIndex >= 0 &&
        currentHistoryIndex < choiceLog.length
            ? choiceLog[currentHistoryIndex]?.choice
            : undefined
    ), [isSorterActive, lastNavigationAction, currentHistoryIndex, choiceLog]);

    const canGoBack = isSorterActive && currentHistoryIndex > 0;
    const canGoForward = isSorterActive && currentHistoryIndex < choiceLog.length;

    let content;
    // Show loading only when actively computing a cache miss
    if (isComputing) {
        content = <div className="text-center p-8 text-slate-400">Loading...</div>;
    } else if (!isSorterActive && isOpen && initialItems.length > 1) {
        content = <div className="text-center p-8 text-slate-400">Initializing sorter...</div>;
    } else if (!isSorterActive && isOpen) {
        content = <div className="text-center p-8 text-slate-400">Need at least two items to sort.</div>;
    } else if (currentSortState?.isComplete) {
        content = (
            <div className="flex flex-col items-center justify-center px-4 py-8">
                <p className="mb-6 text-center text-slate-200">
                    Based on your choices, we've created your ranking.
                </p>
            </div>
        );
    } else if (currentComparison) {
        // Render comparison cards. Disable clicks via CSS if isComputing is true.
        content = (
            <div className="flex flex-col justify-center items-center gap-2 mb-2">
                <div onClick={() => handleChoice('left')} className={classNames("w-full cursor-pointer transition-colors duration-200 md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400 rounded-lg", {"pointer-events-none opacity-75": isComputing})}>
                    <ContestantCard countryContestant={currentComparison.leftItem} showAsPreviousChoice={previousChoiceForThisStep === 'left'}/>
                </div>
                <div className="text-md font-bold text-slate-300">vs</div>
                <div onClick={() => handleChoice('right')} className={classNames("w-full cursor-pointer transition-colors duration-200 md:hover:ring-2 md:hover:ring-blue-400 active:ring-2 active:ring-blue-400 rounded-lg", {"pointer-events-none opacity-75": isComputing})}>
                    <ContestantCard countryContestant={currentComparison.rightItem} showAsPreviousChoice={previousChoiceForThisStep === 'right'}/>
                </div>
            </div>
        );
    } else if (isSorterActive) {
         // Fallback if active but no comparison/completion (e.g., error state or post-compute but pre-render)
         content = <div className="text-center p-8 text-slate-400">Preparing comparison...</div>;
    } else {
         content = null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="!max-h-[95vh] sort-tour-step-modal px-0">
            <div className="flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 px-4">
                     {/* Title, Category */}
                     <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h2 className={classNames("text-xl font-bold text-center w-full text-slate-200")}>
                                {currentSortState?.isComplete ? "Ranking complete" : "Choose Your Preference"}
                                {!currentSortState?.isComplete && isSorterActive && <TooltipHelp content="Answer with your preferences and a ranking will be generated..." className="text-slate-300 align-middle mb-1 -mr-1" />}
                            </h2>
                        </div>
                        {activeCategory !== undefined && categories[activeCategory]?.name && <div className="items-center w-full mb-0 text-center text-slate-400 text-sm">{categories[activeCategory]?.name} </div>}
                    </div>
                    {/* Progress Bar & Counts */}
                    <div className="mb-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }}></div>
                        </div>
                        <div className="text-xs text-slate-400 text-right mt-1">
                            {!isSorterActive && isOpen && initialItems.length > 1 ? (
                                <span>Loading...</span>
                            ) : currentSortState ? (
                                <span>
                                    Comparisons: {currentSortState.totalComparisons} /
                                    ~{currentSortState.estimatedTotalComparisons}
                                    <span className="mx-2">|</span>
                                    Cache Size: ~{(currentCacheSizeBytes / 1024).toFixed(1)} KB (Comp.)
                                    {isComputing && <span className="ml-2 text-orange-400">(Computing...)</span>}
                                </span>
                            ) : (
                                <span> </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-grow overflow-y-auto px-0 py-0 pt-1 min-h-[20em]">
                    {content}
                </div>

                {/* Footer buttons */}
                <div className="flex-shrink-0 mt-2 px-4 pb-2">
                    {currentSortState?.isComplete ? (
                         <div className="flex justify-center items-center space-x-4">
                             <IconButton onClick={handleBack} disabled={!canGoBack || isComputing} className={classNames("px-4 py-2 text-sm text-white rounded", (!canGoBack || isComputing) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")} title="Back" icon={faChevronLeft}/>
                            <IconButton onClick={onClose} disabled={isComputing} className="px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500" title="Close" icon={faTimes}/>
                            <IconButton onClick={handleApplyRanking} disabled={!isSorterActive || !currentSortState?.isComplete || isComputing} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500" title="Apply Ranking" icon={faCheck}/>
                             <IconButton onClick={handleForward} disabled={!canGoForward || isComputing} className={classNames("px-4 py-2 text-sm text-white rounded", (!canGoForward || isComputing) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")} title="Forward" icon={faChevronRight}/>
                        </div>
                    ) : (
                         isSorterActive && currentSortState && currentComparison && (
                            <div className="flex justify-between items-center mt-1">
                                <div className="w-1/3 flex justify-start">
                                    {canGoBack && ( <IconButton onClick={handleBack} disabled={!canGoBack || isComputing} className={classNames( "flex items-center px-4 py-2 text-sm rounded text-white", (!canGoBack || isComputing) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700" )} title="Back" icon={faChevronLeft}/> )}
                                </div>
                                <div className="w-1/3 flex justify-center">
                                    <IconButton onClick={onClose} disabled={isComputing} className="px-4 py-2 pr-[1.2em] text-sm text-white bg-gray-500 rounded hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500" title="Skip Sorting" icon={faTimes}/>
                                </div>
                                <div className="w-1/3 flex justify-end">
                                    {canGoForward && ( <IconButton onClick={handleForward} disabled={!canGoForward || isComputing} className={classNames( "flex items-center px-4 py-2 text-sm rounded text-white", (!canGoForward || isComputing) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700" )} title="Forward" icon={faChevronRight}/> )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </Modal>
    );
};


const ContestantCard: React.FC<ContestantCardProps> = ({
    countryContestant,
    showAsPreviousChoice,
}) => {
    const isGlobalMode = useAppSelector((state) => state.globalSearch);
    const showThumbnail = useAppSelector((state) => state.showThumbnail);
    const contestant = countryContestant.contestant;
    const country = countryContestant.country;
    const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);
    const flagContainerStyles = "absolute top-0 left-0 h-full w-[12em] pointer-events-none overflow-hidden";
    const flagImageStyles = "w-full h-full object-cover opacity-60";
    const flagMaskStyle: React.CSSProperties = { display: 'block', WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)', maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)', objectPosition: 'center center', objectFit: 'cover' };
    const thumbContainerStyles = "absolute top-0 right-0 h-full w-[35%] pointer-events-none overflow-hidden";
    const thumbImageStyles = "w-full h-full object-cover opacity-50";
    const thumbMaskStyle: React.CSSProperties = { display: 'block', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)', maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)', objectPosition: '50% 50%', objectFit: 'cover', transform: 'scale(1.05)' };
    useEffect(() => { const styleId = 'flag-mask-style'; if (!document.getElementById(styleId)) { const styleEl = document.createElement('style'); styleEl.id = styleId; styleEl.innerHTML = `.flag-mask { -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%); mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%); object-position: center center; object-fit: cover; }`; document.head.appendChild(styleEl); } }, []);

    return (
        <div className="relative">
            {showAsPreviousChoice && (<div className="absolute inset-0 bg-blue-500 opacity-30 rounded-lg pointer-events-none z-20 border-2 border-blue-400"></div>)}
            <div className={classNames("m-auto text-slate-400 bg-[#03022d] bg-opacity-30 no-select choice-background", "relative mx-auto min-h-[9em] py-[0.4em]", "flex flex-col items-stretch whitespace-normal text-sm overflow-hidden", "shadow border-y border-0.5 rounded-md", "border-solid border-slate-700", "w-full z-10")}>
                {/* flag background */}
                <div className={flagContainerStyles}>
                    <div className="relative w-full h-full">
                        {country.key !== 'yu' ? (<LazyLoadedFlag code={country.key} className={`${flagImageStyles} flag-mask`} />) : (<img src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg" alt="Flag of Yugoslavia" className={flagImageStyles} style={flagMaskStyle} />)}
                    </div>
                </div>
                {/* youtube thumbnail */}
                {youtubeThumb && showThumbnail && (<div className={thumbContainerStyles}><div className="relative w-full h-full"><img src={youtubeThumb} className={thumbImageStyles} style={thumbMaskStyle} alt="" /></div></div>)}
                {/* content */}
                <div className="relative z-10 flex flex-col items-stretch justify-center w-full p-2 pl-32 h-full">
                    <div className="flex-grow text-slate-300 font-bold flex flex-col justify-center">
                        {/* country name and youtube link */}
                        <div className="overflow-hidden overflow-ellipsis flex justify-between items-center mb-2">
                            <span className="overflow-hidden overflow-ellipsis text-lg tracking-wide bg-[#301c4c] bg-opacity-35 rounded-md px-2 py-1 shadow-sm">{country?.name}</span>
                            <span className="flex flex-row items-center">{contestant?.youtube && (<a href={contestant?.youtube} target="_blank" rel="noopener noreferrer" className='rounded text-red-500 hover:text-red-400 transition-colors duration-200' onClick={(e) => e.stopPropagation()}><FaYoutube className='text-4xl' title="Watch on YouTube" /></a>)}</span>
                        </div>
                        {/* artist, song, and year info */}
                        <div className="pr-2 font-normal">{contestant ? (<> <div className="font-medium text-base bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">{contestant?.artist}</div> <div className="mt-2 font-medium text-sm bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">{contestant.song?.length && !contestant.song?.toLowerCase().includes("tbd") ? `"${contestant.song}"` : `${contestant.song}`}</div> {isGlobalMode && contestant && (<div className="bg-[#1c214c] bg-opacity-75 text-slate-200 text-xs font-bold text-center py-1 px-2 mt-2 inline-block rounded-md ml-2 shadow-sm">{contestant.year}</div>)} </>) : (<span className="font-medium text-sm bg-[#1c214c] bg-opacity-75 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm italic">did not participate</span>)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SorterModal;