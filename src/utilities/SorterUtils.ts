import { CountryContestant } from "../data/CountryContestant";

// state for a single merge step
interface MergeStep {
    left: ReadonlyArray<CountryContestant>;
    right: ReadonlyArray<CountryContestant>;
    merged: CountryContestant[];
    leftIndex: number;
    rightIndex: number;
}

// main state container for the sorting process
export interface SortState {
    action: ActionType;
    allItems: ReadonlyArray<CountryContestant>; // reference to the original, unshuffled items
    comparisons: Comparison[]; // log of comparisons presented to the user
    isComplete: boolean;
    totalComparisons: number; // total comparisons resolved by user choices
    maxRemainingComparisons: number; // calculated maximum comparisons potentially needed to finish
    currentRanking: CountryContestant[]; // final sorted list (populated when isComplete is true)

    mergeStack: ReadonlyArray<ReadonlyArray<CountryContestant>>; // stack holding completed, sorted sub-lists awaiting merging
    currentMergeStep: MergeStep | null; // details of the merge currently in progress (if any)
}

// indicates whether the algorithm needs a comparison or is done
export enum ActionType {
    COMPARE = "COMPARE",
    DONE = "DONE"
}

// defines a pair of items for the user to compare
export interface Comparison {
    leftItem: CountryContestant;
    rightItem: CountryContestant;
    choice?: 'left' | 'right'; // 'left' or 'right' once the user chooses
}

// --- helpers ---

/*
 * creates a shuffled copy of an array (fisher-yates algorithm).
 */
const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

/*
 * calculates the theoretical maximum number of comparisons needed to complete
 * the sort from the current state, assuming the smallest-pair merge strategy.
 */
const calculateMaxRemainingComparisons = (
    mergeStack: ReadonlyArray<ReadonlyArray<CountryContestant>>,
    currentMergeStep: MergeStep | null
): number => {
    let maxRemaining = 0;
    // include lists already on the stack
    const futureListSizes = mergeStack.map(list => list.length);

    // include the current merge operation
    if (currentMergeStep) {
        const step = currentMergeStep;
        const remainingLeft = step.left.length - step.leftIndex;
        const remainingRight = step.right.length - step.rightIndex;

        // max comparisons for the *current* step
        if (remainingLeft > 0 && remainingRight > 0) {
            // worst case: compare all remaining elements (n+m-1)
            maxRemaining += remainingLeft + remainingRight - 1;
        }

        // add the size of the list resulting from this merge
        futureListSizes.push(step.left.length + step.right.length);
    }

    // simulate remaining merges using smallest-pair strategy
    // use a mutable copy for simulation
    const tempSizes = [...futureListSizes];
    while (tempSizes.length >= 2) {
        // find the two smallest lists
        tempSizes.sort((a, b) => a - b);

        const size1 = tempSizes[0];
        const size2 = tempSizes[1];
        tempSizes.splice(0, 2); // remove them

        // add comparisons for merging these two (worst case)
        const comparisonsForThisMerge = size1 + size2 - 1;
        maxRemaining += comparisonsForThisMerge;

        // add the resulting merged list size back
        tempSizes.push(size1 + size2);
    }

    return maxRemaining;
};
// --- end helpers ---


/*
 * advances the merge sort algorithm state without user input.
 * it continues the current merge step if possible (e.g., if one list is exhausted),
 * starts a new merge step if the stack allows (using smallest pair strategy),
 * or marks the sort as complete if only one list remains on the stack.
 * this function operates immutably, returning a new state object.
 * note: it does not recalculate maxRemainingComparisons; the caller should handle that.
 */
