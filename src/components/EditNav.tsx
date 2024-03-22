import React, { SetStateAction } from 'react';
import { faArrowRight, faTrashAlt, faSquare, faCheckSquare, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { CountryContestant } from '../data/CountryContestant';
import IconButton from './IconButton';
import { useDispatch, useSelector } from 'react-redux';
import { AppState, SetContestantsAction } from '../redux/types';
import { SetIsDeleteMode, setContestants, setRankedItems, setUnrankedItems } from '../redux/actions';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { Dispatch } from 'redux';

type EditNavProps = {
    setNameModalShow: React.Dispatch<SetStateAction<boolean>>;
    setRefreshUrl: React.Dispatch<SetStateAction<number>>;
};

const EditNav: React.FC<EditNavProps> = ({ setNameModalShow, setRefreshUrl }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const year = useSelector((state: AppState) => state.year);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);
    const unrankedItems = useSelector((state: AppState) => state.unrankedItems);
    const isDeleteMode = useSelector((state: AppState) => state.isDeleteMode);
    const categories = useSelector((state: AppState) => state.categories);
    
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
                                        SetIsDeleteMode(!isDeleteMode)
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
