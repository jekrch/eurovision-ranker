import React, { Dispatch, SetStateAction } from 'react';
import { faArrowRight, faTrashAlt, faSquare, faCheckSquare, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { CountryContestant } from '../data/CountryContestant';
import IconButton from './IconButton';

type EditNavProps = {
    unrankedItems: CountryContestant[]; 
    rankedItems: CountryContestant[];
    addAllUnranked: () => void;
    resetRanking: () => void;
    setDeleteMode: Dispatch<SetStateAction<boolean>>;
    deleteMode: boolean;
    setNameModalShow: Dispatch<SetStateAction<boolean>>;
};

const EditNav: React.FC<EditNavProps> = ({ unrankedItems, rankedItems, addAllUnranked, resetRanking, setDeleteMode, deleteMode, setNameModalShow }) => {
    return (
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-3 sticky bottom-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <ul className="flex space-x-2">
                    <li>
                        <div className="flex items-center">

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
                                icon={deleteMode ? faCheckSquare : faSquare}
                                disabled={!rankedItems.length}
                                className={classNames(
                                    "ml-4",
                                    rankedItems.length && deleteMode ? "bg-red-800 border-red-100 hover:bg-red-700" : null
                                )}
                                onClick={() => setDeleteMode(!deleteMode)}
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
