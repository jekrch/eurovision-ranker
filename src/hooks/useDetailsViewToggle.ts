import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { useModalController } from '../components/modals/ModalControllerContext';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import { setShowUnranked } from '../redux/rootSlice';
import { AppState } from '../redux/store';

/**
 * Switches between the select view and the details view.
 *
 * Opening the details view with an empty ranking would leave the user on a bare
 * column with no explanation, so that case prompts instead of switching: the
 * caller gets the empty-ranking modal, which asks for some countries and offers
 * the tour. Leaving the details view is never blocked.
 */
export function useDetailsViewToggle(): () => void {
  const dispatch = useAppDispatch();
  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const { openModal } = useModalController();

  return useCallback(() => {
    const openingDetails = showUnranked;

    if (openingDetails && !rankedItems.length) {
      openModal('emptyRanking');
      return;
    }

    dispatch(setShowUnranked(!showUnranked));
  }, [dispatch, openModal, rankedItems.length, showUnranked]);
}
