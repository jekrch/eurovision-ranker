import React, { useCallback, useEffect, useState } from 'react';
import { StrictModeDroppable } from './StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from '../../data/CountryContestant';
import { Card } from './Card';
import { DetailsCard } from './DetailsCard';
import RankedItemsHeader from './RankedItemsHeader';
import { FaChevronRight } from 'react-icons/fa';
import IconButton from '../IconButton';
import { setShowUnranked } from '../../redux/rootSlice';
import { AppDispatch, AppState } from '../../redux/store';
import { supportedYears } from '../../data/Contestants';
import { generateYoutubePlaylistUrl } from '../../utilities/YoutubeUtil';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';
import { IntroColumnWrapper } from './IntroColumnWrapper';
import { deleteRankedCountry } from '../../redux/rankingActions';
import { Draggable } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';

interface RankedCountriesListProps {
    openSongModal: (countryContestant: CountryContestant) => void;
    openModal: (tabName: string) => void;
    openConfigModal: (tabName: string) => void;
    setRunTour: (run: boolean) => void;
    setRunSortTour: (run: boolean) => void;
    openNameModal: () => void;
    openMapModal: () => void;
    openSorterModal: () => void;
}

/**
 * The list of ranked country contestants that appears on the right side column 
 * of the select view and as the central column on the details/list view 
 * 
 * @param  
 * @returns 
 */
const RankedCountriesList: React.FC<RankedCountriesListProps> = ({
    openSongModal,
    openModal,
    openConfigModal,
    setRunTour,
    setRunSortTour,
    openNameModal,
    openMapModal,
    openSorterModal
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
        <div className="tour-step-5 z-20">
            <StrictModeDroppable droppableId="rankedItems">
                {(provided: any) => (
                    <div
                        className={classNames(
                            "grid h-full max-h-full min-h-full grid-rows-[auto_1fr]"
                        )}
                    >
                        <RankedItemsHeader
                            setMapModalShow={() => openMapModal()}
                            generateYoutubePlaylistUrl={() =>
                                generateYoutubePlaylistUrl(rankedItems)
                            }
                            supportedYears={supportedYears}
                            openNameModal={openNameModal}
                            openConfig={openConfigModal}
                            openSorterModal={openSorterModal}
                            className={
                                showUnranked
                                    ? "min-w-[9em] max-w-50vw-6em"
                                    : "w-[80vw] max-w-[30.5em] min-w-[20.5em]"
                            }
                        />

                        <div className="px-1 overflow-y-auto h-full">
                            <ul
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={classNames(
                                    "overflow-y-auto overflow-x-hidden pt-3 ranked-items-background w-full h-full",
                                    showUnranked
                                        ? "min-w-[9em] max-w-50vw-6em"
                                        : "w-[85vw] max-w-[30em] min-w-[20em]",
                                    { "auroral-background": theme.includes("ab") }
                                )}
                            >
                                {rankedItems.length === 0 && showUnranked && (
                                    <IntroColumnWrapper
                                        openModal={openModal}
                                        openConfigModal={openConfigModal}
                                        setRunTour={setRunTour}
                                        setRunSortTour={setRunSortTour}
                                    />
                                )}
                                {!showUnranked && rankedItems.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-center mb-40 min-mt-5 text-slate-500 mx-10 text-sm">
                                            <div>Click 'Select' to choose</div> countries to rank
                                            <div>
                                                <img
                                                    src={`/eurovision-heart.svg`}
                                                    alt="Heart"
                                                    style={{ display: 'inline', verticalAlign: 'middle' }}
                                                    className="ml-[0.5em] mt-3 w-5 h-5 opacity-70 grayscale"
                                                />
                                            </div>
                                        </span>
                                    </div>
                                )}
                                {rankedItems.map((countryContestant: CountryContestant, index: number) => (
                                    <Draggable
                                        key={`draggable-${countryContestant?.uid ?? countryContestant.id}`}
                                        draggableId={countryContestant?.uid ?? countryContestant.id}
                                        index={index}
                                        isDragDisabled={showTotalRank}
                                    >
                                        {(provided: any, snapshot: any) => (
                                            <li
                                                key={`li-${countryContestant?.uid ?? countryContestant.id}`}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={classNames("no-select m-2 mx-1", {
                                                    "mt-0": index === 0,
                                                })}
                                            >
                                                {showUnranked ? (
                                                    <Card
                                                        key={`card-${countryContestant?.uid ?? countryContestant.id}`}
                                                        className="m-auto text-slate-400 bg-[#03022d] no-select"
                                                        rank={index + 1}
                                                        countryContestant={countryContestant}
                                                        isDeleteMode={showUnranked && isDeleteMode}
                                                        deleteCallBack={handleDeleteRankedCountry}
                                                        isDragging={snapshot.isDragging}
                                                    />
                                                ) : (
                                                    <DetailsCard
                                                        key={`card-${countryContestant?.uid ?? countryContestant.id}`}
                                                        rank={index + 1}
                                                        countryContestant={countryContestant}
                                                        openSongModal={() => openSongModal(countryContestant)}
                                                        isDragging={snapshot.isDragging}
                                                        categoryScrollPosition={categoryScrollPosition}
                                                        onCategoryScroll={handleCategoryScroll}
                                                    />
                                                )}
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        </div>
                        {showUnranked && rankedItems?.length > 0 && (
                            <div className="pl-2 rounded-b-md h-8 bg-blue-900 ranked-bar-background text-slate-300 items-center flex shadow-md gradient-background">
                                <IconButton
                                    className={classNames(
                                        "tour-step-4 ml-auto py-1 pl-[0.7em] pr-[0.9em] mr-0 w-[6em]",
                                        { "tada-animation-6s": showUnranked && rankedItems?.length }
                                    )}
                                    onClick={() => dispatch(
                                        setShowUnranked(!showUnranked)
                                    )}
                                    title={'View List'}
                                />
                                <FaChevronRight
                                    className={classNames(
                                        "ml-2 mr-auto text-lg justify-center align-center bounce-right text-blue-300",
                                        { "tada-animation": showUnranked && rankedItems?.length }
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
            </StrictModeDroppable>
        </div>
    );
};

export default RankedCountriesList;
