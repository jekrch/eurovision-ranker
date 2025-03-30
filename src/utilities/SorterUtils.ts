import { Comparison } from "../components/ranking/SorterModal";
import { CountryContestant } from "../data/CountryContestant";

// sortState holds the state for the sorting algorithm.
export interface SortState {
    // action indicates the current step the algorithm needs to take (compare items or finish).
    action: ActionType;
    // allItems holds the original list of contestants provided for sorting.
    allItems: ReadonlyArray<CountryContestant>;
    // comparisons stores the history of pairwise comparisons made so far.
    comparisons: Comparison[];
    // currentIndex points to the index in the `comparisons` array for the current pair being presented.
    currentIndex: number;
    // isComplete flags whether the sorting process has finished.
    isComplete: boolean;
    // totalComparisons counts how many pairwise decisions the user has actually made.
    totalComparisons: number;
    // estimatedTotalComparisons provides an estimate of how many comparisons might be needed in total.
    estimatedTotalComparisons: number;
    // currentRanking reflects the latest calculated ranking based on comparisons made.
    currentRanking: CountryContestant[];
    // remainingPairIndices contains pairs of indices [indexA, indexB] from allItems that still need comparison.
    remainingPairIndices: [number, number][];
    // graph represents preferred > lessPreferred relationships; an edge from A to B means A is preferred over B.
    graph: Map<string, Set<string>>;
    // note: the properties 'stack', 'aux', 'rankingStableCount', and 'confidenceThreshold' from a previous version
    // were removed as they were not used in the current sorting logic.
}

// actionType enum tracks the state of the sorting algorithm.
export enum ActionType {
    COMPARE = "COMPARE",
    DONE = "DONE"
}


/**
 * initialize the state for the pairwise comparison sorting algorithm.
 */
export const initSortState = (items: CountryContestant[]): SortState => {
    // filter out any undefined or null items but never modify original items.
    const validItems = items.filter((item): item is CountryContestant => !!item);

    // if there's 0 or 1 item, sorting is already done.
    if (validItems.length <= 1) {
        return {
            action: ActionType.DONE,
            allItems: validItems,
            comparisons: [],
            currentIndex: 0, // consistent starting index even if done
            isComplete: true,
            totalComparisons: 0,
            estimatedTotalComparisons: 0,
            currentRanking: validItems,
            remainingPairIndices: [],
            graph: new Map(),
        };
    }

    // shuffle the items initially to ensure fairness and avoid bias from the original order.
    const shuffledItems = shuffleArray([...validItems]);

    // create the initial graph structure with nodes but no edges.
    const initialGraph = new Map<string, Set<string>>();
    shuffledItems.forEach(item => {
        // ensure item and uid exist before adding to the graph.
        if (item?.uid) {
            initialGraph.set(item.uid, new Set());
        }
    });

    // precompute all possible pairs of indices to be compared initially.
    let initialPairIndices: [number, number][] = [];
    for (let i = 0; i < shuffledItems.length; i++) {
        for (let j = i + 1; j < shuffledItems.length; j++) {
            initialPairIndices.push([i, j]);
        }
    }

    // set up the initial state object.
    const initialState: SortState = {
        action: ActionType.COMPARE, // assume comparison is needed, advanceAlgorithm will confirm
        allItems: shuffledItems,
        comparisons: [],
        currentIndex: -1, // indicates no comparison has been presented yet
        isComplete: false,
        totalComparisons: 0,
        estimatedTotalComparisons: initialPairIndices.length, // initial estimate is all possible pairs
        currentRanking: shuffledItems, // start with the shuffled order as a baseline
        remainingPairIndices: initialPairIndices, // start with all pairs, will be filtered
        graph: initialGraph,
    };

    // filter initial pairs based on transitivity (though initially, none should be filtered).
    // this uses the same logic as filtering during the process for consistency.
    const filteredPairs = filterRemainingComparisons(initialState);
    initialState.remainingPairIndices = filteredPairs;
    // update the estimate based on the filtered list.
    initialState.estimatedTotalComparisons = filteredPairs.length;

    // if there are pairs to compare, advance to the first one.
    if (initialState.remainingPairIndices.length > 0) {
        // advanceAlgorithm will set the first comparison and update currentIndex.
        return advanceAlgorithm(initialState);
    } else {
        // if no pairs are left after initial filtering (unlikely for >1 item), we're done.
        initialState.action = ActionType.DONE;
        initialState.isComplete = true;
        return initialState;
    }
};

