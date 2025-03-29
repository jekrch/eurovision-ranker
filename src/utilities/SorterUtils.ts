import { Comparison } from "../components/ranking/SorterModal";
import { CountryContestant } from "../data/CountryContestant";


// Simple direct sorting state
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
}

// Simple enum to track algorithm state
export enum ActionType {
  COMPARE = "COMPARE",
  DONE = "DONE"
}

/**
 * Initialize a simple direct sorting algorithm
 */
export const initSortState = (items: CountryContestant[]): SortState => {
  // Filter out any undefined or null items but NEVER modify UIDs
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
      aux: validItems
    };
  }

  // Shuffle the items initially to avoid bias
  const shuffledItems = shuffleArray([...validItems]);
  
  // Create all possible pairs to compare
  const allPairs: [number, number][] = [];
  for (let i = 0; i < shuffledItems.length; i++) {
    for (let j = i + 1; j < shuffledItems.length; j++) {
      allPairs.push([i, j]);
    }
  }
  
  // Shuffle the pairs to avoid predictable ordering
  const shuffledPairs = shuffleArray(allPairs);
  
  // Calculate total possible comparisons
  const totalPossible = shuffledItems.length * (shuffledItems.length - 1) / 2;
  
  const initialState: SortState = {
    action: ActionType.COMPARE, // Tentative, advanceAlgorithm might change if no pairs
    allItems: shuffledItems,
    comparisons: [],
    currentIndex: -1, // Nothing selected initially
    isComplete: false,
    totalComparisons: 0,
    estimatedTotalComparisons: totalPossible,
    currentRanking: shuffledItems, // Start with shuffled
    itemsToCompare: shuffledPairs,
    stack: [],
    aux: undefined
  };

 // If there are pairs to compare, advance to the first one
 if (initialState.itemsToCompare.length > 0) {
    return advanceAlgorithm(initialState); // Prepare the first comparison
 } else {
    // No pairs to compare (e.g., n=0 or n=1 after filtering)
    // initSortState already handles n<=1 returning a DONE state,
    // but this is a safeguard if filtering produced n>1 but pairs logic failed.
    initialState.action = ActionType.DONE;
    initialState.isComplete = true;
    initialState.currentRanking = initialState.allItems; // Should be correct based on filter
    return initialState;
 }
};

/**
 * Process user's choice and update the ranking
 */
export const processChoice = (state: SortState, choice: 'left' | 'right'): SortState => {
  const newState = { ...state };
  newState.comparisons = [...state.comparisons]; // Ensure copy

  // --- Record the choice for the current comparison ---
  if (newState.currentIndex < newState.comparisons.length) {
    // Find the comparison object added by the last advanceAlgorithm call
    const currentComparisonIndex = newState.currentIndex; // This should be the index of the pair we just decided on
    // Make sure it exists and doesn't already have a choice (e.g., back button logic)
    if(newState.comparisons[currentComparisonIndex] && !newState.comparisons[currentComparisonIndex].choice) {
         newState.comparisons[currentComparisonIndex] = {
            ...newState.comparisons[currentComparisonIndex],
            choice // Add the user's choice
         };
         newState.totalComparisons += 1; // Increment only when a choice is made
    } else {
        // This might happen if logic gets confused (e.g. double click, back button issues)
        console.warn("Attempted to process choice for an invalid or already-chosen comparison index:", newState.currentIndex);
        // Potentially just return the current state or handle error appropriately
        return state; // Avoid proceeding with bad state
    }

  } else {
     console.warn("CurrentIndex out of bounds during processChoice");
     return state; // Avoid proceeding
  }


  // --- Update Ranking (always do this after a choice) ---
  const graph = new Map<string, Set<string>>();
  newState.allItems.forEach((item: CountryContestant) => {
    if (item?.uid) {
      graph.set(item.uid, new Set());
    }
  });

  // Add *all completed* comparisons to the graph
  newState.comparisons.forEach((comp: Comparison) => { // Iterate ALL comparisons
    if (comp.leftItem?.uid && comp.rightItem?.uid && comp.choice) { // Only use ones with a choice
      const preferredUid = comp.choice === 'left' ? comp.leftItem.uid : comp.rightItem.uid;
      const lessPreferredUid = comp.choice === 'left' ? comp.rightItem.uid : comp.leftItem.uid;
      const edges = graph.get(preferredUid) || new Set();
      edges.add(lessPreferredUid);
      graph.set(preferredUid, edges);
    }
  });

  newState.currentRanking = topologicalSort(newState.allItems, graph);

  // --- Decide Next Step ---
  // Check if there are still pairs waiting in the queue
  if (newState.itemsToCompare.length > 0) {
      // If yes, prepare the *next* comparison
      return advanceAlgorithm(newState);
  } else {
      // If no more pairs in the queue, we are done.
      newState.isComplete = true;
      newState.action = ActionType.DONE;
      console.log("Final ranking by year:", newState.currentRanking.map((item: CountryContestant) => item.contestant?.year).join(", "));
      return newState;
  }
};

