import { describe, it, expect, vi } from 'vitest';
import {
  initSortState,
  processChoice,
  getSortedItems,
  ActionType,
} from './SorterUtils';
import type { CountryContestant } from '../data/CountryContestant';

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

// test data (38 items)
const contestantsData = Array.from({ length: 38 }, (_, i) =>
  createMockContestant(`C${i + 1}`, String.fromCharCode(65 + i))
);

// target order
const targetOrder: CountryContestant[] = [...contestantsData];

// initial disordered list
function createInitialDisorderedList(contestants: CountryContestant[]): CountryContestant[] {
  const disordered = [...contestants];
  // Fisher-Yates shuffle (modified to be deterministic)
  for (let i = disordered.length - 1; i > 0; i--) {
    // create deterministic index for tests
    const j = (i * 7) % (i + 1);
    [disordered[i], disordered[j]] = [disordered[j], disordered[i]];
  }
  return disordered;
}

const initialDisorderedList: CountryContestant[] = createInitialDisorderedList(contestantsData);

// helper function to determine rank in target order
const getTargetRank = (uid: string | undefined): number => {
  if (!uid) return Infinity;
  const index = targetOrder.findIndex(c => c.uid === uid);
  return index === -1 ? Infinity : index;
};

describe('SorterUtils', () => {

  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('should initialize correctly for a list with multiple items (38 items)', () => {
    const n = initialDisorderedList.length;
    const expectedTotalComparisons = n * (n - 1) / 2;

    const state = initSortState(initialDisorderedList);

    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.allItems).toHaveLength(n);
    expect(state.allItems.map(c => c.uid).sort()).toEqual(initialDisorderedList.map(c => c.uid).sort());

    //expect the first comparison to be set up correctly
    expect(state.comparisons).toHaveLength(1);
    expect(state.comparisons[0].choice).toBeUndefined();
    expect(state.currentIndex).toBe(0);

    expect(state.itemsToCompare.length).toBe(expectedTotalComparisons - 1);
    expect(state.estimatedTotalComparisons).toBe(expectedTotalComparisons);
    expect(state.totalComparisons).toBe(0);
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

  it('should sort a disordered list to match the target order by simulating choices', () => {
    // initialize the sorter
    let state = initSortState(initialDisorderedList);

    // check initial state is ready for the *first* comparison
    expect(state.action).toBe(ActionType.COMPARE);
    expect(state.isComplete).toBe(false);
    expect(state.comparisons).toHaveLength(1);
    expect(state.currentIndex).toBe(0);

    // simulate user choices based on the targetOrder until sorting is complete
    let safetyCounter = 0;
    const maxComparisons = state.estimatedTotalComparisons + 5;

    while (!state.isComplete && safetyCounter < maxComparisons) {
      expect(state.action).toBe(ActionType.COMPARE);
      expect(state.comparisons.length).toBeGreaterThan(0);
      // current index should point to the comparison *waiting* for a choice
      expect(state.currentIndex).toBe(state.comparisons.length - 1);

      const currentComparison = state.comparisons[state.currentIndex];
      expect(currentComparison).toBeDefined();
      expect(currentComparison.choice).toBeUndefined(); // make sure we haven't processed this one already
      expect(currentComparison.leftItem).toBeDefined();
      expect(currentComparison.rightItem).toBeDefined();

      // determine the "correct" choice
      const leftRank = getTargetRank(currentComparison.leftItem?.uid);
      const rightRank = getTargetRank(currentComparison.rightItem?.uid);
      const choice = leftRank < rightRank ? 'left' : 'right';

      // process the choice (this function now handles advancing or completing)
      state = processChoice(state, choice);

      safetyCounter++;
    }

    // verify the outcome
    expect(safetyCounter).toBeLessThan(maxComparisons); // ensure the loop didn't timeout
    expect(safetyCounter).toBe(state.estimatedTotalComparisons); // should take exactly this many comparisons now
    expect(state.isComplete).toBe(true);
    expect(state.action).toBe(ActionType.DONE);

    const finalRanking = getSortedItems(state);

    // verify the final ranking matches the target order
    expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
    expect(finalRanking).toHaveLength(targetOrder.length);
  });

  it('getSortedItems should return an empty array if sorting is not complete', () => {
    // initialize, but don't process choices
    const state = initSortState(initialDisorderedList);
    expect(state.isComplete).toBe(false);
    const result = getSortedItems(state);
    expect(result).toEqual([]);
  });

  // randomized tests
  for (let i = 0; i < 5; i++) {
    it(`should sort a randomly disordered list to match the target order - Run ${i + 1}`, () => {
      const randomizedInitialList = createInitialDisorderedList(contestantsData);
      let state = initSortState(randomizedInitialList);

      expect(state.action).toBe(ActionType.COMPARE);
      expect(state.isComplete).toBe(false);
      expect(state.comparisons).toHaveLength(1);
      expect(state.currentIndex).toBe(0);

      let safetyCounter = 0;
      const maxComparisons = state.estimatedTotalComparisons + 5;

      while (!state.isComplete && safetyCounter < maxComparisons) {
        expect(state.action).toBe(ActionType.COMPARE);
        expect(state.comparisons.length).toBeGreaterThan(0);
        expect(state.currentIndex).toBe(state.comparisons.length - 1);

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

      expect(safetyCounter).toBeLessThan(maxComparisons);
      expect(state.isComplete).toBe(true);
      expect(state.action).toBe(ActionType.DONE);

      const finalRanking = getSortedItems(state);
      expect(finalRanking.map(c => c.uid)).toEqual(targetOrder.map(c => c.uid));
      expect(finalRanking).toHaveLength(targetOrder.length);
    });
  }

});