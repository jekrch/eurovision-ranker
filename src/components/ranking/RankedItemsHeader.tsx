import React, { useEffect, useState } from 'react';
import Dropdown from '../Dropdown';
import { CountryContestant } from '../../data/CountryContestant';
import { AppDispatch, AppState } from '../../redux/store';
import { setActiveCategory, setShowTotalRank, setYear } from '../../redux/rootSlice';
import RankedHeaderMenu from './RankedHeaderMenu';
import classNames from 'classnames';
import Ripples from 'react-ripples';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort } from '@fortawesome/free-solid-svg-icons';

interface IRankedItemsHeaderProps {
    setMapModalShow: () => void;
    openNameModal: () => void;
    openConfig: (tab: string) => void;
    generateYoutubePlaylistUrl: (rankedItems: CountryContestant[]) => string;
    supportedYears: string[];
    className: string;
    downloadButton?: React.ReactNode;
    openSorterModal: () => void;
}

const RankedItemsHeader: React.FC<IRankedItemsHeaderProps> = ({
    setMapModalShow,
    generateYoutubePlaylistUrl,
    openNameModal,
    openConfig,
    supportedYears,
    className,
    downloadButton,
    openSorterModal
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
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (activeTab === 0) {
            if (!showTotalRank && categories?.length) {
                dispatch(setShowTotalRank(true));
            }
            return;
        } else if (showTotalRank) {
            dispatch(setShowTotalRank(false));
        }
        dispatch(setActiveCategory(activeTab - 1));
    }, [activeTab]);

    useEffect(() => {
        setActiveTab(activeCategory !== undefined ? activeCategory + 1 : 0);
    }, [activeCategory]);

    // condition for disabling the sorter button
    const isSorterDisabled = rankedItems.length < 2 || showTotalRank;

    return (
        <div className={classNames(
            "z-40 rounded-t-md round-b-sm w-full text-center font-bold bg-blue-900 gradient-background text-slate-300 py-1 text-md tracking-tighter shadow-md ranked-bar-background",
            className
        )}
        >
            {showUnranked ? (
                <div className="w-full m-auto flex items-center justify-center">
                    <Dropdown
                        className="tour-step-1 min-w-[5em] w-auto"
                        buttonClassName='!h-[1.8em]'
                        value={year}
                        onChange={y => { dispatch(setYear(y)); }}
                        options={supportedYears}
                        showSearch={true}
                    />
                </div>
            ) : (
                // ---- main container for header content ----
                <div className="mx-2 flex justify-between items-center">

                    <div className="w-6 h-6 tour-step-10"> {/* Container to maintain layout space even if button isn't rendered, or helps with alignment */}
                        {rankedItems?.length > 0 && ( // Only show if there are items
                            <button
                                title={isSorterDisabled ? "Sorter unavailable (need >1 item and not on Total Rank tab)" : "Open Sorter"}
                                aria-label="Open Sorter"  
                                data-umami-event="Sorter Button (header)"                              
                                className={classNames(
                                    "w-6 h-6 bg-[#6e6795] rounded-full flex justify-center items-center text-slate-400 hover:text-slate-500",
                                    {
                                        "hover:bg-slate-400 hover:cursor-pointer": !isSorterDisabled,
                                        "opacity-50 cursor-not-allowed": isSorterDisabled 
                                    }
                                )}
                                onClick={openSorterModal}
                                disabled={isSorterDisabled} 
                            >
                                <FontAwesomeIcon
                                    className="" 
                                    icon={faSort}
                                />
                            </button>
                        )}
                    </div>
                   

                    {/* ---- Center Content (Title) ---- */}
                    <div className="justify-center text-center flex-grow mx-2"> {/* Use flex-grow to take available space, mx-2 for spacing */}
                        {!globalSearch ? year : null}
                        {name && (
                            <span className="font-bold text-slate-400 text-md">
                                {!globalSearch ? ` - ` : ``}{name}
                            </span>
                        )}
                    </div>
                    {/* ---- End Center Content ---- */}

                    {/* ---- Right Side Menu Button ---- */}
                    <RankedHeaderMenu
                        openNameModal={openNameModal}
                        openConfig={openConfig}
                        onMapClick={setMapModalShow}
                        openSorterModal={openSorterModal} // This is still needed for the menu item
                        generateYoutubePlaylistUrl={() => generateYoutubePlaylistUrl(rankedItems)}
                    />
                    {/* ---- End Right Side Menu Button ---- */}
                </div>
            )}

            {/* ... rest of the component (tabs) ... */}
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