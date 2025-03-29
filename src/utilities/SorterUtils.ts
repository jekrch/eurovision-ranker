import { Comparison } from "../components/ranking/SorterModal";
import { CountryContestant } from "../data/CountryContestant";

// sortState holds the state for the sorting algorithm.
export interface SortState {
    action: ActionType;
    allItems: CountryContestant[];
    comparisons: Comparison[];
    currentIndex: number;
    isComplete: boolean;
    totalComparisons: number;
    estimatedTotalComparisons: number;
    currentRanking: CountryContestant[];
    itemsToCompare: [number, number][];
    stack: any[];
    aux: any;

    // graph represents the relationships between items; a > b means there's an edge from a to b.
    graph: Map<string, Set<string>>;
    // rankingStableCount tracks how many iterations the ranking has remained unchanged.
    rankingStableCount: number;
    // confidenceThreshold sets the confidence level to stop sorting.
    confidenceThreshold: number;
}

// actionType enum tracks the state of the sorting algorithm.
export enum ActionType {
    COMPARE = "COMPARE",
    DONE = "DONE"
}


/**
 * initialize a simple direct sorting algorithm.
 */
export const initSortState = (items: CountryContestant[]): SortState => {
    // filter out any undefined or null items but never modify uids.
    const validItems = items.filter((item): item is CountryContestant => !!item);

    if (validItems.length <= 1) {
        return {
            action: ActionType.DONE,
            allItems: validItems,
            comparisons: [],
            currentIndex: 0,
            isComplete: true,
            totalComparisons: 0,
            estimatedTotalComparisons: 0,
            currentRanking: validItems,
            itemsToCompare: [],
            stack: [],
            aux: validItems,
            graph: new Map(),
            rankingStableCount: 0,
            confidenceThreshold: 0.95,
        };
    }

    // shuffle the items initially to avoid bias.
    const shuffledItems = shuffleArray([...validItems]);

    // create the initial graph.
    const initialGraph = new Map<string, Set<string>>();
    shuffledItems.forEach(item => {
        if (item.uid) {
            initialGraph.set(item.uid, new Set());
        }
    });

    // precompute all possible pairs to be compared at the start.
    let allPossiblePairs: [number, number][] = [];
    for (let i = 0; i < shuffledItems.length; i++) {
        for (let j = i + 1; j < shuffledItems.length; j++) {
            allPossiblePairs.push([i, j]);
        }
    }

    const initialState: SortState = {
        action: ActionType.COMPARE, // tentative, advanceAlgorithm might change if no pairs
        allItems: shuffledItems,
        comparisons: [],
        currentIndex: -1, // nothing selected initially
        isComplete: false,
        totalComparisons: 0,
        estimatedTotalComparisons: allPossiblePairs.length, // correct initial estimate
        currentRanking: shuffledItems, // start with shuffled
        itemsToCompare: allPossiblePairs, // start with all pairs, then filter
        stack: [],
        aux: undefined,
        graph: initialGraph,
        rankingStableCount: 0,
        confidenceThreshold: 0.95,

    };

    // filter itemsToCompare based on transitivity.
    const filteredPairs = initialState.itemsToCompare.filter(([indexA, indexB]) => {
        const itemA = shuffledItems[indexA];
        const itemB = shuffledItems[indexB];

        if (!itemA?.uid || !itemB?.uid) return false;

        return !(hasPath(initialState.graph, itemA.uid, itemB.uid) || hasPath(initialState.graph, itemB.uid, itemA.uid));
    });

    initialState.itemsToCompare = filteredPairs;
    initialState.estimatedTotalComparisons = filteredPairs.length;  // update estimate

    if (initialState.itemsToCompare.length > 0) {
        return advanceAlgorithm(initialState);
    } else {
        initialState.action = ActionType.DONE;
        initialState.isComplete = true;
        return initialState;
    }
};

