import { 
  generateInitialComparisons,
  calculateRanking,
  isRedundantComparison
} from './SorterUtils';

// mock data
const mockItems = [
  { id: '1', name: 'Item 1', year: 2020 },
  { id: '2', name: 'Item 2', year: 2021 },
  { id: '3', name: 'Item 3', year: 2022 },
] as any;

// unit tests for utility functions
describe('Sorter Utility Functions', () => {
  test('generateInitialComparisons should create correct number of comparisons', () => {
    const comparisons = generateInitialComparisons(mockItems);
    expect(comparisons.length).toBe(mockItems.length - 1);
  });

  test('calculateRanking should rank items based on comparisons', () => {
    const comparisons = [
      { 
        leftItem: mockItems[0], 
        rightItem: mockItems[1], 
        choice: 'left' as const 
      },
      { 
        leftItem: mockItems[1], 
        rightItem: mockItems[2], 
        choice: 'right' as const 
      }
    ];
    
    const ranked = calculateRanking(comparisons, mockItems);
    expect(ranked[0].id).toBe('1'); // winner
    expect(ranked[1].id).toBe('3'); // middle
    expect(ranked[2].id).toBe('2'); // loser
  });

});


describe('Extended Sorter Tests with 4 Items', () => {

    const mockItemsExtended = [
      { id: '1', name: 'Item 1', year: 2020 },
      { id: '2', name: 'Item 2', year: 2021 },
      { id: '3', name: 'Item 3', year: 2022 },
      { id: '4', name: 'Item 4', year: 2023 },
    ] as any;
    
    test('generateInitialComparisons should create correct number of comparisons for 4 items', () => {
      const comparisons = generateInitialComparisons(mockItemsExtended);
      // for 4 items, we should have 3 initial comparisons
      expect(comparisons.length).toBe(3);
    });
    
    test('calculateRanking should handle more complex comparison scenarios', () => {
      // test with a more complex scenario: 1 > 2 > 3 > 4
      const comparisons = [
        { leftItem: mockItemsExtended[0], rightItem: mockItemsExtended[1], choice: 'left' as const },
        { leftItem: mockItemsExtended[1], rightItem: mockItemsExtended[2], choice: 'left' as const },
        { leftItem: mockItemsExtended[2], rightItem: mockItemsExtended[3], choice: 'left' as const },
      ];
      
      const ranked = calculateRanking(comparisons, mockItemsExtended);
      expect(ranked[0].id).toBe('1'); // winner
      expect(ranked[1].id).toBe('2'); // second
      expect(ranked[2].id).toBe('3'); // third
      expect(ranked[3].id).toBe('4'); // loser
    });
    
    test('calculateRanking should handle cyclic preferences', () => {
      // test with a "rock-paper-scissors" scenario: 1 > 2 > 3 > 1, with 4 disconnected
      const comparisons = [
        { leftItem: mockItemsExtended[0], rightItem: mockItemsExtended[1], choice: 'left' as const },
        { leftItem: mockItemsExtended[1], rightItem: mockItemsExtended[2], choice: 'left' as const },
        { leftItem: mockItemsExtended[2], rightItem: mockItemsExtended[0], choice: 'left' as const },
        { leftItem: mockItemsExtended[0], rightItem: mockItemsExtended[3], choice: 'right' as const },
      ];
      
      // The output can vary depending on how calculateRanking handles cycles,
      // but we can at least verify it returns all items
      const ranked = calculateRanking(comparisons, mockItemsExtended);
      expect(ranked.length).toBe(4);
      // Check that all items are included
      expect(ranked.map(item => item.id).sort()).toEqual(['1', '2', '3', '4']);
    });
    
    test('calculateRanking should handle incomplete comparison data', () => {
      // Test with incomplete data: only 1 vs 2, and 3 vs 4 are compared
      const comparisons = [
        { leftItem: mockItemsExtended[0], rightItem: mockItemsExtended[1], choice: 'left' as const },
        { leftItem: mockItemsExtended[2], rightItem: mockItemsExtended[3], choice: 'right' as const },
      ];
      
      const ranked = calculateRanking(comparisons, mockItemsExtended);
      expect(ranked.length).toBe(4);
      
      // We expect 1 > 2 and 4 > 3, but the relative ranking between (1,2) and (3,4) is undefined
      const idx1 = ranked.findIndex(item => item.id === '1');
      const idx2 = ranked.findIndex(item => item.id === '2');
      const idx3 = ranked.findIndex(item => item.id === '3');
      const idx4 = ranked.findIndex(item => item.id === '4');
      
      expect(idx1).toBeLessThan(idx2); // 1 ranks better than 2
      expect(idx4).toBeLessThan(idx3); // 4 ranks better than 3
    });
    
    test('isRedundantComparison should return false for non-transitive comparisons', () => {
      // Test with non-transitive comparisons: 1 > 2, 3 > 4
      const comparisons = [
        { leftItem: mockItemsExtended[0], rightItem: mockItemsExtended[1], choice: 'left' as const },
        { leftItem: mockItemsExtended[2], rightItem: mockItemsExtended[3], choice: 'left' as const },
      ];
      
      // There's no transitivity between (1,2) and (3,4), so 1 vs 3 should not be redundant
      const redundant1vs3 = isRedundantComparison(
        mockItemsExtended[0], 
        mockItemsExtended[2], 
        comparisons,
        mockItemsExtended
      );
      
      expect(redundant1vs3).toBe(false);
    });
  });