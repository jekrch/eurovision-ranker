import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { CountryContestant } from '../../data/CountryContestant';
import { AppDispatch, AppState } from '../../redux/store';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { deleteRankedCountry } from '../../redux/rankingActions';
import ContestantTable from '../table/ContestantTable';

interface RankedCountriesTableProps {
    openSongModal?: (countryContestant: CountryContestant) => void;
    openModal: (tabName: string) => void;
    openConfigModal: (tabName: string) => void;
    setRunTour: (run: boolean) => void;
    openNameModal: () => void;
    openMapModal: () => void;
}

/**
 * The list of ranked country contestants that appears on the right side column 
 * of the select view and as the central column on the details/list view 
 * 
 * @param  
 * @returns 
 */
const RankedCountriesTable: React.FC<RankedCountriesTableProps> = ({
    openSongModal,
    openModal,
    openConfigModal,
    setRunTour,
    openNameModal,
    openMapModal
}) => {
    const dispatch: AppDispatch = useAppDispatch();
    const [refreshUrl, setRefreshUrl] = useState(0);
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
    const theme = useAppSelector((state: AppState) => state.theme);
    const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
    const isDeleteMode = useAppSelector((state: AppState) => state.isDeleteMode);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const categories = useAppSelector((state: AppState) => state.categories);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
      
    /**
   * used to synchronize the horizontal scrollbar on detail cards across all ranked items
   */
    const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);

    const handleCategoryScroll = (event: React.UIEvent<HTMLDivElement>) => {
        setCategoryScrollPosition(event.currentTarget.scrollLeft);
    };

    useEffect(() => {
        if (refreshUrl === 0) return;
        updateUrlFromRankedItems(
            activeCategory, categories, rankedItems
        );
    }, [refreshUrl]);

   /**
   * Identify country with the provided Id in the rankedItems array, and 
   * move them back into the unrankedItems array, alphabetically 
   * 
   * @param countryId 
   */
   const handleDeleteRankedCountry = useCallback((id: string) => {
        dispatch(deleteRankedCountry(id));
        setRefreshUrl(Math.random());
    }, [dispatch]);


    return (
        <div className="z-20">

                    <div
                        className={classNames(
                            "grid h-full max-h-full min-h-full grid-rows-[auto_1fr]"
                        )}
                    >

                        <div className="overflow-y-auto h-full">
                            <ContestantTable/>
                        </div>
    
                    </div>
 
        </div>
    );
};

export default RankedCountriesTable;
