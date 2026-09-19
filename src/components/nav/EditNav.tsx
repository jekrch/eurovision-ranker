import {
  faArrowRight,
  faTrashAlt,
  faSquare,
  faCheckSquare,
  faPenAlt,
} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import React, { SetStateAction } from 'react';

import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { BulkMove } from '../../hooks/useBulkMove';
import { RankedExit } from '../../hooks/useRankedExit';
import { useRefreshUrl } from '../../hooks/useRefreshUrl';
import { useRefillUnranked, useResetRanking } from '../../hooks/useResetRanking';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { addAllPaginatedContestants, setIsDeleteMode } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import IconButton from '../IconButton';

type EditNavProps = {
  setNameModalShow: React.Dispatch<SetStateAction<boolean>>;
  /** animates the ranked list out before running the reset */
  clearRanked: RankedExit['clearRanked'];
  isClearing: boolean;
  /** animates the selection column's rows across for Add All, and back for Clear */
  bulkMove: BulkMove;
};

/**
 * This navbar is displayed on the bottom edge of the select view. It provides general
 * list-editing options.
 *
 * @param param0
 * @returns
 */
const EditNav: React.FC<EditNavProps> = ({
  setNameModalShow,
  clearRanked,
  isClearing,
  bulkMove,
}) => {
  const dispatch: AppDispatch = useAppDispatch();
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const selectedContestants = useAppSelector(
    (state: AppState) => state.table.tableState.selectedContestants,
  );
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const isDeleteMode = useAppSelector((state: AppState) => state.root.isDeleteMode);
  const paginatedContestants = useAppSelector(
    (state: AppState) => state.table.tableState.paginatedContestants,
  );
  const globalSearch = useAppSelector((state: AppState) => state.root.globalSearch);
  const resetRanking = useResetRanking();
  const refillUnranked = useRefillUnranked();
  const { rankAllUnranked, removeFromUnranked } = useRefreshUrl();

  /**
   * Add every unranked country. On the select view the selection column's rows
   * animate across first; the global search table has no column to animate, so
   * it adds at once.
   */
  function addAll() {
    if (globalSearch) {
      addPaginatedContestants();
    } else {
      bulkMove.addAll(unrankedItems.length, rankAllUnranked, removeFromUnranked);
    }
  }

  /**
   * Reset the ranking. The ranked column animates its rows out first; the
   * global search table has no rows of its own to animate, so it resets at once.
   */
  function clear() {
    if (globalSearch) {
      clearRanked([], resetRanking);
      return;
    }
    clearRanked(rankedItems, resetRanking, () => {
      bulkMove.markMoved();
      return refillUnranked();
    });
  }

  /**
   * If we're using the global search mode, add all contestants on the current
   * page
   */
  function addPaginatedContestants() {
    dispatch(addAllPaginatedContestants());
  }

  /**
   * Determines whether the Add All button should be enabled, which has
   * different requirements depending on whether we're in global search
   * mode or not.
   *
   * @returns
   */
  function canAddAll() {
    if (globalSearch) {
      return paginatedContestants?.length > 0;
    } else {
      return unrankedItems?.length > 0;
    }
  }

  return (
    <nav className="edit-nav-bg bg-gray-800x text-white px-3 pt-1 sticky bottom-0 z-50 pb-2">
      <div className="container lg:max-w-[40rem] mx-auto flex justify-between items-center">
        <ul className="flex space-x-2">
          <li>
            <div className="tour-step-3 flex items-center">
              <IconButton
                icon={faArrowRight}
                disabled={bulkMove.isAddingAll || isClearing || !canAddAll()}
                onClick={addAll}
                iconClassName="mr-[0.3em]"
                title="Add All"
              />
              <IconButton
                icon={faTrashAlt}
                disabled={
                  bulkMove.isAddingAll ||
                  isClearing ||
                  (!rankedItems.length && !selectedContestants?.length)
                }
                className="ml-4"
                iconClassName="mr-[0.3em]"
                onClick={clear}
                title="Clear"
              />

              {!globalSearch && (
                <IconButton
                  icon={isDeleteMode ? faCheckSquare : faSquare}
                  disabled={!rankedItems.length}
                  className={classNames(
                    'ml-4',
                    rankedItems.length && isDeleteMode
                      ? 'bg-red-800 border-red-100 hover:bg-red-700'
                      : null,
                  )}
                  iconClassName="mr-[0.3em]"
                  onClick={() => {
                    dispatch(setIsDeleteMode(!isDeleteMode));
                  }}
                  title="Delete"
                />
              )}

              <IconButton
                icon={faPenAlt}
                className="ml-4"
                iconClassName="mr-[0.3em]"
                onClick={() => setNameModalShow(true)}
                title="Name"
              />
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default EditNav;
