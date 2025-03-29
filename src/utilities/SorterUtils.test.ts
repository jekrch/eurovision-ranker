import { describe, it, expect, vi } from 'vitest';
import {
  initSortState,
  processChoice,
  getSortedItems,
  // advanceAlgorithm, // No longer needed directly in most tests after initSortState change
  ActionType,
  SortState,
  // shuffleArray, // Not directly tested here
  // shouldContinueSorting // Logic integrated into processChoice now
} from './SorterUtils'; // Adjust the path as necessary
import type { CountryContestant } from '../data/CountryContestant'; // Adjust the path
import type { Comparison } from '../components/ranking/SorterModal'; // Adjust the path

// Mock CountryContestant data
const createMockContestant = (id: string, name: string): CountryContestant => ({
  uid: id,
  id: id, // Assuming id is needed elsewhere
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

// --- Test Data (10 items) ---
const contestantsData = Array.from({ length: 10 }, (_, i) =>
  createMockContestant(`C${i + 1}`, String.fromCharCode(65 + i)) // C1/A, C2/B, ... C10/J
);

// Target order
const targetOrder: CountryContestant[] = [...contestantsData];

// Initial disordered list
const initialDisorderedList: CountryContestant[] = [
  contestantsData[3], // C4
  contestantsData[5], // C6
  contestantsData[8], // C9
  contestantsData[9], // C10
  contestantsData[4], // C5
  contestantsData[2], // C3
  contestantsData[6], // C7
  contestantsData[0], // C1
  contestantsData[7], // C8
  contestantsData[1], // C2
];

// Helper
const getTargetRank = (uid: string | undefined): number => {
  if (!uid) return Infinity;
  const index = targetOrder.findIndex(c => c.uid === uid);
  return index === -1 ? Infinity : index;
};

// --- Tests ---
describe('SorterUtils', () => {

  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('should initialize correctly for a list with multiple items (10 items)', () => {
    const n = initialDisorderedList.length; // 10
    const expectedTotalComparisons = n * (n - 1) / 2; // 10 * 9 / 2 = 45

    const state = initSortState(initialDisorderedList);

    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.allItems).toHaveLength(n);
    expect(state.allItems.map(c => c.uid).sort()).toEqual(initialDisorderedList.map(c => c.uid).sort());

    // *** CHANGED ASSERTIONS ***
    // Expect the first comparison to be set up by initSortState calling advanceAlgorithm
    expect(state.comparisons).toHaveLength(1);
    expect(state.comparisons[0].choice).toBeUndefined(); // Choice not made yet
    expect(state.currentIndex).toBe(0); // Pointing to the first comparison

    expect(state.itemsToCompare.length).toBe(expectedTotalComparisons - 1); // One pair moved from itemsToCompare to comparisons
    expect(state.estimatedTotalComparisons).toBe(expectedTotalComparisons); // Should be 45
    expect(state.totalComparisons).toBe(0); // No choices made yet
  });

  it('should initialize correctly for a list with one item', () => {
    const singleItemList = [contestantsData[0]];
    const state = initSortState(singleItemList);

    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual(singleItemList);
    expect(state.currentRanking).toEqual(singleItemList);
    expect(state.comparisons).toEqual([]);
    expect(state.itemsToCompare).toEqual([]);
    expect(state.totalComparisons).toBe(0);
  });

  it('should initialize correctly for an empty list', () => {
    const emptyList: CountryContestant[] = [];
    const state = initSortState(emptyList);

    expect(state.action).toBe(ActionType.DONE);
    expect(state.isComplete).toBe(true);
    expect(state.allItems).toEqual([]);
    expect(state.currentRanking).toEqual([]);
    expect(state.comparisons).toEqual([]);
    expect(state.itemsToCompare).toEqual([]);
    expect(state.totalComparisons).toBe(0);
  });

  // The main test scenario
  it('should sort a disordered list to match the target order by simulating choices', () => {
    // 1. Initialize the sorter
    let state = initSortState(initialDisorderedList);

    // Check initial state is ready for the *first* comparison
    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.comparisons).toHaveLength(1);
    expect(state.currentIndex).toBe(0);

    // 2. Simulate user choices based on the targetOrder until sorting is complete
    let safetyCounter = 0;
    const maxComparisons = state.estimatedTotalComparisons + 5; // Use actual estimate + buffer

    while (!state.isComplete && safetyCounter < maxComparisons) {
        expect(state.action).toBe(ActionType.COMPARE);
        expect(state.comparisons.length).toBeGreaterThan(0);
        // currentIndex should point to the comparison *waiting* for a choice
        expect(state.currentIndex).toBe(state.comparisons.length - 1);

        const currentComparison = state.comparisons[state.currentIndex];
        expect(currentComparison).toBeDefined();
        expect(currentComparison.choice).toBeUndefined(); // Make sure we haven't processed this one already
        expect(currentComparison.leftItem).toBeDefined();
        expect(currentComparison.rightItem).toBeDefined();

        // Determine the "correct" choice
        const leftRank = getTargetRank(currentComparison.leftItem?.uid);
        const rightRank = getTargetRank(currentComparison.rightItem?.uid);
        const choice = leftRank < rightRank ? 'left' : 'right';

        // Process the choice (this function now handles advancing or completing)
        state = processChoice(state, choice);

        safetyCounter++;
    }

    // 3. Verify the outcome
    expect(safetyCounter).toBeLessThan(maxComparisons); // Ensure the loop didn't timeout
    expect(safetyCounter).toBe(state.estimatedTotalComparisons); // Should take exactly this many comparisons now
    expect(state.isComplete).toBe(true);
    expect(state.action).toBe(ActionType.DONE);

    const finalRanking = getSortedItems(state);

    // Verify the final ranking matches the target order
    expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
    expect(finalRanking).toHaveLength(targetOrder.length);
  });

  it('getSortedItems should return an empty array if sorting is not complete', () => {
    // Initialize, but don't process choices
    const state = initSortState(initialDisorderedList);
    expect(state.isComplete).toBe(false);
    const result = getSortedItems(state);
    expect(result).toEqual([]);
  });

});