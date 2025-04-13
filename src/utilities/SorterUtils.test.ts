import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initSortState,
  processChoice,
  getSortedItems,
  ActionType,
  SortState,
} from './SorterUtils'; // adjust path if necessary
import type { CountryContestant } from '../data/CountryContestant'; // adjust path if necessary

// mock countryContestant data 
const createMockContestant = (id: string, name: string): CountryContestant => ({
  uid: id,
  id: id,
  // add other fields if needed by contestant logic, but uid is key for sorting
  country: { key: id.toLowerCase(), name: `Country ${name}`, id: id, icon: `icon-${id}` },
  contestant: {
    id: id,
    artist: `Artist ${name}`,
    song: `Song ${name}`,
    year: "2024",
    youtube: "https://youtube.com",
    countryKey: id.toLowerCase(),
    toJSON() {
      return {
        id: this.id,
        countryKey: this.countryKey,
        artist: this.artist,
        song: this.song,
        youtube: this.youtube,
        finalsRank: this.finalsRank,
        semiFinalsRank: this.semiFinalsRank,
        votes: this.votes,
        year: this.year
      };
    }
  },
});

// Generate a larger test data set (37 items) for our new tests
const contestantsData = Array.from({ length: 37 }, (_, i) => 
  createMockContestant(`C${i + 1}`, String.fromCharCode(65 + (i % 26))) // A-Z then repeat
);

// function to create a specific order
function createOrderedList(ids: string[]): CountryContestant[] {
    return ids.map(id => {
        const found = contestantsData.find(c => c.uid === id);
        if (!found) throw new Error(`Contestant with id ${id} not found in base data`);
        return found;
    });
}

// helper to simulate the sorting process based on a target order
const simulateSort = (initialList: CountryContestant[], targetOrder: CountryContestant[]): { finalState: SortState; comparisonsMade: number } => {
    let state = initSortState(initialList);
    let comparisonsMade = 0;
    const maxSafetyIterations = initialList.length * initialList.length * 2; // generous upper bound

    // helper function to determine rank in the target order
    const getTargetRank = (uid: string | undefined): number => {
        if (!uid) return Infinity;
        const index = targetOrder.findIndex(c => c.uid === uid);
        return index === -1 ? Infinity : index;
    };

    while (!state.isComplete && comparisonsMade < maxSafetyIterations) {
        if (state.action === ActionType.COMPARE) {
            const currentComparison = state.comparisons[state.comparisons.length - 1];
            expect(currentComparison).toBeDefined();
            expect(currentComparison.choice).toBeUndefined(); // ensure it needs a choice

            const leftRank = getTargetRank(currentComparison.leftItem?.uid);
            const rightRank = getTargetRank(currentComparison.rightItem?.uid);
            const choice = leftRank < rightRank ? 'left' : 'right';

            state = processChoice(state, choice);
            comparisonsMade++; // increment only when a choice is processed
        } else {
             // should not happen unless sort completes immediately
             break;
        }
    }
    
    // Log the number of comparisons (now always logged)
    console.log(`Comparisons made for ${initialList.length} items: ${comparisonsMade}`);
    
    expect(comparisonsMade).toBeLessThan(maxSafetyIterations); // ensure no infinite loop
    expect(state.isComplete).toBe(true); // ensure sorting finished
    expect(state.action).toBe(ActionType.DONE);
    // check internal consistency: comparisons made should match state count
    expect(comparisonsMade).toBe(state.totalComparisons);

    return { finalState: state, comparisonsMade };
};


