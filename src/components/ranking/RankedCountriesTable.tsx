import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { AppState } from '../../redux/store';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import { useAppSelector } from '../../hooks/stateHooks';
import ContestantTable from '../table/ContestantTable';

/**
 * The list of ranked country contestants that appears on the right side column 
 * of the select view and as the central column on the details/list view 
 * 
 * @param  
 * @returns 
 */
const RankedCountriesTable: React.FC = () => {
    const [refreshUrl, setRefreshUrl] = useState(0);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const categories = useAppSelector((state: AppState) => state.categories);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

    useEffect(() => {
        if (refreshUrl === 0) return;
        updateUrlFromRankedItems(
            activeCategory, categories, rankedItems
        );
    }, [refreshUrl]);

    return (
        <div className="z-20">
            <div
                className={classNames(
                    "grid h-full max-h-full min-h-full grid-rows-[auto_1fr]"
                )}
            >
                <div className="overflow-y-auto h-full">
                    <ContestantTable />
                </div>
            </div>
        </div>
    );
};

export default RankedCountriesTable;