/**
 * filters the list of potential comparison pairs, removing pairs where the relationship
 * can already be inferred transitively from the current comparison graph.
 */
export const filterRemainingComparisons = (state: SortState): [number, number][] => {
    const { allItems, graph, remainingPairIndices } = state;

    // keep only pairs where neither item is known to be preferred over the other.
    const filteredPairs = remainingPairIndices.filter(([indexA, indexB]) => {
        const itemA = allItems[indexA];
        const itemB = allItems[indexB];

        // ensure both items and their uids are valid before checking the graph.
        if (!itemA?.uid || !itemB?.uid) {
            console.warn("filtering pairs with invalid items/uids", itemA, itemB);
            return false; // exclude pairs with invalid items
        }

        // check if a path exists in either direction (A->B or B->A).
        const pathExists = hasPath(graph, itemA.uid, itemB.uid) || hasPath(graph, itemB.uid, itemA.uid);
        // return true to keep the pair if no path exists (comparison is necessary).
        return !pathExists;
    });

    return filteredPairs;
};

// hasPath checks if a directed path exists between two nodes (uids) in the graph using depth-first search.
const hasPath = (graph: Map<string, Set<string>>, startUid: string, endUid: string): boolean => {
    // keep track of visited nodes during this specific search to avoid infinite loops in cycles.
    const visited = new Set<string>();
    // use a stack for iterative dfs.
    const stack: string[] = [startUid];

    while (stack.length > 0) {
        // we use the non-null assertion `!` as the loop condition guarantees the stack is not empty.
        const currentUid = stack.pop()!;

        // if we reached the target node, a path exists.
        if (currentUid === endUid) {
            return true;
        }

        // if we've already visited this node in the current search path, skip it.
        if (visited.has(currentUid)) {
            continue;
        }
        visited.add(currentUid);

        // get neighbors (nodes less preferred than the current node).
        const neighbors = graph.get(currentUid);
        if (neighbors) {
            // add neighbors to the stack to explore them.
            for (const neighbor of neighbors) {
                // only push if not already visited in this specific traversal
                // (though the outer visited.has check handles cycles).
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                }
            }
        }
    }

    // if the stack becomes empty and we haven't found the endUid, no path exists.
    return false;
};


/**
 * process the user's choice ('left' or 'right') for the current comparison,
 * update the graph, recalculate the ranking, and determine the next state.
 */
