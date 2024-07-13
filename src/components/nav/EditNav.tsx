import React, { SetStateAction } from 'react';
import { faArrowRight, faTrashAlt, faSquare, faCheckSquare, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { CountryContestant } from '../../data/CountryContestant';
import IconButton from '../IconButton';
import { AppDispatch, AppState } from '../../redux/store';
import { setIsDeleteMode, setContestants, setRankedItems, setUnrankedItems } from '../../redux/rootSlice';
import { fetchCountryContestantsByYear } from '../../utilities/ContestantRepository';
import { Dispatch } from 'redux';
import { clearAllRankingParams } from '../../utilities/UrlUtil';
import { useAppDispatch, useAppSelector } from '../../utilities/hooks';

type EditNavProps = {
    setNameModalShow: React.Dispatch<SetStateAction<boolean>>;
    setRefreshUrl: React.Dispatch<SetStateAction<number>>;
};

/**
 * This navbar is displayed on the bottom edge of the select view. It provides general 
 * list-editing options. 
 * 
 * @param param0 
 * @returns 
 */
const EditNav: React.FC<EditNavProps> = ({ setNameModalShow, setRefreshUrl }) => {
    const dispatch: AppDispatch = useAppDispatch();
    const year = useAppSelector((state: AppState) => state.year);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);
    const isDeleteMode = useAppSelector((state: AppState) => state.isDeleteMode);
    const categories = useAppSelector((state: AppState) => state.categories);

    /**
   * Clear rankedItems and fill unrankedItems with the relevant year's contestants
   */
    async function resetRanking() {
        let yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(
            year, '', dispatch
        );

        dispatch(
            setContestants(yearContestants)
        );

        dispatch(
            setUnrankedItems(yearContestants)
        );

        dispatch(
            setRankedItems([])
        );

        clearAllRankingParams(categories);
        setRefreshUrl(Math.random());
    }

    /**
     * Add all remaining unranked items to the ranked array
     */
    function addAllUnranked() {
        dispatch(
            setUnrankedItems([])
        );
        dispatch(
            setRankedItems(rankedItems.concat(unrankedItems))
        );
    
        // Append unranked items to all existing category rankings (via rx parameters)
        if (categories.length > 0) {
            const searchParams = new URLSearchParams(window.location.search);
    
            categories.forEach((_, index) => {
                const categoryParam = `r${index + 1}`;
                const currentRanking = searchParams.get(categoryParam) || '';
                const updatedRanking = `${currentRanking}${unrankedItems.map(item => item.country.id).join('')}`;
                searchParams.set(categoryParam, updatedRanking);
            });
    
            const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
            window.history.replaceState(null, '', newUrl);
        }
    
        setRefreshUrl(Math.random());
    }

    return (
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white px-3 pb-1 pt-1 sticky bottom-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <ul className="flex space-x-2">
                    <li>
                        <div className="tour-step-3 flex items-center">

                            <IconButton
                                icon={faArrowRight}
                                disabled={!unrankedItems.length}
                                onClick={addAllUnranked}
                                iconClassName='mr-[0.3em]'
                                title="Add All"
                            />

                            <IconButton
                                icon={faTrashAlt}
                                disabled={!rankedItems.length}
                                className="ml-4"
                                iconClassName='mr-[0.3em]'
                                onClick={resetRanking}
                                title="Clear"
                            />

                            <IconButton
                                icon={isDeleteMode ? faCheckSquare : faSquare}
                                disabled={!rankedItems.length}
                                className={classNames(
                                    "ml-4",
                                    rankedItems.length && isDeleteMode ? "bg-red-800 border-red-100 hover:bg-red-700" : null
                                )}
                                iconClassName='mr-[0.3em]'
                                onClick={() => {
                                    dispatch(
                                        setIsDeleteMode(!isDeleteMode)
                                    );
                                }}
                                title="Delete"
                            />

                            <IconButton
                                icon={faPenAlt}
                                className="ml-4"
                                iconClassName='mr-[0.3em]'
                                onClick={() => setNameModalShow(true)}
                                title="Name"
                            />
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default EditNav;
