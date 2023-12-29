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
    const { year, rankedItems, unrankedItems, isDeleteMode } = useSelector((state: AppState) => state);

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
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-3 sticky bottom-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <ul className="flex space-x-2">
                    <li>
                        <div className="tour-step-3 flex items-center">

                            <IconButton
                                icon={faArrowRight}
                                disabled={!unrankedItems.length}
                                onClick={addAllUnranked}
                                title="Add All"
                            />

                            <IconButton
                                icon={faTrashAlt}
                                disabled={!rankedItems.length}
                                className="ml-4"
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