export const processChoice = (state: SortState, choice: 'left' | 'right'): SortState => {
    // create a shallow copy of the state to maintain immutability for the top level.
    const newState = { ...state };
    // create a deep copy of comparisons array, as we'll modify an element.
    newState.comparisons = [...state.comparisons];
    // create a deep copy of the graph (map of sets) to avoid modifying the previous state's graph.
    newState.graph = new Map(Array.from(state.graph.entries()).map(([key, value]) => [key, new Set(value)]));

    // ensure the current index is valid before proceeding.
    if (newState.currentIndex >= 0 && newState.currentIndex < newState.comparisons.length) {
        const currentComparison = newState.comparisons[newState.currentIndex];

        // check if a choice has already been recorded (e.g., due to double-click or navigation issues).
        if (currentComparison && !currentComparison.choice) {
            // record the user's choice in the comparisons history.
            newState.comparisons[newState.currentIndex] = {
                ...currentComparison,
                choice: choice
            };
            // increment the count of actual comparisons made by the user.
            newState.totalComparisons += 1;
        } else {
            // log a warning if something is unexpected.
            console.warn(`attempted to process choice for an invalid or already-chosen comparison index: ${newState.currentIndex}. current choice: ${currentComparison?.choice}`);
            // return the original state to avoid potentially corrupting the flow.
            return state;
        }
    } else {
        console.warn(`currentIndex ${newState.currentIndex} out of bounds during processChoice. comparisons length: ${newState.comparisons.length}`);
        // return the original state if the index is invalid.
        return state;
    }

    // update the graph based on the user's choice.
    const comp = newState.comparisons[newState.currentIndex];
    if (comp.leftItem?.uid && comp.rightItem?.uid) {
        // determine the winner (preferred) and loser (less preferred) based on the choice.
        const winnerUid = choice === 'left' ? comp.leftItem.uid : comp.rightItem.uid;
        const loserUid = choice === 'left' ? comp.rightItem.uid : comp.leftItem.uid;

        // add a directed edge from the winner to the loser in the graph copy.
        const edges = newState.graph.get(winnerUid) || new Set();
        edges.add(loserUid);
        newState.graph.set(winnerUid, edges);

        // update transitive relationships: if W > L, and L > X, then W > X.
        // this propagates the new comparison result through the graph.
        updateTransitiveClosure(newState.graph, winnerUid, loserUid);
    }

    // recalculate the ranking based on the updated graph using topological sort.
    newState.currentRanking = topologicalSort(newState.allItems, newState.graph);

    // filter the list of remaining pairs to remove any that are now redundant due to transitivity.
    // note: we pass the newState here which includes the updated graph.
    const nextComparisons = filterRemainingComparisons(newState);
    newState.remainingPairIndices = nextComparisons;

    // update the estimated total comparisons needed.
    // estimate = (comparisons already made) + (remaining pairs after filtering).
    newState.estimatedTotalComparisons = newState.comparisons.filter(c => c.choice).length + nextComparisons.length;

    // check if the sorting process is complete (no more pairs to compare).
    if (newState.remainingPairIndices.length === 0) {
        newState.isComplete = true;
        newState.action = ActionType.DONE;
        console.log("sorting complete. final ranking by year:", newState.currentRanking.map((item: CountryContestant) => item.contestant?.year).join(", "));
        return newState; // return the final state
    } else {
        // if not complete, advance to the next comparison.
        return advanceAlgorithm(newState);
    }
};

/**
 * advance to the next comparison pair from the filtered list.
 * this sets up the state for the next user choice.
 */
export const advanceAlgorithm = (state: SortState): SortState => {
    // work on a copy of the state.
    const newState = { ...state };

    // if already complete or no more pairs left, ensure state reflects completion and return.
    if (newState.isComplete || newState.remainingPairIndices.length === 0) {
        if (!newState.isComplete) {
            // this case shouldn't normally happen if processChoice logic is correct.
            console.warn("advanceAlgorithm called with empty remainingPairIndices but not marked as complete.");
            newState.isComplete = true; // mark as complete
            newState.action = ActionType.DONE; // set final action
        }
        return newState; // return the completed state
    }

    // create a mutable copy of the pairs array to use shift().
    const remainingPairs = [...newState.remainingPairIndices];
    // get the next pair from the start of the queue (fifo). use non-null assertion as length > 0 is checked.
    const [leftIndex, rightIndex] = remainingPairs.shift()!;
    // update the state with the modified queue.
    newState.remainingPairIndices = remainingPairs;

    const leftItem = newState.allItems[leftIndex];
    const rightItem = newState.allItems[rightIndex];

    // ensure the items for the selected indices are valid.
    if (leftItem && rightItem) {
        // create a mutable copy of comparisons before pushing.
        newState.comparisons = [...newState.comparisons];
        // add the new comparison pair (without a choice yet) to the history.
        newState.comparisons.push({
            leftItem,
            rightItem
            // choice is initially undefined
        });

        // update the current index to point to this new comparison.
        newState.currentIndex = newState.comparisons.length - 1;
        // set the action to indicate a comparison is needed.
        newState.action = ActionType.COMPARE;

        return newState; // return the state ready for the next comparison
    } else {
        // log an error if items are unexpectedly missing.
        console.error(`invalid items found when advancing algorithm. leftIndex: ${leftIndex}, rightIndex: ${rightIndex}`);
        // return the previous state to avoid errors.
        return state;
    }
};

/**
 * determine if the sorting process should continue.
 */
