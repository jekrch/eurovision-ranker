import React, { Dispatch, useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import { CountryContestant } from '../../data/CountryContestant';
import { AppDispatch, AppState } from '../../redux/store';
import { setActiveCategory, setShowTotalRank, setYear } from '../../redux/rootSlice';
import RankedHeaderMenu from './RankedHeaderMenu';
import classNames from 'classnames';
import Ripples from 'react-ripples';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';

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
    const dispatch: AppDispatch = useAppDispatch();
    const year = useAppSelector((state: AppState) => state.year);
    const name = useAppSelector((state: AppState) => state.name);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
    const categories = useAppSelector((state: AppState) => state.categories);
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
    const [activeTab, setActiveTab] = useState(categories?.length > 0 ? 1 : 0);
    
    useEffect(() => {

        // if we're setting the tab to 0 this is the 'Total' rank
        if (activeTab === 0) {
            // set the state flag if it's not already set and exit
            if (!showTotalRank && categories?.length) {
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
                        {!globalSearch ? year : null}
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
                <div key={`total-tab-container`} className="flex bg-gray-800 bg-opacity-40 border-gray-200 mt-1 -mb-[0.2em] overflow-x-auto">
                <Ripples key="total-ripple" placeholder={<></>}>
                  <button
                    key="total-tab"
                    className={classNames(
                      "px-4 py-[0.2em] text-sm font-strong flex-shrink-0",
                      activeTab === 0 ? "text-blue-400 border-b-0 border-blue-400" : "text-gray-400 hover:text-blue-500"
                    )}
                    onClick={() => setActiveTab(0)}
                  >
                    Total
                  </button>
                </Ripples>
                {categories.map((category, index) => (
                  <Ripples key={`ripple-${index + 1}`} placeholder={<></>}>
                    <button
                      key={`cat-btn-${index + 1}`}
                      className={classNames(
                        "px-4 py-[0.2em] text-sm font-medium flex-shrink-0",
                        activeTab === index + 1 ? "text-blue-400 border-b-0 border-blue-400" : "text-gray-500 hover:text-blue-500"
                      )}
                      onClick={() => setActiveTab(index + 1)}
                    >
                      {category.name}
                    </button>
                  </Ripples>
                ))}
              </div>
            )}
        </div>
    );
};

export default RankedItemsHeader;