/**
 * Advance to the next comparison (sets up the state FOR the next choice)
 * Assumes state passed in is one where a choice was just made or initialization occurred.
 */
export const advanceAlgorithm = (state: SortState): SortState => {
  // This function should ONLY set up the next comparison pair
  // It should assume the calling function (processChoice or initSortState)
  // has already determined that we *should* advance.

  const newState = { ...state };

  // If we've somehow been called when complete, or itemsToCompare is empty, just return
  // (This check prevents errors but shouldn't be the primary completion logic)
   if (newState.isComplete || newState.itemsToCompare.length === 0) {
     // If itemsToCompare is empty here, it means processChoice should have caught it.
     // Log a warning potentially.
     if(!newState.isComplete) {
        console.warn("advanceAlgorithm called with empty itemsToCompare but not complete.");
        // Force completion as a fallback
        newState.isComplete = true;
        newState.action = ActionType.DONE;
     }
     return newState;
   }

  // Get the next pair to compare
  const [leftIndex, rightIndex] = newState.itemsToCompare[0];

  // Remove this pair from the list *before* adding it to comparisons
  newState.itemsToCompare = newState.itemsToCompare.slice(1);

  const leftItem = newState.allItems[leftIndex];
  const rightItem = newState.allItems[rightIndex];

  if (leftItem && rightItem) {
    // Add the new comparison object *without* a choice yet
    newState.comparisons.push({
      leftItem,
      rightItem
      // No choice here! Choice comes from processChoice
    });

    // Update current index to point to this new, unchosen comparison
    newState.currentIndex = newState.comparisons.length - 1;
    newState.action = ActionType.COMPARE; // Ensure action is COMPARE

    return newState;
  } else {
     // Handle error: Invalid items found at indices
     console.error("Invalid items found when advancing algorithm.");
     // Potentially mark as done/error state? For now, return current state.
     // Or filter itemsToCompare? This case indicates a deeper issue maybe.
     return state;
  }
};


/**
 * Determine if we should continue sorting
 */
export const shouldContinueSorting = (state: SortState): boolean => {
  // Simply check if there are more pairs designated for comparison.
  return state.itemsToCompare.length > 0;
};

/**
 * Calculate progress percentage for the progress bar
 */
export const calculateProgress = (state: SortState): number => {
  if (state.isComplete) return 100;
  
  const n = state.allItems.length;
  const totalPossible = n * (n - 1) / 2;
  
  // Calculate based on the total number of comparisons done vs possible
  const progress = Math.min(95, Math.round((state.totalComparisons / totalPossible) * 100));
  
  return progress;
};

/**
 * Perform a topological sort on the items based on comparison results
 */