export const shouldContinueSorting = (state: SortState): boolean => {
    // sorting continues as long as there are pairs remaining to be compared.
    return !state.isComplete && state.remainingPairIndices.length > 0;
};

/**
 * perform a topological sort on the items based on the comparison graph.
 * items with no incoming edges (no other item preferred over them) come first.
 */
export const topologicalSort = (
    items: ReadonlyArray<CountryContestant>,
    graph: Map<string, Set<string>>
): CountryContestant[] => {
    // create a map from uid to the contestant object for easy lookup.
    const itemMap = new Map<string, CountryContestant>();
    items.forEach((item: CountryContestant) => {
        // ensure item and uid are valid.
        if (item?.uid) {
            itemMap.set(item.uid, item);
        }
    });

    // store the in-degree (number of incoming edges) for each node (uid).
    const inDegree = new Map<string, number>();
    // initialize in-degree to 0 for all items involved in the graph.
    for (const uid of itemMap.keys()) {
        // check if item is actually in the graph structure itself (it should be)
        if (graph.has(uid) || Array.from(graph.values()).some(set => set.has(uid))) {
            inDegree.set(uid, 0);
        }
    }


    // calculate the actual in-degree for each node based on graph edges.
    // an edge A -> B means A is preferred over B, so B gains an incoming edge from A.
    for (const edges of graph.values()) {
        for (const targetUid of edges) {
            // increment in-degree for the target (less preferred) node.
            inDegree.set(targetUid, (inDegree.get(targetUid) || 0) + 1);
        }
    }

    // initialize a queue with all nodes that have an in-degree of 0.
    // these are the items not less preferred than any other determined item so far.
    const queue: string[] = [];
    for (const [uid, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(uid);
        }
    }

    // this array will hold the sorted items.
    const result: CountryContestant[] = [];

    // process the queue until it's empty (kahn's algorithm).
    while (queue.length > 0) {
        // dequeue a node with in-degree 0. use non-null assertion as length > 0 checked.
        const currentUid = queue.shift()!;

        // add the corresponding item to the result list.
        const item = itemMap.get(currentUid);
        if (item) {
            result.push(item);
        } else {
            console.warn(`item not found in itemMap during topological sort for uid: ${currentUid}`);
        }

        // get neighbors (items less preferred than the current item).
        const neighbors = graph.get(currentUid) || new Set();
        for (const neighborUid of neighbors) {
            // decrease the in-degree of each neighbor.
            const newDegree = (inDegree.get(neighborUid) || 1) - 1; // assume 1 if not found, though it should be
            inDegree.set(neighborUid, newDegree);

            // if a neighbor's in-degree becomes 0, add it to the queue.
            if (newDegree === 0) {
                queue.push(neighborUid);
            } else if (newDegree < 0) {
                console.warn(`negative in-degree encountered for ${neighborUid} during topological sort.`);
            }
        }
    }

    // if the result length is less than the number of items, it implies a cycle exists in the graph.
    // cycles shouldn't happen with consistent preferences but can occur with conflicting user input
    // or potential bugs. add remaining items to the end to ensure all items are included.
    if (result.length < itemMap.size) {
        console.warn(`cycle detected or items missed during topological sort. result size: ${result.length}, item map size: ${itemMap.size}`);
        const includedUids = new Set(result.map((item: CountryContestant) => item.uid));
        items.forEach((item: CountryContestant) => {
            if (item?.uid && !includedUids.has(item.uid) && itemMap.has(item.uid)) {
                // only add items that were initially in itemMap but not in the result yet.
                result.push(item);
            }
        });
    }

    // defensive check: ensure all original items present in graph are returned
    if (result.length !== itemMap.size) {
         console.error(`final topological sort result size (${result.length}) does not match initial item count (${itemMap.size}) even after handling cycles.`);
         // as a fallback, return the current best guess + remaining items
         const finalResultUids = new Set(result.map(i => i.uid));
         for(const item of items) {
             if (item?.uid && !finalResultUids.has(item.uid)) {
                 result.push(item);
             }
         }
    }


    return result;
};

/**
 * get the final sorted list of items once the sorting process is complete.
 */
