import React, { SetStateAction } from 'react';
import { faArrowRight, faTrashAlt, faSquare, faCheckSquare, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import IconButton from '../IconButton';
import { AppDispatch, AppState } from '../../redux/store';
import { addAllPaginatedContestants, setIsDeleteMode } from '../../redux/rootSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/stateHooks';
import { useResetRanking } from '../../hooks/useResetRanking';
import { useRefreshUrl } from '../../hooks/useRefreshUrl';


type EditNavProps = {
    setNameModalShow: React.Dispatch<SetStateAction<boolean>>;
};

/**
 * This navbar is displayed on the bottom edge of the select view. It provides general 
 * list-editing options. 
 * 
 * @param param0 
 * @returns 
 */
const EditNav: React.FC<EditNavProps> = ({ setNameModalShow }) => {
    const dispatch: AppDispatch = useAppDispatch();
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const selectedContestants = useAppSelector((state: AppState) => state.tableState.selectedContestants);
    const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);
    const isDeleteMode = useAppSelector((state: AppState) => state.isDeleteMode);
    const paginatedContestants = useAppSelector((state: AppState) => state.tableState.paginatedContestants);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const resetRanking = useResetRanking();
    const { handleAddAllUnranked } = useRefreshUrl();

    function addAll() {
        if (globalSearch) {
            addPaginatedContestants();
        } else {
            handleAddAllUnranked();
        }
    }

    /**
     * If we're using the global search mode, add all contestants on the current 
     * page
     */
    function addPaginatedContestants(){
        dispatch(
            addAllPaginatedContestants()
        );
    }
    
    /**
     * Determines whether the Add All button should be enabled, which has 
     * different requirements depending on whether we're in global search 
     * mode or not. 
     * 
     * @returns 
     */
    function canAddAll() {
        if (globalSearch) {            
            return paginatedContestants?.length > 0;
        } else {
            return unrankedItems?.length > 0;
        }
    }

    return (
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white px-3 pb-1 pt-1 sticky bottom-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <ul className="flex space-x-2">
                    <li>
                        <div className="tour-step-3 flex items-center">
                            <IconButton
                                icon={faArrowRight}
                                disabled={!canAddAll()}
                                onClick={addAll}
                                iconClassName='mr-[0.3em]'
                                title="Add All"
                            />
                            <IconButton
                                icon={faTrashAlt}
                                disabled={!rankedItems.length && !selectedContestants?.length}
                                className="ml-4"
                                iconClassName='mr-[0.3em]'
                                onClick={resetRanking}
                                title="Clear"
                            />

                            {!globalSearch &&
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
                            }

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