const advanceAlgorithmInternal = (state: SortState): SortState => {
    let currentState = state;

    if (currentState.isComplete) {
        return currentState;
    }

    // loop continues as long as progress can be made without user input
    while (true) {
        if (currentState.currentMergeStep) {
            // process the active merge step
            const step = currentState.currentMergeStep;

            // left list exhausted?
            if (step.leftIndex >= step.left.length) {
                // add remaining right items
                const remainingRight = step.right.slice(step.rightIndex);
                const finalMerged = [...step.merged, ...remainingRight];
                // push completed list onto stack
                currentState = {
                    ...currentState,
                    mergeStack: Object.freeze([...currentState.mergeStack, Object.freeze(finalMerged)]),
                    currentMergeStep: null
                };
                // continue loop: try starting next merge
                continue;
            }
            // right list exhausted?
            else if (step.rightIndex >= step.right.length) {
                // add remaining left items
                const remainingLeft = step.left.slice(step.leftIndex);
                const finalMerged = [...step.merged, ...remainingLeft];
                // push completed list onto stack
                currentState = {
                    ...currentState,
                    mergeStack: Object.freeze([...currentState.mergeStack, Object.freeze(finalMerged)]),
                    currentMergeStep: null
                };
                // continue loop: try starting next merge
                continue;
            }
            // both lists have items, need comparison
            else {
                const leftItem = step.left[step.leftIndex];
                const rightItem = step.right[step.rightIndex];

                // is the needed comparison already pending?
                const lastComparison = currentState.comparisons[currentState.comparisons.length - 1];
                if (lastComparison && !lastComparison.choice &&
                    lastComparison.leftItem === leftItem &&
                    lastComparison.rightItem === rightItem) {
                    // yes, just return state waiting for choice
                    return {
                        ...currentState,
                        action: ActionType.COMPARE,
                        isComplete: false
                    };
                } else {
                    // no, add a new comparison request
                    const newComparison: Comparison = { leftItem, rightItem };
                    // return state needing comparison
                    return {
                        ...currentState,
                        comparisons: [...currentState.comparisons, newComparison],
                        action: ActionType.COMPARE,
                        isComplete: false
                    };
                }
            }
        } else {
            // no active merge, try starting one
            if (currentState.mergeStack.length >= 2) {
                // optimization: merge the two smallest lists on the stack next
                const stackWithIndices = currentState.mergeStack.map((list, idx) => ({ list, idx }));
                stackWithIndices.sort((a, b) => a.list.length - b.list.length);

                const smallestIdx = stackWithIndices[0].idx;
                const secondSmallestIdx = stackWithIndices[1].idx;
                const leftList = currentState.mergeStack[smallestIdx];
                const rightList = currentState.mergeStack[secondSmallestIdx];

                // create stack excluding the two being merged
                const remainingStack = Object.freeze(
                    currentState.mergeStack.filter((_, idx) =>
                        idx !== smallestIdx && idx !== secondSmallestIdx)
                );

                const newMergeStep: MergeStep = {
                    left: leftList,
                    right: rightList,
                    merged: [],
                    leftIndex: 0,
                    rightIndex: 0,
                };

                // update state with new merge step
                currentState = {
                    ...currentState,
                    mergeStack: remainingStack,
                    currentMergeStep: newMergeStep
                };
                // continue loop to process the new step
                continue;

            } else if (currentState.mergeStack.length === 1) {
                // sorting complete
                // final list is the only one left on the stack
                // return final 'done' state
                return {
                    ...currentState,
                    isComplete: true,
                    action: ActionType.DONE,
                    currentRanking: [...currentState.mergeStack[0]], // store final ranking
                    currentMergeStep: null,
                    mergeStack: Object.freeze([]),
                };
            } else {
                // error state
                // stack empty unexpectedly (should only happen with empty input, handled in init)
                console.error("advanceAlgorithmInternal: merge stack empty unexpectedly during processing.");
                return {
                    ...currentState,
                    isComplete: true,
                    action: ActionType.DONE,
                    currentRanking: [], // signal error with empty ranking
                };
            }
        }
    }
};

/*
 * updates the state with the calculated max remaining comparisons.
 */
const withMaxRemainingComparisons = (state: SortState): SortState => {
    if (state.isComplete) {
        return { ...state, maxRemainingComparisons: 0 };
    }

    const remaining = calculateMaxRemainingComparisons(
        state.mergeStack,
        state.currentMergeStep
    );

    return { ...state, maxRemainingComparisons: remaining };
};


/*
 * initializes the state for the pairwise comparison merge sort algorithm.
 * handles edge cases (0 or 1 item), shuffles the input, creates initial
 * sub-lists, and advances the state to the first required comparison.
 */
export const initSortState = (items: CountryContestant[]): SortState => {
    const validItems = items.filter((item): item is CountryContestant => !!item?.uid);

    // handle 0 or 1 item case (already sorted)
    if (validItems.length <= 1) {
        return {
            action: ActionType.DONE,
            allItems: Object.freeze(validItems),
            comparisons: [],
            isComplete: true,
            totalComparisons: 0,
            maxRemainingComparisons: 0,
            currentRanking: [...validItems],
            mergeStack: Object.freeze([]),
            currentMergeStep: null,
        };
    }

    // shuffle initial items for better performance on nearly sorted/reversed data
    // and unbiased comparison presentation
    const shuffledItems = shuffleArray([...validItems]);

    // start with each item as a sorted sub-list
    const initialSublists: ReadonlyArray<ReadonlyArray<CountryContestant>> = Object.freeze(
        shuffledItems.map(item => Object.freeze([item]))
    );

    const initialStateBase: Omit<SortState, 'maxRemainingComparisons'> = {
        action: ActionType.COMPARE, // will be updated by advance
        allItems: Object.freeze(shuffledItems), // use shuffled for internal processing
        comparisons: [],
        isComplete: false,
        totalComparisons: 0,
        // max remaining calculated later
        currentRanking: [],
        mergeStack: initialSublists,
        currentMergeStep: null,
    };

    // advance state to set up the first comparison
    // cast okay here, state is incomplete until advanced
    const stateAfterFirstAdvance = advanceAlgorithmInternal(initialStateBase as SortState);

    // calculate and include max remaining comparisons for the initial state
    return withMaxRemainingComparisons(stateAfterFirstAdvance);
};