export const topologicalSort = (
  items: CountryContestant[],
  graph: Map<string, Set<string>>
): CountryContestant[] => {
  // Create a map from UID to item
  const itemMap = new Map<string, CountryContestant>();
  items.forEach((item: CountryContestant) => {
    if (item?.uid) {
      itemMap.set(item.uid, item);
    }
  });
  
  // Create a map to track in-degree of each node
  const inDegree = new Map<string, number>();
  
  // Initialize in-degree for all nodes
  for (const uid of graph.keys()) {
    inDegree.set(uid, 0);
  }
  
  // Calculate in-degree for each node
  for (const [uid, edges] of graph.entries()) {
    for (const target of edges) {
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  }
  
  // Queue of nodes with no incoming edges
  const queue: string[] = [];
  
  // Add all nodes with in-degree 0 to the queue
  for (const [uid, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(uid);
    }
  }
  
  // Result array to hold sorted items
  const result: CountryContestant[] = [];
  
  // Process the queue
  while (queue.length > 0) {
    // Remove a node with no incoming edges
    const uid = queue.shift()!;
    
    // Add the corresponding item to the result
    const item = itemMap.get(uid);
    if (item) {
      result.push(item);
    }
    
    // Reduce the in-degree of adjacent nodes
    const edges = graph.get(uid) || new Set();
    for (const target of edges) {
      const newDegree = (inDegree.get(target) || 0) - 1;
      inDegree.set(target, newDegree);
      
      // If the in-degree becomes 0, add to the queue
      if (newDegree === 0) {
        queue.push(target);
      }
    }
  }
  
  // If we couldn't add all items (cycle in graph), add the remaining items
  // This shouldn't happen if preferences are consistent, but we handle it just in case
  if (result.length < items.length) {
    // Add any remaining items that weren't included
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
 * Generate a ranking directly from the comparisons data
 */
export const generateRankingFromComparisons = (state: SortState): CountryContestant[] => {
  // We'll use a simple "win count" approach to start
  const winCounts = new Map<string, number>();
  const itemMap = new Map<string, CountryContestant>();
  
  // Initialize with all items
  state.allItems.forEach((item: CountryContestant) => {
    if (item?.uid) {
      winCounts.set(item.uid, 0);
      itemMap.set(item.uid, item);
    }
  });
  
  // Count wins for each item
  state.comparisons.forEach((comp: Comparison) => {
    if (comp.choice) {
      const winnerId = comp.choice === 'left' ? comp.leftItem?.uid : comp.rightItem?.uid;
      
      if (winnerId) {
        winCounts.set(winnerId, (winCounts.get(winnerId) || 0) + 1);
      }
    }
  });
  
  // For more refined ranking, we can use a tournament-style approach
  // Instead of just counting wins, we'll calculate a score based on who the item beat
  // This is similar to PageRank or ELO algorithms
  const scores = new Map<string, number>(winCounts);
  
  // Do multiple iterations to refine the scores
  for (let iteration = 0; iteration < 5; iteration++) {
    const newScores = new Map<string, number>();
    
    // Initialize with small base score
    state.allItems.forEach((item: CountryContestant) => {
      if (item?.uid) {
        newScores.set(item.uid, 0.1);
      }
    });
    
    // Update scores based on comparisons
    state.comparisons.forEach((comp: Comparison) => {
      if (comp.leftItem?.uid && comp.rightItem?.uid && comp.choice) {
        const winnerId = comp.choice === 'left' ? comp.leftItem.uid : comp.rightItem.uid;
        const loserId = comp.choice === 'left' ? comp.rightItem.uid : comp.leftItem.uid;
        
        // Add to winner's score based on loser's current score
        const loserScore = scores.get(loserId) || 0;
        newScores.set(winnerId, (newScores.get(winnerId) || 0) + loserScore + 1);
      }
    });
    
    // Update scores for next iteration
    for (const [uid, score] of newScores.entries()) {
      scores.set(uid, score);
    }
  }
  
  // Sort items by their final score (descending)
  const rankedItems = [...scores.entries()]
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .map(([uid]: [string, number]) => itemMap.get(uid))
    .filter((item): item is CountryContestant => item !== undefined);
  
  console.log("Generated ranking from comparisons:", rankedItems.map((item: CountryContestant) => item.uid));
  return rankedItems;
};

/**
 * Get the final sorted items
 */
export const getSortedItems = (state: SortState): CountryContestant[] => {
  if (!state.isComplete) return [];
  
  // Use the final ranking as the result
  let result = [...state.currentRanking];
  
  // Ensure all items are in the result (do NOT change existing UIDs)
  const includedIds = new Set(result.map((item: CountryContestant) => item.uid));
  const missingItems = state.allItems.filter((item: CountryContestant) => 
    item && item.uid && !includedIds.has(item.uid));
  
  if (missingItems.length > 0) {
    console.log(`Adding ${missingItems.length} missing items to result`);
    result = [...result, ...missingItems];
  }
  
  // Double-check that we have all items
  if (result.length !== state.allItems.length) {
    console.warn(`Warning: Result has ${result.length} items, expected ${state.allItems.length}`);
    
    // If we somehow ended up with too many items, truncate
    if (result.length > state.allItems.length) {
      console.warn(`Truncating result from ${result.length} to ${state.allItems.length} items`);
      result = result.slice(0, state.allItems.length);
    }
  }
  
  return result;
};

/**
 * Fisher-Yates shuffle algorithm to randomize array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};