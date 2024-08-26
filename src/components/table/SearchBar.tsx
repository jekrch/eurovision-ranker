import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import TooltipHelp from '../TooltipHelp';
import { Switch } from '../Switch';
import GlobalConfirmationModal from '../modals/GlobalConfirmationModal';
import { useRefreshUrl } from '../../hooks/useRefreshUrl';
import { AppDispatch, AppState } from '../../redux/store';
import { urlHasRankings } from '../../utilities/UrlUtil';
import { useResetRanking } from '../../hooks/useResetRanking';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { getDistinctRankedYears } from '../../utilities/ContestantUtil';
import { setYear } from '../../redux/rootSlice';
import { useConvertRankParams } from '../../hooks/useConvertRankParams';

interface SearchBarProps {
    searchTerm: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    globalSearch: boolean;
    updateGlobalSearch: (checked: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    handleSearch,
    globalSearch,
    updateGlobalSearch
}) => {

    const dispatch: AppDispatch = useAppDispatch();
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const resetRanking = useResetRanking();
    const refreshUrl = useRefreshUrl();
    const convertRankParams = useConvertRankParams();
    
    const confirmAdvancedMode = (checked: boolean) => {
        if (!checked) {
            if (
                urlHasRankings(activeCategory)
            ) {

                const rankedYears = getDistinctRankedYears(rankedItems);

                if (rankedYears?.length == 1) {
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
    }

    const handleDisableGlobalConfirm = () => {
        resetRanking();
        updateGlobalSearch(false);
        convertRankParams(false);
    };

    return (
        <div className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center">
            <TooltipHelp
                content='Search across all columns. To search for a phrase, enclose your search term in quotes "like this"'
                className="mt-2 mr-3 pb-1"
            />
            <div className="relative w-full mr-3">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search..."
                    className="text-sm w-full pl-10 pr-4 py-[0.4em] border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-transparent text-slate-300 border-slate-400"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex items-center justify-center py-1 px-0">
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
            <GlobalConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={handleDisableGlobalConfirm}
                message={`Are you sure you want to turn off advanced global search mode? \n\nYour current selections will be cleared, since they contain contestants from multiple years.`}
            />
        </div>
    );
};

export default SearchBar;