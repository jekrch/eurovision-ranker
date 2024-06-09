import React, { useEffect, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from './StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from '../../data/CountryContestant';
import { Card } from './Card';
import { DetailsCard } from './DetailsCard';
import RankedItemsHeader from './RankedItemsHeader';
import IntroColumn from './IntroColumn';
import { FaChevronRight } from 'react-icons/fa';
import IconButton from '../IconButton';
import { useDispatch, useSelector } from 'react-redux';
import { setRankedItems, setShowUnranked, setUnrankedItems } from '../../redux/actions';
import { Dispatch } from 'redux';
import { AppState } from '../../redux/types';
import { supportedYears } from '../../data/Contestants';
import { generateYoutubePlaylistUrl } from '../../utilities/YoutubeUtil';
import { removeCountryFromUrlCategoryRankings } from '../../utilities/CategoryUtil';
import { updateUrlFromRankedItems } from '../../utilities/UrlUtil';

interface RankedCountriesListProps {
    openSongModal: (countryContestant: CountryContestant) => void;
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
const RankedCountriesList: React.FC<RankedCountriesListProps> = ({
    openSongModal,
    openModal,
    openConfigModal,
    setRunTour,
    openNameModal,
    openMapModal
}) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [refreshUrl, setRefreshUrl] = useState(0);
    const showUnranked = useSelector((state: AppState) => state.showUnranked);
    const theme = useSelector((state: AppState) => state.theme);
    const showTotalRank = useSelector((state: AppState) => state.showTotalRank);
    const isDeleteMode = useSelector((state: AppState) => state.isDeleteMode);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);
    const unrankedItems = useSelector((state: AppState) => state.unrankedItems);
    const categories = useSelector((state: AppState) => state.categories);
    const activeCategory = useSelector((state: AppState) => state.activeCategory);

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
    function deleteRankedCountry(id: string) {
        const index = rankedItems.findIndex(i => i.id === id);
        const [objectToMove] = rankedItems.splice(index, 1);
        const insertionIndex = unrankedItems.findIndex(
            i => i.country.name > objectToMove.country.name
        );

        let newUnrankedItems;
        if (insertionIndex === -1) {
            // If no country is found with a name greater than our object, append it at the end.
            newUnrankedItems = [...unrankedItems, objectToMove];
        } else {
            // Insert at the found index
            newUnrankedItems = [
                ...unrankedItems.slice(0, insertionIndex),
                objectToMove,
                ...unrankedItems.slice(insertionIndex)
            ];
        }

        dispatch(
            setRankedItems([...rankedItems])
        );

        dispatch(
            setUnrankedItems(newUnrankedItems)
        );

        // Remove the country from each category ranking in the URL parameters
        removeCountryFromUrlCategoryRankings(categories, id);

        setRefreshUrl(Math.random());
    }

    return (
        <div className="tour-step-5 z-20">
            <StrictModeDroppable droppableId="rankedItems">
                {(provided) => (
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
                                    "overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54] ranked-items-background w-full h-full",
                                    showUnranked
                                        ? "min-w-[9em] max-w-50vw-6em"
                                        : "w-[80vw] max-w-[30em] min-w-[20em]",
                                    { "auroral-background": theme.includes("ab") }
                                )}
                            >
                                {rankedItems.length === 0 && showUnranked && (
                                    <IntroColumn
                                        openModal={openModal}
                                        openConfigModal={openConfigModal}
                                        setRunTour={setRunTour}
                                    />
                                )}
                                {!showUnranked && rankedItems.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-center mb-40 min-mt-5 text-slate-500 mx-10 text-sm">
                                            <div>Click 'Select' to choose</div> countries to rank
                                            <div>
                                                <img
                                                    src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                                                    alt="Heart"
                                                    style={{ display: 'inline', verticalAlign: 'middle' }}
                                                    className="ml-[0.5em] mt-3 w-5 h-5 opacity-70 grayscale"
                                                />
                                            </div>
                                        </span>
                                    </div>
                                )}
                                {rankedItems.map((item, index) => (
                                    <Draggable
                                        key={`draggable-${item.id.toString()}`}
                                        draggableId={item.id.toString()}
                                        index={index}
                                        isDragDisabled={showTotalRank}
                                    >
                                        {(provided, snapshot) => (
                                            <li
                                                key={`li-${item.id.toString()}`}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={classNames("no-select m-2", {
                                                    "mt-0": index === 0,
                                                })}
                                            >
                                                {showUnranked ? (
                                                    <Card
                                                        key={`card-${item.id.toString()}`}
                                                        className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                                        rank={index + 1}
                                                        countryContestant={item}
                                                        isDeleteMode={showUnranked && isDeleteMode}
                                                        deleteCallBack={deleteRankedCountry}
                                                        isDragging={snapshot.isDragging}
                                                    />
                                                ) : (
                                                    <DetailsCard
                                                        key={`card-${item.id.toString()}`}
                                                        className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                                        rank={index + 1}
                                                        countryContestant={item}
                                                        openSongModal={() => openSongModal(item)}
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
                                        "tour-step-4 ml-auto bg-blue-600 hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-md text-xs mr-0 w-[6em]",
                                        { "tada-animation": showUnranked && rankedItems?.length }
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