export const selectNextComparisons = (state: SortState): [number, number][] => { // possible pairs passed from processChoice now
    const { allItems, graph, itemsToCompare } = state;

    // filter out comparisons for which a choice can already be inferred.
    const filteredPairs = itemsToCompare.filter(([indexA, indexB]) => {
        const itemA = allItems[indexA];
        const itemB = allItems[indexB];

        if (!itemA?.uid || !itemB?.uid) return false;

        return !(hasPath(graph, itemA.uid, itemB.uid) || hasPath(graph, itemB.uid, itemA.uid));
    });
    return filteredPairs;

};

// hasPath checks for a directed path between two nodes in the graph.
const hasPath = (graph: Map<string, Set<string>>, startUid: string, endUid: string): boolean => {
    const visited = new Set<string>();
    const stack: string[] = [startUid];

    while (stack.length > 0) {
        const currentUid = stack.pop()!;

        if (currentUid === endUid) {
            return true; // path found
        }

        if (visited.has(currentUid)) {
            continue; // skip already visited
        }
        visited.add(currentUid);

        const edges = graph.get(currentUid);
        if (edges) {
            for (const neighbor of edges) {
                stack.push(neighbor);
            }
        }
    }

    return false; // no path found
};


/**
 * process user's choice and update the ranking.
 */
export const processChoice = (state: SortState, choice: 'left' | 'right'): SortState => {
    const newState = { ...state };
    newState.comparisons = [...state.comparisons]; // ensure copy

    // record the choice for the current comparison.
    if (newState.currentIndex < newState.comparisons.length) {
        // find the comparison object added by the last advanceAlgorithm call
        const currentComparisonIndex = newState.currentIndex; // this should be the index of the pair we just decided on
        // make sure it exists and doesn't already have a choice (e.g., back button logic)
        if (newState.comparisons[currentComparisonIndex] && !newState.comparisons[currentComparisonIndex].choice) {
            newState.comparisons[currentComparisonIndex] = {
                ...newState.comparisons[currentComparisonIndex],
                choice // add the user's choice
            };
            newState.totalComparisons += 1; // increment only when a choice is made
        } else {
            // this might happen if logic gets confused (e.g. double click, back button issues)
            console.warn("attempted to process choice for an invalid or already-chosen comparison index:", newState.currentIndex);
            // potentially just return the current state or handle error appropriately
            return state; // avoid proceeding with bad state
        }

    } else {
        console.warn("currentIndex out of bounds during processChoice");
        return state; // avoid proceeding
    }

    // update the graph based on this choice.
    const comp = newState.comparisons[newState.currentIndex];
    if (comp.leftItem?.uid && comp.rightItem?.uid) {
        const preferredUid = choice === 'left' ? comp.leftItem.uid : comp.rightItem.uid;
        const lessPreferredUid = choice === 'left' ? comp.rightItem.uid : comp.leftItem.uid;

        // add an edge from preferred to lessPreferred.
        const edges = newState.graph.get(preferredUid) || new Set();
        edges.add(lessPreferredUid);
        newState.graph.set(preferredUid, edges);

        // update all transitive relationships.
        updateTransitiveClosure(newState.graph, preferredUid, lessPreferredUid);
    }


    // update Ranking (always do this after a choice).
    const graph = newState.graph;
    newState.currentRanking = topologicalSort(newState.allItems, graph);

    // the itemsToCompare array in the state is updated by calling the
    // adaptive question selection function to strategically choose the next questions.
    const nextComparisons = selectNextComparisons(newState);
    newState.itemsToCompare = nextComparisons;

    // update estimated total comparisons.
    newState.estimatedTotalComparisons = newState.comparisons.filter(c => c.choice).length + nextComparisons.length;

    if (newState.itemsToCompare.length === 0) {
        newState.isComplete = true;
        newState.action = ActionType.DONE;
    }

    if (!newState.isComplete) {
        return advanceAlgorithm(newState);
    } else {
        // if no more pairs in the queue, we are done.
        newState.isComplete = true;
        newState.action = ActionType.DONE;
        console.log("final ranking by year:", newState.currentRanking.map((item: CountryContestant) => item.contestant?.year).join(", "));
        return newState;
    }
};

