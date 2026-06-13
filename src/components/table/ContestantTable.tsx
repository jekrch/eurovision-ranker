import classNames from 'classnames';
import React, { useState } from 'react';

import Pagination from './Pagination';
import SearchBar from './SearchBar';
import TableBody from './TableBody';
import TableHeader from './TableHeader';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { useContestantTable } from '../../hooks/useContestantTable';
import { useResetRanking } from '../../hooks/useResetRanking';
import { reloadRankingsForYear } from '../../redux/rankingActions';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { setShowUnranked, setYear } from '../../redux/rootSlice';
import { AppState } from '../../redux/store';
import { getDistinctRankedYears } from '../../utilities/ContestantUtil';
import IconButton from '../IconButton';
import GlobalConfirmationModal from '../modals/GlobalConfirmationModal';
import { Switch } from '../Switch';
import TooltipHelp from '../TooltipHelp';

const ContestantTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const tableState = useAppSelector((state: AppState) => state.table.tableState);
  const { sortColumn, sortDirection } = tableState;
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const resetRanking = useResetRanking();

  const {
    paginatedContestants,
    handleSort,
    handleSearch,
    handlePageSizeChange,
    handlePageChange,
    handleToggleSelected,
    searchTerm,
    showSelected,
    setShowSelected,
    globalSearch,
    updateGlobalSearch,
    pageSize,
    currentPage,
    totalPages,
    displayedContestants,
    selectedContestants,
  } = useContestantTable();

  const switchAdvancedMode = async (checked: boolean) => {
    if (checked) {
      updateGlobalSearch(checked);
      return;
    }

    if (rankedItems.length > 0) {
      const rankedYears = getDistinctRankedYears(rankedItems);
      if (rankedYears?.length === 1) {
        // Leaving global mode for the single year the ranking spans: drop global
        // mode and re-resolve every category's ranking against that year. The
        // store carries both ids, so this needs no URL round-trip and the single
        // writer projects the (now country-id) rankings back out.
        const year = rankedYears[0];
        updateGlobalSearch(false);
        dispatch(setYear(year));
        await dispatch(reloadRankingsForYear(year));
      } else {
        setIsConfirmationOpen(true);
      }
    } else {
      resetRanking();
      updateGlobalSearch(false);
    }
  };

  const handleDisableGlobalConfirm = () => {
    resetRanking();
    updateGlobalSearch(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-[var(--er-text-secondary)]">
      <div
        className={classNames('flex flex-col mb-1 pr-1 sm:flex-row sm:items-center sm:space-x-4')}
      >
        <div className={classNames('w-full xs:w-1/2')}>
          <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} className="w-full mb-1" />
        </div>
        <div
          className={classNames(
            'flex items-center justify-between gap-3 pb-1 text-sm mt-1 sm:mt-0 sm:justify-end sm:flex-grow min-w-[50%]',
          )}
        >
          <div className="flex items-center gap-2">
            <TooltipHelp
              content="Uncheck this to use the simple year-based selection mode"
              className="text-[var(--er-text-secondary)] !mt-0 !mb-0"
            />
            <div className="flex items-center gap-3 rounded-md border border-[var(--er-border-primary)] bg-[var(--er-surface-tertiary-70)] px-3 py-[0.3em]">
              <Switch
                label="adv"
                labelClassName="text-sm text-[var(--er-text-tertiary)]"
                checked={globalSearch}
                setChecked={switchAdvancedMode}
              />
              <span className="h-4 w-px bg-[var(--er-border-subtle)]" aria-hidden="true" />
              <Switch
                label="selected"
                labelClassName="text-sm text-[var(--er-text-tertiary)]"
                checked={showSelected}
                setChecked={setShowSelected}
              />
            </div>
          </div>
          <IconButton
            className={classNames('tada-animation pl-[0.7em] pr-[0.9em] w-[6em] shrink-0', {
              'tada-animation': showUnranked && rankedItems?.length,
            })}
            onClick={() => dispatch(setShowUnranked(!showUnranked))}
            title={'View List'}
          />
        </div>
      </div>

      <GlobalConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleDisableGlobalConfirm}
        message={`Are you sure you want to turn off advanced global search mode? \n\nYour current selections will be cleared, since they contain contestants from multiple years.`}
      />

      <div className="flex-grow overflow-auto !rounded-t-md !rounded-tr-md mr-1 shadow-xl">
        <div className="relative">
          <table className="w-full bg-transparent table-fixed">
            <colgroup>
              <col className="w-[3em]" />
              <col className="w-24" />
              <col className="w-40" />
              <col className="w-48" />
              <col className="w-64" />
            </colgroup>
            <TableHeader
              handleSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection as 'asc' | 'desc'}
              showSelected={false}
            />
            <TableBody
              paginatedContestants={paginatedContestants}
              handleToggleSelected={handleToggleSelected}
              showSelected={showSelected}
              selectedContestants={selectedContestants}
            />
          </table>
        </div>
      </div>
      <Pagination
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        displayedContestants={displayedContestants}
        handlePageSizeChange={handlePageSizeChange}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default ContestantTable;
