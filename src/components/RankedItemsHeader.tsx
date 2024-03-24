import React, { Dispatch, useEffect, useState } from 'react';
import Dropdown from './Dropdown';
import { CountryContestant } from '../data/CountryContestant';
import { useDispatch } from 'react-redux';
import { AppState } from '../redux/types';
import { useSelector } from 'react-redux';
import { setActiveCategory, setRankedItems, setShowTotalRank, setYear } from '../redux/actions';
import RankedHeaderMenu from './RankedHeaderMenu';
import classNames from 'classnames';
import { reorderByAllWeightedRankings } from '../utilities/CategoryUtil';

interface IRankedItemsHeaderProps {
    setMapModalShow: () => void;
    openNameModal: () => void;
    openConfig: (tab: string) => void;
    generateYoutubePlaylistUrl: (rankedItems: CountryContestant[]) => string;
    supportedYears: string[];
    className: string;
}

const RankedItemsHeader: React.FC<IRankedItemsHeaderProps> = ({
    setMapModalShow,
    generateYoutubePlaylistUrl,
    openNameModal,
    openConfig,
    supportedYears,
    className
}) => {
    const dispatch: Dispatch<any> = useDispatch();
    const showUnranked = useSelector((state: AppState) => state.showUnranked);
    const year = useSelector((state: AppState) => state.year);
    const name = useSelector((state: AppState) => state.name);
    const activeCategory = useSelector((state: AppState) => state.activeCategory);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);
    const showTotalRank = useSelector((state: AppState) => state.showTotalRank);
    const categories = useSelector((state: AppState) => state.categories);
    const [activeTab, setActiveTab] = useState(categories?.length > 0 ? 1 : 0);
    
    useEffect(() => {

        // if we're setting the tab to 0 this is the 'Total' rank
        if (activeTab === 0) {
            // set the state flag if it's not already set and exit
            if (!showTotalRank) {
                dispatch(
                    setShowTotalRank(true)
                );
            }
            return;

        // if we're not switching to the total rank tab, make sure the state
        // flag is set to false
        } else if (showTotalRank) {
            dispatch(
                setShowTotalRank(false)
            );
        }

        dispatch(
            setActiveCategory(activeTab - 1)
        );
    }, [activeTab]);

    useEffect(() => {
        console.log(activeCategory)
        setActiveTab(activeCategory !== undefined ? activeCategory + 1 : 0);
    }, [activeCategory]);

    return (
        <div className={classNames(
            "z-40 rounded-t-md round-b-sm w-full text-center font-bold bg-blue-900 gradient-background text-slate-300 py-1 text-md tracking-tighter shadow-md ranked-bar-background",
            className
        )}
        >
            {showUnranked ? (
                <div className="w-full m-auto flex items-center justify-center">
                    <Dropdown
                        className="tour-step-1 w-[5em]"
                        buttonClassName='!h-[1.8em]'
                        value={year}
                        onChange={y => { dispatch(setYear(y)); }}
                        options={supportedYears}
                        showSearch={true}
                    />
                </div>
            ) : (
                <div className="mr-2 ml-5 flex justify-between items-center">
                    {rankedItems?.length > 0 && (
                        <></>
                    )}

                    <div className="justify-center w-full ml-2 mr-2">
                        {year}
                        {name && (
                            <span className="font-bold text-slate-400 text-md"> - {name}</span>
                        )}
                    </div>
                    <RankedHeaderMenu
                        openNameModal={openNameModal}
                        openConfig={openConfig}
                        onMapClick={setMapModalShow}
                        generateYoutubePlaylistUrl={() => { return generateYoutubePlaylistUrl(rankedItems) }}
                    />
                </div>
            )}
            {(!showUnranked && categories.length > 0) && (
                <div className="flex bg-gray-800 bg-opacity-40 border-gray-200 mt-1 -mb-[0.2em] overflow-x-auto">
                    <button
                        key="total-tab"
                        className={classNames(
                            "px-4 py-[0.2em] text-sm font-medium flex-shrink-0",
                            activeTab === 0 ? "text-blue-400 border-b-0 border-blue-400" : "text-gray-500 hover:text-blue-500"
                        )}
                        onClick={() => setActiveTab(0)}
                    >
                        Total
                    </button>
                    {categories.map((category, index) => (
                        <button
                            key={index + 1}
                            className={classNames(
                                "px-4 py-[0.2em] text-sm font-medium flex-shrink-0",
                                activeTab === index + 1 ? "text-blue-400 border-b-0 border-blue-400" : "text-gray-500 hover:text-blue-500"
                            )}
                            onClick={() => setActiveTab(index + 1)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RankedItemsHeader;