/**
 * advance to the next comparison (sets up the state for the next choice).
 */
export const advanceAlgorithm = (state: SortState): SortState => {
    const newState = { ...state };

    if (newState.isComplete || newState.itemsToCompare.length === 0) {
        if (!newState.isComplete) {
            console.warn("advanceAlgorithm called with empty itemsToCompare but not complete.");
            newState.isComplete = true;
            newState.action = ActionType.DONE;
        }
        return newState;
    }

    const [leftIndex, rightIndex] = newState.itemsToCompare.shift()!; // use shift to take from the beginning

    const leftItem = newState.allItems[leftIndex];
    const rightItem = newState.allItems[rightIndex];

    if (leftItem && rightItem) {
        newState.comparisons.push({
            leftItem,
            rightItem
        });

        newState.currentIndex = newState.comparisons.length - 1;
        newState.action = ActionType.COMPARE;

        return newState;
    } else {
        console.error("invalid items found when advancing algorithm.");
        return state;
    }
};



/**
 * determine if we should continue sorting.
 */
export const shouldContinueSorting = (state: SortState): boolean => {
    // simply check if there are more pairs designated for comparison.
    return state.itemsToCompare.length > 0;
};

/**
 * perform a topological sort on the items based on comparison results.
 */
export const topologicalSort = (
    items: CountryContestant[],
    graph: Map<string, Set<string>>
): CountryContestant[] => {
    // create a map from uid to item.
    const itemMap = new Map<string, CountryContestant>();
    items.forEach((item: CountryContestant) => {
        if (item?.uid) {
            itemMap.set(item.uid, item);
        }
    });

    // create a map to track in-degree of each node.
    const inDegree = new Map<string, number>();

    // initialize in-degree for all nodes.
    for (const uid of graph.keys()) {
        inDegree.set(uid, 0);
    }

    // calculate in-degree for each node.
    for (const [uid, edges] of graph.entries()) {
        for (const target of edges) {
            inDegree.set(target, (inDegree.get(target) || 0) + 1);
        }
    }

    // queue of nodes with no incoming edges.
    const queue: string[] = [];

    // add all nodes with in-degree 0 to the queue.
    for (const [uid, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(uid);
        }
    }

    // result array to hold sorted items.
    const result: CountryContestant[] = [];

    // process the queue.
    while (queue.length > 0) {
        // remove a node with no incoming edges.
        const uid = queue.shift()!;

        // add the corresponding item to the result.
        const item = itemMap.get(uid);
        if (item) {
            result.push(item);
        }

        // reduce the in-degree of adjacent nodes.
        const edges = graph.get(uid) || new Set();
        for (const target of edges) {
            const newDegree = (inDegree.get(target) || 0) - 1;
            inDegree.set(target, newDegree);

            // if the in-degree becomes 0, add to the queue.
            if (newDegree === 0) {
                queue.push(target);
            }
        }
    }

    // if we couldn't add all items (cycle in graph), add the remaining items
    // this shouldn't happen if preferences are consistent, but we handle it just in case.
    if (result.length < items.length) {
        // add any remaining items that weren't included.
        const includedUids = new Set(result.map((item: CountryContestant) => item.uid));
        items.forEach((item: CountryContestant) => {
            if (item?.uid && !includedUids.has(item.uid)) {
                result.push(item);
            }
        });
    }

    return result;
};

/**
 * generate a ranking directly from the comparisons data.
 */
