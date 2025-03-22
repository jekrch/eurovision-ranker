import { useState, useCallback } from 'react';
import { CountryContestant } from '../data/CountryContestant';
import { useAppSelector } from './stateHooks';

/**
 * Custom hook for managing the sorter modal
 * Provides handlers and state for opening and closing the modal
 */
export const useSorterModal = () => {
  const [isSorterModalOpen, setIsSorterModalOpen] = useState(true);
  const rankedItems = useAppSelector((state) => state.rankedItems);
  const unrankedItems = useAppSelector((state) => state.unrankedItems);

  /**
   * Open the sorter modal
   * @param items Optional items to sort, defaults to current ranked items
   */
  const openSorterModal = useCallback((items?: CountryContestant[]) => {
    setIsSorterModalOpen(true);
  }, []);

  /**
   * Close the sorter modal
   */
  const closeSorterModal = useCallback(() => {
    setIsSorterModalOpen(false);
  }, []);

  /**
   * Returns the items to be sorted
   * - If ranked items exist, sort those
   * - Otherwise, sort unranked items
   */
  const getItemsToSort = useCallback((): CountryContestant[] => {
    if (rankedItems.length > 0) {
      return [...rankedItems];
    }
    // If there are no ranked items, sort from unranked
    // but limit to a reasonable number (e.g., 20) to avoid too many comparisons
    const itemsToSort = [...unrankedItems];
    if (itemsToSort.length > 20) {
      // Take a random subset if there are too many items
      return itemsToSort
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);
    }
    return itemsToSort;
  }, [rankedItems, unrankedItems]);

  return {
    isSorterModalOpen,
    openSorterModal,
    closeSorterModal,
    getItemsToSort,
  };
};

export default useSorterModal;