export const getSortedItems = (state: SortState): CountryContestant[] => {
    // return empty array if sorting is not yet complete.
    if (!state.isComplete) {
        console.warn("getSortedItems called before sorting is complete.");
        return [];
    }

    // the primary result should be the final ranking calculated by topological sort.
    let finalRanking = [...state.currentRanking];

    // verification step: ensure all original items are present in the final ranking.
    // this guards against potential issues in the sorting or graph logic.
    const finalRankingUids = new Set(finalRanking.map((item: CountryContestant) => item.uid));
    const missingItems = state.allItems.filter((item: CountryContestant) =>
        item?.uid && !finalRankingUids.has(item.uid)
    );

    // if any items are missing, append them to the end of the ranking.
    if (missingItems.length > 0) {
        console.warn(`warning: ${missingItems.length} items were missing from the final topological sort result. appending them.`);
        finalRanking = [...finalRanking, ...missingItems];
    }

    // final sanity check on the count of items.
    if (finalRanking.length !== state.allItems.length) {
        console.error(`critical: final sorted items count (${finalRanking.length}) does not match original item count (${state.allItems.length}) after all checks.`);
        // attempt to return a list containing all original items, possibly unsorted or partially sorted.
        // this indicates a deeper issue in the state management or sorting logic.
        const allOriginalItemsMap = new Map(state.allItems.map(item => [item.uid, item]));
        const combinedList = [...finalRanking];
        state.allItems.forEach(item => {
           if(item?.uid && !finalRankingUids.has(item.uid)) {
               combinedList.push(item);
           }
        });
         return combinedList.slice(0, state.allItems.length); // return combined list, trying to keep original length
    }

    return finalRanking;
};

/**
 * shuffle array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    // create a copy to avoid modifying the original array.
    const result = [...array];
    // loop backwards through the array.
    for (let i = result.length - 1; i > 0; i--) {
        // pick a random index from 0 to i (inclusive).
        const j = Math.floor(Math.random() * (i + 1));
        // swap the elements at indices i and j.
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result; // return the new shuffled array
};

/**
 * updates the graph to enforce transitive relationships after a new preference is added.
 * if we learn A > B, this function ensures that for any X where B > X, we also add A > X.
 * it also handles the case where Y > A, ensuring Y > B is added. (Handled implicitly by repeated calls)
 * this specific implementation focuses on A > B => (A > X if B > X).
 */
function updateTransitiveClosure(graph: Map<string, Set<string>>, preferredUid: string, lessPreferredUid: string): void {
    // find all nodes X such that lessPreferredUid > X.
    const nodesLessPreferredThanLoser = graph.get(lessPreferredUid) || new Set<string>();

    // get the set of nodes already known to be less preferred than preferredUid.
    const nodesLessPreferredThanWinner = graph.get(preferredUid) || new Set<string>();

    // for each node X that the loser beats, the winner must also beat X.
    nodesLessPreferredThanLoser.forEach(targetUid => {
        // add the edge preferredUid -> targetUid if it doesn't exist.
        if (!nodesLessPreferredThanWinner.has(targetUid)) {
            nodesLessPreferredThanWinner.add(targetUid);
            // recursively update closure starting from preferredUid -> targetUid
            // this ensures full propagation (e.g., if targetUid > Z, then preferredUid > Z is also added)
            updateTransitiveClosure(graph, preferredUid, targetUid);
        }
    });

    // update the graph for the preferredUid with any newly added edges.
    graph.set(preferredUid, nodesLessPreferredThanWinner);

    // additionally, consider nodes Y such that Y > preferredUid.
    // for all such Y, we must also add the edge Y > lessPreferredUid.
    for (const [sourceUid, edges] of graph.entries()) {
        if (edges.has(preferredUid)) { // found a Y (sourceUid) such that Y > preferredUid
            if (!edges.has(lessPreferredUid)) { // if Y > lessPreferredUid edge doesn't exist yet
                edges.add(lessPreferredUid); // add Y > lessPreferredUid
                graph.set(sourceUid, edges); // update graph for Y
                // recursively update closure starting from sourceUid -> lessPreferredUid
                updateTransitiveClosure(graph, sourceUid, lessPreferredUid);
            }
        }
    }
}