export const generateRankingFromComparisons = (state: SortState): CountryContestant[] => {
    // we'll use a simple "win count" approach to start.
    const winCounts = new Map<string, number>();
    const itemMap = new Map<string, CountryContestant>();

    // initialize with all items.
    state.allItems.forEach((item: CountryContestant) => {
        if (item?.uid) {
            winCounts.set(item.uid, 0);
            itemMap.set(item.uid, item);
        }
    });

    // count wins for each item.
    state.comparisons.forEach((comp: Comparison) => {
        if (comp.choice) {
            const winnerId = comp.choice === 'left' ? comp.leftItem?.uid : comp.rightItem?.uid;

            if (winnerId) {
                winCounts.set(winnerId, (winCounts.get(winnerId) || 0) + 1);
            }
        }
    });

    // for more refined ranking, we can use a tournament-style approach
    // instead of just counting wins, we'll calculate a score based on who the item beat
    // this is similar to pagerank or elo algorithms
    const scores = new Map<string, number>(winCounts);

    // do multiple iterations to refine the scores.
    for (let iteration = 0; iteration < 5; iteration++) {
        const newScores = new Map<string, number>();

        // initialize with small base score.
        state.allItems.forEach((item: CountryContestant) => {
            if (item?.uid) {
                newScores.set(item.uid, 0.1);
            }
        });

        // update scores based on comparisons.
        state.comparisons.forEach((comp: Comparison) => {
            if (comp.leftItem?.uid && comp.rightItem?.uid && comp.choice) {
                const winnerId = comp.choice === 'left' ? comp.leftItem.uid : comp.rightItem.uid;
                const loserId = comp.choice === 'left' ? comp.rightItem.uid : comp.leftItem.uid;

                // add to winner's score based on loser's current score.
                const loserScore = scores.get(loserId) || 0;
                newScores.set(winnerId, (newScores.get(winnerId) || 0) + loserScore + 1);
            }
        });

        // update scores for next iteration.
        for (const [uid, score] of newScores.entries()) {
            scores.set(uid, score);
        }
    }

    // sort items by their final score (descending).
    const rankedItems = [...scores.entries()]
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
        .map(([uid]: [string, number]) => itemMap.get(uid))
        .filter((item): item is CountryContestant => item !== undefined);

    console.log("generated ranking from comparisons:", rankedItems.map((item: CountryContestant) => item.uid));
    return rankedItems;
};

/**
 * get the final sorted items.
 */
export const getSortedItems = (state: SortState): CountryContestant[] => {
    if (!state.isComplete) return [];

    // use the final ranking as the result.
    let result = [...state.currentRanking];

    // ensure all items are in the result (do not change existing uids).
    const includedIds = new Set(result.map((item: CountryContestant) => item.uid));
    const missingItems = state.allItems.filter((item: CountryContestant) =>
        item && item.uid && !includedIds.has(item.uid));

    if (missingItems.length > 0) {
        console.log(`adding ${missingItems.length} missing items to result`);
        result = [...result, ...missingItems];
    }

    // double-check that we have all items.
    if (result.length !== state.allItems.length) {
        console.warn(`warning: result has ${result.length} items, expected ${state.allItems.length}`);

        // if we somehow ended up with too many items, truncate
        if (result.length > state.allItems.length) {
            console.warn(`truncating result from ${result.length} to ${state.allItems.length} items`);
            result = result.slice(0, state.allItems.length);
        }
    }

    return result;
};

/**
 * fisher-yates shuffle algorithm to randomize array.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

function updateTransitiveClosure(graph: Map<string, Set<string>>, preferredUid: string, lessPreferredUid: string) {
    // get all nodes less preferred than lessPreferredUid (recursively).
    const toUpdate = findAllLessPreferred(graph, lessPreferredUid);

    // for each of those nodes, add an edge from preferredUid to that node.
    toUpdate.forEach(uid => {
        const edges = graph.get(preferredUid) || new Set();
        edges.add(uid);
        graph.set(preferredUid, edges);
    });
}

function findAllLessPreferred(graph: Map<string, Set<string>>, startUid: string): Set<string> {
    const visited = new Set<string>();
    const stack: string[] = [startUid];

    while (stack.length > 0) {
        const currentUid = stack.pop()!;

        if (visited.has(currentUid)) {
            continue;
        }
        visited.add(currentUid);

        const edges = graph.get(currentUid);
        if (edges) {
            edges.forEach(neighbor => {
                stack.push(neighbor);
            });
        }
    }
    return visited;
}