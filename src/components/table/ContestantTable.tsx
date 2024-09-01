import React, { useState } from 'react';
import { AppState } from '../../redux/store';
import { useContestantTable } from '../../hooks/useContestantTable';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { Switch } from '../Switch';
import IconButton from '../IconButton';
import { setShowUnranked, setYear } from '../../redux/rootSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import classNames from 'classnames';
import GlobalConfirmationModal from '../modals/GlobalConfirmationModal';
import TooltipHelp from '../TooltipHelp';
import { useRefreshUrl } from '../../hooks/useRefreshUrl';
import { useResetRanking } from '../../hooks/useResetRanking';
import { useConvertRankParams } from '../../hooks/useConvertRankParams';
import { getDistinctRankedYears } from '../../utilities/ContestantUtil';
import { urlHasRankings } from '../../utilities/UrlUtil';

const ContestantTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const tableState = useAppSelector((state: AppState) => state.tableState);
    const { sortColumn, sortDirection } = tableState;
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
    const resetRanking = useResetRanking();
    const { refreshUrl } = useRefreshUrl();
    const convertRankParams = useConvertRankParams();
    
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

    const confirmAdvancedMode = (checked: boolean) => {
        if (!checked) {
            if (urlHasRankings(activeCategory)) {
                const rankedYears = getDistinctRankedYears(rankedItems);
                if (rankedYears?.length === 1) {
                    dispatch(setYear(rankedYears[0]));
                    updateGlobalSearch(false);
                    convertRankParams(false);
                    refreshUrl();
                } else {
                    setIsConfirmationOpen(true);
                }
            } else {
                resetRanking();
                updateGlobalSearch(false);
                convertRankParams(false);
            }
        } else {
            updateGlobalSearch(checked);
        }
    };

    const handleDisableGlobalConfirm = () => {
        resetRanking();
        updateGlobalSearch(false);
        convertRankParams(false);
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-slate-300">
            <div className="flex flex-col mb-1 pr-1">
                <div className="w-ful">
                    <SearchBar
                        searchTerm={searchTerm}
                        handleSearch={handleSearch}
                        className="w-full"
                    />
                </div>
                <div className="flex items-center justify-between py-1 text-sm mt-1">
                    <Switch
                        label='selected'
                        className=" text-base"
                        labelClassName='text-slate-400'
                        checked={showSelected}
                        setChecked={setShowSelected}
                    />
                    <div className="flex items-center gap-1 mr-3">
                        <div className="flex items-center">
                            <TooltipHelp
                                content="Uncheck this to use the simple year-based selection mode"
                                className="text-slate-300 align-middle mb-1 -mr-1"
                            />
                            <Switch
                                label="adv"
                                className="items-center align-middle"
                                labelClassName="text-base text-slate-400"
                                checked={globalSearch}
                                setChecked={confirmAdvancedMode}
                            />
                        </div>
                        <IconButton
                            className={classNames(
                                "tada-animation bg-[#3068ba] hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-md text-xs w-[6em]",
                                { "tada-animation": showUnranked && rankedItems?.length }
                            )}
                            onClick={() => dispatch(setShowUnranked(!showUnranked))}
                            title={'View List'}
                        />
                    </div>
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