/*
 * processes the user's choice ('left' or 'right') for the current comparison.
 * updates the comparison log, advances the current merge step based on the choice,
 * then calls `advanceAlgorithmInternal` to continue the sort process until the
 * next user input is required or the sort completes. finally, recalculates
 * the max remaining comparisons for the new state.
 */
export const processChoice = (state: SortState, choice: 'left' | 'right'): SortState => {
    // guard against processing choice in wrong state
    if (state.isComplete || !state.currentMergeStep || state.action !== ActionType.COMPARE) {
        console.warn("processChoice called inappropriately.", { stateAction: state.action, isComplete: state.isComplete, hasMergeStep: !!state.currentMergeStep });
        return state;
    }

    const currentComparisonIndex = state.comparisons.length - 1;
    const lastComparison = state.comparisons[currentComparisonIndex];

    // guard against missing/already processed comparison
    if (!lastComparison || lastComparison.choice) {
        console.warn(`processChoice: Last comparison invalid or already has choice. Index: ${currentComparisonIndex}`, lastComparison);
        return state;
    }

    // record the user's choice and increment comparison count
    const updatedComparisons = [...state.comparisons];
    updatedComparisons[currentComparisonIndex] = { ...lastComparison, choice: choice };

    let intermediateState: SortState = {
        ...state,
        comparisons: updatedComparisons,
        totalComparisons: state.totalComparisons + 1,
    };

    // update the current merge step based on choice
    // copy the step to modify it immutably
    const step = {
        ...intermediateState.currentMergeStep!,
        merged: [...intermediateState.currentMergeStep!.merged]
    };

    // add chosen item to merged list, advance index
    if (choice === 'left') {
        if (step.leftIndex < step.left.length) {
            step.merged.push(step.left[step.leftIndex]);
            step.leftIndex++;
        } else {
            // error: index out of bounds
            console.error("processChoice error: leftIndex out of bounds despite pending comparison.");
            return state; // return original state on error
        }
    } else { // choice === 'right'
        if (step.rightIndex < step.right.length) {
            step.merged.push(step.right[step.rightIndex]);
            step.rightIndex++;
        } else {
            // error: index out of bounds
            console.error("processChoice error: rightIndex out of bounds despite pending comparison.");
            return state; // return original state on error
        }
    }

    // update state with the modified step
    intermediateState = { ...intermediateState, currentMergeStep: step };

    // advance the algorithm state
    const nextState = advanceAlgorithmInternal(intermediateState);

    // calculate max remaining comparisons for the new state
    return withMaxRemainingComparisons(nextState);
};



/*
 * retrieves the final sorted list of items.
 * should only be called after the sorting process is complete (state.isComplete is true).
 * returns an empty array if called prematurely or if an error occurred.
 */
export const getSortedItems = (state: SortState): CountryContestant[] => {
    if (!state.isComplete || state.action !== ActionType.DONE) {
        console.warn("getSortedItems called before sorting is complete or in unexpected state.", { isComplete: state.isComplete, action: state.action });
        return [];
    }
    // sanity check: final count should match initial count
    const originalValidCount = state.allItems.filter(item => !!item?.uid).length;
    if (!state.currentRanking || state.currentRanking.length !== originalValidCount) {
        console.error(`getSortedItems: final ranking count (${state.currentRanking?.length ?? 'undefined'}) mismatch vs original valid items (${originalValidCount}). Returning original items as fallback.`);
        // fallback: return original items if ranking seems corrupt
        return [...state.allItems.filter(item => !!item?.uid)];
    }
    // return a copy to prevent external mutation
    return [...state.currentRanking];
};

/*
 * returns the current comparison pair if the algorithm is waiting for user input.
 * returns undefined otherwise (e.g., if sorting is done or processing internally).
 */
export const getCurrentComparison = (state: SortState): Comparison | undefined => {
    if (state.action === ActionType.COMPARE && state.comparisons.length > 0) {
        const lastComparison = state.comparisons[state.comparisons.length - 1];
        // return only if choice is pending
        if (lastComparison && !lastComparison.choice) {
            return lastComparison;
        }
    }
    return undefined;
};