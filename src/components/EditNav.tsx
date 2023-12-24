import React, { Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faTrashAlt, faSquare, faCheckSquare, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { CountryContestant } from '../data/CountryContestant';

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
                            <button
                                disabled={!unrankedItems.length}
                                className={classNames(
                                    "text-white font-normal py-1 px-3 rounded-full text-xs",
                                    unrankedItems.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500"
                                )}
                                onClick={addAllUnranked}
                            >
                                <FontAwesomeIcon
                                    className="mr-2 text-xs"
                                    icon={faArrowRight}
                                />
                                Add All
                            </button>

                            <button
                                disabled={!rankedItems.length}
                                className={classNames(
                                    "ml-4 text-white font-normal py-1 px-3 rounded-full text-xs",
                                    rankedItems.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500"
                                )}
                                onClick={resetRanking}
                            >
                                <FontAwesomeIcon
                                    className="mr-1 text-xs"
                                    icon={faTrashAlt}
                                />
                                Clear
                            </button>

                            <button
                                disabled={!rankedItems.length}
                                className={classNames(
                                    "ml-4 text-white font-normal py-1 px-3 rounded-full text-xs",
                                    rankedItems.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500",
                                    rankedItems.length && deleteMode ? "bg-red-800 border-red-100 hover:bg-red-700" : null
                                )}
                                onClick={() => setDeleteMode(!deleteMode)}
                            >
                                <FontAwesomeIcon
                                    className="mr-1 text-xs"
                                    icon={deleteMode ? faCheckSquare : faSquare}
                                />
                                Delete
                            </button>

                            <button
                                className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-normal py-1 px-3 rounded-full text-xs"
                                onClick={() => setNameModalShow(true)}
                            >
                                <FontAwesomeIcon
                                    className="mr-2 text-xs"
                                    icon={faPenAlt}
                                />
                                Name
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default EditNav;
