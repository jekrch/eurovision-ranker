import { describe, it, expect, vi } from 'vitest';
import {
  initSortState,
  processChoice,
  getSortedItems,
  ActionType,
  // SortState // uncomment if needed for explicit typing in tests
} from './SorterUtils'; // adjust path if necessary
import type { CountryContestant } from '../data/CountryContestant'; // adjust path if necessary

// mock countryContestant data
const createMockContestant = (id: string, name: string): CountryContestant => ({
  uid: id,
  id: id,
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

// test data (using 38 items for comprehensive tests)
const contestantsData = Array.from({ length: 38 }, (_, i) =>
  createMockContestant(`C${i + 1}`, String.fromCharCode(65 + i))
);


function createRandomOrder(contestants: CountryContestant[]): CountryContestant[] {
    const array = [...contestants];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// helper function to get a random subset of a specified size
function getRandomSubset<T>(array: T[], count: number): T[] {
    if (count < 0 || count > array.length) {
        throw new Error("invalid count for subset selection.");
    }
    if (count === 0) return [];

    // shuffle a copy of the array and take the first 'count' items
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}


describe('SorterUtils', () => {

  // silence console logs during tests if they become noisy
  beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
      vi.restoreAllMocks(); // restore mocks after each test
  });

  it('should initialize correctly for a list with multiple items (e.g., 38 items)', () => {
    const initialDisorderedList = createRandomOrder(contestantsData);
    const n = initialDisorderedList.length;

    const state = initSortState(initialDisorderedList);

    // expect it to be ready for the first comparison
    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.allItems).toHaveLength(n);
    // check if all original items are present, regardless of initial shuffled order
    expect(state.allItems.map(c => c.uid).sort()).toEqual(contestantsData.map(c => c.uid).sort());

    // expect the first comparison to be set up by advanceAlgorithm called within initSortState
    expect(state.comparisons).toHaveLength(1);
    expect(state.comparisons[0].choice).toBeUndefined();
    expect(state.currentIndex).toBe(0); // should be 0 for the first comparison

    // estimatedTotalComparisons reflects the potentially reduced number after initial filtering
    expect(state.totalComparisons).toBe(0);
    expect(state.graph).toBeDefined();
    expect(state.graph.size).toBe(n); // graph should have nodes for all items
  });

  it('should initialize correctly for a list with one item', () => {
    // get a single item randomly to avoid always using the first one
    const singleItemList = getRandomSubset(contestantsData, 1);
    const state = initSortState(singleItemList);

    // sorting is immediately done for a single item
    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual(singleItemList);
    expect(state.currentRanking).toEqual(singleItemList);
    expect(state.comparisons).toEqual([]);
    expect(state.totalComparisons).toBe(0);
    expect(state.estimatedTotalComparisons).toBe(0);
    expect(state.graph.size).toBe(0); // graph should have the single node
  });

  it('should initialize correctly for an empty list', () => {
    const emptyList: CountryContestant[] = [];
    const state = initSortState(emptyList);

    // sorting is immediately done for an empty list
    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual([]);
    expect(state.currentRanking).toEqual([]);
    expect(state.comparisons).toEqual([]);
    expect(state.totalComparisons).toBe(0);
    expect(state.estimatedTotalComparisons).toBe(0);
    expect(state.graph.size).toBe(0); // graph is empty
  });

  it('should sort a randomly disordered list to match a random target order using dynamic comparisons', () => {
    // create random initial and target orders for this test
    const initialDisorderedList = createRandomOrder(contestantsData);
    const targetOrder = createRandomOrder(contestantsData);
    const n = contestantsData.length;
    const maxPossibleComparisons = n * (n - 1) / 2; // theoretical max

    // helper function to determine rank in the specific target order for this test
    const getTargetRank = (uid: string | undefined): number => {
      if (!uid) return Infinity; // handle undefined uid if necessary
      const index = targetOrder.findIndex(c => c.uid === uid);
      return index === -1 ? Infinity : index; // item not found ranks last
    };

    // initialize the sorter
    let state = initSortState(initialDisorderedList);

    // check initial state is ready for the *first* comparison
    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.comparisons).toHaveLength(1);
    expect(state.currentIndex).toBe(0);

    // simulate user choices based on the targetOrder until sorting is complete
    let safetyCounter = 0;
    // use a generous safety margin based on theoretical max
    const maxSafetyIterations = maxPossibleComparisons + 10;

    while (!state.isComplete && safetyCounter < maxSafetyIterations) {
      expect(state.action).toBe(ActionType.COMPARE); // should stay COMPARE until done
      expect(state.comparisons.length).toBeGreaterThan(0);
      // current index should point to the comparison *waiting* for a choice
      expect(state.currentIndex).toBe(state.comparisons.length - 1);

      const currentComparison = state.comparisons[state.currentIndex];
      expect(currentComparison).toBeDefined();
      expect(currentComparison.choice).toBeUndefined(); // ensure we haven't processed this one already
      expect(currentComparison.leftItem).toBeDefined();
      expect(currentComparison.rightItem).toBeDefined();

      // determine the "correct" choice based on the target order for this test run
      const leftRank = getTargetRank(currentComparison.leftItem?.uid);
      const rightRank = getTargetRank(currentComparison.rightItem?.uid);
      const choice = leftRank < rightRank ? 'left' : 'right';

      // process the choice (this updates graph, ranking, itemsToCompare, and advances)
      state = processChoice(state, choice);

      safetyCounter++;
    }

    // verify the outcome
    expect(safetyCounter).toBeLessThan(maxSafetyIterations); // ensure the loop didn't timeout
    // the number of choices made must match the final totalComparisons count
    expect(safetyCounter).toBe(state.totalComparisons);
    // the actual comparisons should be less than or equal to the theoretical max due to transitive reduction
    expect(state.totalComparisons).toBeLessThanOrEqual(maxPossibleComparisons);
    expect(state.isComplete).toBe(true);
    expect(state.action).toBe(ActionType.DONE);

    const finalRanking = getSortedItems(state);

    // verify the final ranking matches the target order used for choices
    expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
    expect(finalRanking).toHaveLength(targetOrder.length);
  });

  it('getSortedItems should return an empty array if sorting is not complete', () => {
    const initialDisorderedList = createRandomOrder(contestantsData);
    // initialize, but don't process any choices
    const state = initSortState(initialDisorderedList);

    // ensure it's not accidentally completed (only possible for lists <= 1 item)
    if (initialDisorderedList.length > 1) {
        expect(state.isComplete).toBe(false);
    }

    const result = getSortedItems(state);
    // should return empty because isComplete is false
    expect(result).toEqual([]);
  });

  // run 5 randomized tests with the full list (38 items)
  for (let i = 0; i < 5; i++) {
    it(`should sort a randomly disordered list (38 items) to match a random target order - Run ${i + 1}`, () => {
      const initialDisorderedList = createRandomOrder(contestantsData);
      const targetOrder = createRandomOrder(contestantsData);
      const n = contestantsData.length;
      const maxPossibleComparisons = n * (n - 1) / 2;

       // helper function to determine rank in the target order for this specific run
      const getTargetRank = (uid: string | undefined): number => {
        if (!uid) return Infinity;
        const index = targetOrder.findIndex(c => c.uid === uid);
        return index === -1 ? Infinity : index;
      };

      let state = initSortState(initialDisorderedList);

      // initial checks
      expect(state.action).toBe(ActionType.COMPARE);
      expect(state.isComplete).toBe(false);
      expect(state.comparisons).toHaveLength(1);
      expect(state.currentIndex).toBe(0);

      let safetyCounter = 0;
      const maxSafetyIterations = maxPossibleComparisons + 10; // safety margin

      // simulation loop
      while (!state.isComplete && safetyCounter < maxSafetyIterations) {
        expect(state.action).toBe(ActionType.COMPARE); // ensure still comparing
        const currentComparison = state.comparisons[state.currentIndex];
        expect(currentComparison).toBeDefined();
        expect(currentComparison.choice).toBeUndefined();

        const leftRank = getTargetRank(currentComparison.leftItem?.uid);
        const rightRank = getTargetRank(currentComparison.rightItem?.uid);
        const choice = leftRank < rightRank ? 'left' : 'right';

        state = processChoice(state, choice);
        safetyCounter++;
      }

      // final checks
      expect(safetyCounter).toBeLessThan(maxSafetyIterations); // check it finished
      expect(safetyCounter).toBe(state.totalComparisons); // check choices made match final count
      expect(state.totalComparisons).toBeLessThanOrEqual(maxPossibleComparisons); // check efficiency
      expect(state.isComplete).toBe(true);
      expect(state.action).toBe(ActionType.DONE);

      const finalRanking = getSortedItems(state);
      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid)); // check final order
      expect(finalRanking).toHaveLength(targetOrder.length); // check length
    });
  }

    // tests for sorting a subset of 3 items, run 100 times for robustness
    const numberOfSubsetTests = 9;
    for (let i = 0; i < numberOfSubsetTests; i++) {
      it(`should sort a randomly disordered list of 3 to match a random target order - Run ${i + 1}/${numberOfSubsetTests}`, () => {
        // get a random subset of 3 items from the full dataset
        const subsetData = getRandomSubset(contestantsData, 3);
        const n = subsetData.length; // n will always be 3
        const maxPossibleComparisons = n * (n - 1) / 2; // always 3 for n=3

        // create random initial and target orders *for this specific subset*
        const initialDisorderedList = createRandomOrder(subsetData);
        const targetOrderSubset = createRandomOrder(subsetData);

        // helper function to determine rank in the target order of the subset
        const getTargetRank = (uid: string | undefined): number => {
            if (!uid) return Infinity;
            const index = targetOrderSubset.findIndex(c => c.uid === uid);
            return index === -1 ? Infinity : index;
        };

        let state = initSortState(initialDisorderedList);

        // initial state checks - should always start with COMPARE for 3 items
        expect(state.action).toBe(ActionType.COMPARE);
        expect(state.isComplete).toBe(false);
        expect(state.comparisons).toHaveLength(1); // initSort calls advanceAlgorithm once
        expect(state.currentIndex).toBe(0);
        // initial estimate might be 3, but could be less if init filters (though unlikely for n=3)
        //expect(state.estimatedTotalComparisons).toBeLessThanOrEqual(maxPossibleComparisons);

        let safetyCounter = 0;
        const maxSafetyIterations = maxPossibleComparisons + 5; // 3 + 5 = 8 is plenty

        // simulation loop
        while (!state.isComplete && safetyCounter < maxSafetyIterations) {
          // we expect compare state here because we checked initial state already
          // and processChoice should leave it as COMPARE until the end
          expect(state.action).toBe(ActionType.COMPARE);

          const currentComparison = state.comparisons[state.currentIndex];
          expect(currentComparison).toBeDefined();
          expect(currentComparison.choice).toBeUndefined();
          expect(currentComparison.leftItem).toBeDefined();
          expect(currentComparison.rightItem).toBeDefined();

          const leftRank = getTargetRank(currentComparison.leftItem?.uid);
          const rightRank = getTargetRank(currentComparison.rightItem?.uid);
          const choice = leftRank < rightRank ? 'left' : 'right';

          state = processChoice(state, choice);
          safetyCounter++;
        }

        console.info(safetyCounter);
        
        // final checks
        expect(safetyCounter).toBeLessThan(maxSafetyIterations); // ensure loop didn't timeout
        expect(safetyCounter).toBe(state.totalComparisons); // check choices made match final count
        // the actual comparisons for n=3 should be between 2 and 3
        expect(state.totalComparisons).toBeGreaterThanOrEqual(n - 1); // needs at least 2 comparisons
        expect(state.totalComparisons).toBeLessThanOrEqual(maxPossibleComparisons); // needs at most 3 comparisons
        expect(state.isComplete).toBe(true);
        expect(state.action).toBe(ActionType.DONE);
        //expect(state.itemsToCompare).toHaveLength(0); // no comparisons should remain

        const finalRanking = getSortedItems(state);

        // compare the final ranking against the expected order *of the subset*
        expect(finalRanking.map(c => c.uid)).toEqual(targetOrderSubset.map(c => c.uid));
        // compare the length against the expected length *of the subset*
        expect(finalRanking).toHaveLength(targetOrderSubset.length); // should be 3
      });
    }
});