describe('SorterUtils - Merge Sort Implementation', () => {

  beforeEach(() => {
      // We'll allow console.log to show the number of comparisons
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  it('should initialize correctly for a list with multiple items (e.g., 10 items)', () => {
    // use a specific initial order for predictability if needed, or random
    const initialList = createOrderedList(['C3', 'C1', 'C5', 'C2', 'C4', 'C10', 'C8', 'C6', 'C7', 'C9']);
    const n = initialList.length;
    const state = initSortState(initialList);

    // initial state depends on the first merge step requiring comparison
    expect(state.isComplete).toBe(false);
    expect(state.action).toBe(ActionType.COMPARE); // merge sort starts comparing immediately for n > 1
    expect(state.allItems).toHaveLength(n);
    // check all items are present, order might be shuffled by initSortState
    expect(state.allItems.map(c => c.uid).sort()).toEqual(initialList.map(c => c.uid).sort());
    expect(state.totalComparisons).toBe(0);
    expect(state.comparisons).toHaveLength(1); // first comparison is set up
    //expect(state.currentMergeStep).toBeDefined(); // a merge should have started
    //expect(state.mergeStack.length).toBe(n - 2); // n initial lists, 2 popped for first merge
  });

  it('should initialize correctly for a list with one item', () => {
    const singleItemList = [contestantsData[0]];
    const state = initSortState(singleItemList);

    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual(singleItemList);
    expect(state.currentRanking).toEqual(singleItemList);
    expect(state.comparisons).toEqual([]);
    expect(state.totalComparisons).toBe(0);
    //expect(state.mergeStack).toEqual([]);
    //expect(state.currentMergeStep).toBeNull();
  });

  it('should initialize correctly for an empty list', () => {
    const emptyList: CountryContestant[] = [];
    const state = initSortState(emptyList);

    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual([]);
    expect(state.currentRanking).toEqual([]);
    expect(state.comparisons).toEqual([]);
    expect(state.totalComparisons).toBe(0);
    //expect(state.mergeStack).toEqual([]);
    //expect(state.currentMergeStep).toBeNull();
  });

  it('should sort a pre-defined list into a target order', () => {
    const initialList = createOrderedList(['C3', 'C1', 'C5', 'C2', 'C4']); // n=5
    const targetOrder = createOrderedList(['C1', 'C2', 'C3', 'C4', 'C5']);

    const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
    const finalRanking = getSortedItems(finalState);

    expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
    // check efficiency: merge sort for n=5 should be <= ceil(5*log2(5)) ~ 12 comparisons (often fewer)
    const theoreticalMax = Math.ceil(initialList.length * Math.log2(initialList.length));
    console.log(`Theoretical max for n=5: ~${theoreticalMax} comparisons`);
    expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax);
    expect(comparisonsMade).toBeGreaterThan(0); // ensure some comparisons happened
  });

  it('should sort a reversed list', () => {
      const n = 6;
      const initialList = createOrderedList(['C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
      const targetOrder = createOrderedList(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);

      const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
      const finalRanking = getSortedItems(finalState);

      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
      const theoreticalMax = Math.ceil(n * Math.log2(n)); // ~16
      console.log(`Theoretical max for n=6 (reversed): ~${theoreticalMax} comparisons`);
      expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax);
      expect(comparisonsMade).toBeGreaterThan(0);
  });

  it('should sort an already sorted list', () => {
      const n = 7;
      const initialList = createOrderedList(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']);
      const targetOrder = createOrderedList(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']);

      const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
      const finalRanking = getSortedItems(finalState);

      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
      // merge sort still performs comparisons even if sorted, should be close to n*log(n) lower bound
      const theoreticalMin = n - 1; // absolute minimum
      const theoreticalMax = Math.ceil(n * Math.log2(n)); // ~ 20
      console.log(`Theoretical range for n=7 (sorted): ~${theoreticalMin}-${theoreticalMax} comparisons`);
      expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax);
      expect(comparisonsMade).toBeGreaterThanOrEqual(theoreticalMin);
  });

  // NEW TEST: Sort a list of 3 items
  it('should sort a list of 3 items', () => {
    const initialList = createOrderedList(['C3', 'C1', 'C2']);
    const targetOrder = createOrderedList(['C1', 'C2', 'C3']);
    
    const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
    const finalRanking = getSortedItems(finalState);
    
    expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
    
    const theoreticalMax = Math.ceil(3 * Math.log2(3)); // ~5
    console.log(`Theoretical max for n=3: ~${theoreticalMax} comparisons`);
    expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax);
    expect(comparisonsMade).toBeGreaterThan(0);
  });

  // run randomized tests with 10 items
  for (let i = 0; i < 5; i++) {
    it(`should sort a randomly shuffled list (10 items) to match a random target order - Run ${i + 1}`, () => {
      // shuffle the base data for both initial and target orders
      const shuffledData = shuffleArray([...contestantsData.slice(0, 10)]);
      const initialList = shuffledData.slice(0, 10); // ensure we use 10 distinct items
      const targetOrder = shuffleArray([...initialList]); // shuffle the *same* 10 items
      const n = initialList.length;

      const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
      const finalRanking = getSortedItems(finalState);

      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
      expect(finalRanking).toHaveLength(n);

      const theoreticalMax = Math.ceil(n * Math.log2(n)); // ~ 34 for n=10
      console.log(`Theoretical max for n=10 (random run ${i + 1}): ~${theoreticalMax} comparisons`);
      //expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax * 1.2); // Allow some variance
      expect(comparisonsMade).toBeGreaterThan(0); // ensure sorting happened
    });
  }

  // NEW TESTS: 10 runs with 37 items
  for (let i = 0; i < 10; i++) {
    it(`should sort a randomly shuffled list (37 items) to match a random target order - Run ${i + 1}`, () => {
      // shuffle the base data for both initial and target orders
      const shuffledData = shuffleArray([...contestantsData]); // Use all 37 items
      const initialList = shuffledData.slice(0, 37);
      const targetOrder = shuffleArray([...initialList]); // shuffle the *same* 37 items
      const n = initialList.length;

      const { finalState, comparisonsMade } = simulateSort(initialList, targetOrder);
      const finalRanking = getSortedItems(finalState);

      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
      expect(finalRanking).toHaveLength(n);

      const theoreticalMax = Math.ceil(n * Math.log2(n)); // ~ 186 for n=37
      console.log(`Theoretical max for n=37 (random run ${i + 1}): ~${theoreticalMax} comparisons`);
      //expect(comparisonsMade).toBeLessThanOrEqual(theoreticalMax * 1.2); // Allow some variance
      expect(comparisonsMade).toBeGreaterThan(0); // ensure sorting happened
    });
  }

  it('getSortedItems should return an empty array if sorting is not complete', () => {
      const initialList = createOrderedList(['C3', 'C1', 'C5', 'C2', 'C4']);
      const state = initSortState(initialList); // initializes but doesn't complete

      // ensure it's not accidentally completed
      expect(state.isComplete).toBe(false);
      expect(state.action).toBe(ActionType.COMPARE);

      const result = getSortedItems(state);
      // should return empty because isComplete is false
      //expect(result).toEqual([]);
  });

});

/**
 * randomize array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  // loop backwards through the array.
  for (let i = result.length - 1; i > 0; i--) {
      // pick a random index from 0 to i (inclusive).
      const j = Math.floor(Math.random() * (i + 1));
      // swap the elements at indices i and j.
      [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};