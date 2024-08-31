import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../redux/store';
import { useContestantTable } from '../../hooks/useContestantTable';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { Switch } from '../Switch';
import IconButton from '../IconButton';
import { setShowUnranked } from '../../redux/rootSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import classNames from 'classnames';

const ContestantTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const tableState = useAppSelector((state: AppState) => state.tableState);
    const { sortColumn, sortDirection } = tableState;

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
        selectedContestants
    } = useContestantTable();

    return (
        <div className="flex flex-col h-full bg-transparent text-slate-300">
            <div className="flex flex-col mb-4 px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <SearchBar
                        searchTerm={searchTerm}
                        handleSearch={handleSearch}
                        globalSearch={globalSearch}
                        updateGlobalSearch={updateGlobalSearch}
                    />
                    <div className="flex items-center gap-1 mr-3 py-1 text-sm">
                        <Switch
                            label='selected'
                            className="-ml-4 text-base"
                            labelClassName='text-slate-400'
                            checked={showSelected}
                            setChecked={setShowSelected}
                        />
                        <IconButton
                            className={classNames(
                                "tada-animation ml-auto bg-[#3068ba] hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-md text-xs mr-0 w-[6em]",
                                { "tada-animation": showUnranked && rankedItems?.length }
                            )}
                            onClick={() => dispatch(setShowUnranked(!showUnranked))}
                            title={'View List'}
                        />
                    </div>
                </div>
            </div>

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
                            sortDirection={sortDirection as any} 
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