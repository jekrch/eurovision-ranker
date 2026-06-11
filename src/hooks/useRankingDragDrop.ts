import { DropResult } from '@hello-pangea/dnd';
import { useCallback } from 'react';

import { CountryContestant } from '../data/CountryContestant';
import { deleteRankedCountry } from '../redux/rankingActions';
import { setRankedItems, setUnrankedItems } from '../redux/rootSlice';
import { AppDispatch } from '../redux/store';
import { Category } from '../utilities/CategoryUtil';
import { logger } from '../utilities/logger';
import { updateQueryParams } from '../utilities/UrlUtil';

interface RankingDragDropArgs {
  rankedItems: CountryContestant[];
  unrankedItems: CountryContestant[];
  globalSearch: boolean;
  categories: Category[];
  dispatch: AppDispatch;
  setRefreshUrl: (n: number) => void;
}

/**
 * Drag-and-drop and add-to-ranked handlers extracted from App. Owns moving
 * items within/between the ranked and unranked lists and keeping every category
 * ranking in the URL in sync.
 */
export function useRankingDragDrop({
  rankedItems,
  unrankedItems,
  globalSearch,
  categories,
  dispatch,
  setRefreshUrl,
}: RankingDragDropArgs) {
  const addNewItemToAllCategoryRankings = useCallback(
    (newContestantId: string) => {
      categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        const currentRanking = new URLSearchParams(window.location.search).get(categoryParam) || '';
        const updatedRanking = `${currentRanking}${newContestantId}`;
        updateQueryParams({ [categoryParam]: updatedRanking });
      });
    },
    [categories],
  );

  /**
   * Handler for the drop event. Either reposition an item within
   * its source array or move it to the other array
   */
  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;

      if (!destination) return;

      let activeList, setActiveList, otherList, setOtherList;

      const isDeleteFromRanking =
        source.droppableId === 'rankedItems' && destination.droppableId === 'unrankedItems';

      if (source.droppableId === 'unrankedItems') {
        activeList = unrankedItems;
        setActiveList = setUnrankedItems;
        otherList = rankedItems;
        setOtherList = setRankedItems;
      } else {
        activeList = rankedItems;
        setActiveList = setRankedItems;
        otherList = unrankedItems;
        setOtherList = setUnrankedItems;
      }

      const items = Array.from(activeList);
      const [reorderedItem] = items.splice(source.index, 1);

      // moving between lists
      if (destination.droppableId !== source.droppableId) {
        const destinationItems = Array.from(otherList);

        destinationItems.splice(destination.index, 0, reorderedItem);

        if (isDeleteFromRanking) {
          // this is here especially to ensure that we delete from all category rankings,
          // and not just the currently selected one
          dispatch(deleteRankedCountry(reorderedItem.id));
          setRefreshUrl(Math.random());
        } else {
          // Update the URL parameters for all categories
          // (this adds the new item to all category rankings)
          const id = globalSearch ? reorderedItem.uid : reorderedItem.country.id;
          if (id) {
            addNewItemToAllCategoryRankings(id);
          } else {
            logger.error('Contestant lacks valid ID:');
            logger.error(reorderedItem);
          }
        }

        dispatch(setOtherList(destinationItems));
      } else {
        items.splice(destination.index, 0, reorderedItem);
        dispatch(setActiveList(items));
      }

      dispatch(setActiveList(items));
      setRefreshUrl(Math.random());
    },
    [unrankedItems, rankedItems, globalSearch, dispatch, addNewItemToAllCategoryRankings, setRefreshUrl],
  );

  const handleAddToRanked = useCallback(
    (item: CountryContestant) => {
      const sourceIndex = unrankedItems.findIndex((i) => i.id === item.id);
      if (sourceIndex === -1) return;

      const newUnranked = Array.from(unrankedItems);
      newUnranked.splice(sourceIndex, 1);

      const newRanked = [...rankedItems, item];

      const id = globalSearch ? item.uid : item.country.id;
      if (id) {
        addNewItemToAllCategoryRankings(id);
      }

      dispatch(setRankedItems(newRanked));
      dispatch(setUnrankedItems(newUnranked));
      setRefreshUrl(Math.random());
    },
    [unrankedItems, rankedItems, globalSearch, dispatch, addNewItemToAllCategoryRankings, setRefreshUrl],
  );

  return { handleOnDragEnd, handleAddToRanked };
}
