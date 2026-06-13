import { DropResult } from '@hello-pangea/dnd';
import { useCallback } from 'react';

import { CountryContestant } from '../data/CountryContestant';
import { deleteRankedCountry } from '../redux/rankingActions';
import {
  setRankedItems,
  setUnrankedItems,
  addCountryToOtherCategories,
} from '../redux/rootSlice';
import { AppDispatch } from '../redux/store';
import { logger } from '../utilities/logger';

interface RankingDragDropArgs {
  rankedItems: CountryContestant[];
  unrankedItems: CountryContestant[];
  globalSearch: boolean;
  dispatch: AppDispatch;
  setRefreshUrl: (n: number) => void;
}

/**
 * Drag-and-drop and add-to-ranked handlers extracted from App. Owns moving
 * items within/between the ranked and unranked lists; the store is updated for
 * every category and the single URL writer projects the result.
 */
export function useRankingDragDrop({
  rankedItems,
  unrankedItems,
  globalSearch,
  dispatch,
  setRefreshUrl,
}: RankingDragDropArgs) {
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
          const id = globalSearch ? reorderedItem.uid : reorderedItem.country.id;
          if (id) {
            // mirror the add into the inactive category store slots; the active
            // slot receives it positionally via setOtherList below
            dispatch(addCountryToOtherCategories(reorderedItem));
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
    [unrankedItems, rankedItems, globalSearch, dispatch, setRefreshUrl],
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
        dispatch(addCountryToOtherCategories(item));
      }

      dispatch(setRankedItems(newRanked));
      dispatch(setUnrankedItems(newUnranked));
      setRefreshUrl(Math.random());
    },
    [unrankedItems, rankedItems, globalSearch, dispatch, setRefreshUrl],
  );

  return { handleOnDragEnd, handleAddToRanked };
}
