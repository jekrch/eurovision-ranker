import React, { Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHouseUser } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { setShowUnranked } from '../redux/actions';
import IconButton from './IconButton';
import classNames from 'classnames';

type NavbarProps = {
    openModal: (tabName: string) => void;
    openConfigModal: (tabName: string) => void;
};

const Navbar: React.FC<NavbarProps> = ({ openModal, openConfigModal }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const showUnranked = useSelector((state: AppState) => state.showUnranked);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);

    return (
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white py-1 px-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center z-50">
                <div className="flex items-center flex-wrap">
                    <div className="items-center -my-1">
                        <span className="inline gradient-text product-name">
                            Eurovision Ranker
                        </span>
                        <img
                            src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                            alt="Heart"
                            style={{ display: 'inline', verticalAlign: 'middle' }}
                            className="ml-[0.2em] mb-1 w-5 h-5 pulse-on-load" />
                    </div>

                </div>

                <ul className="flex space-x-2">
                    <li>
                        <div className="flex items-center">

                            <IconButton
                                className={
                                    classNames(
                                        "tour-step-9 bg-blue-600 hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-full text-xs mr-0 w-[5em]",
                                        //{"tada-animation" : showUnranked && rankedItems?.length}
                                    )
                                }
                                onClick={() => dispatch(setShowUnranked(!showUnranked))}
                                title={showUnranked ? 'Details' : 'Select'}
                            />
                            <FontAwesomeIcon
                                className="tour-step-10 houseUser mr-1 mb-1 ml-3 text-xl"
                                icon={faHouseUser}
                                onClick={() => openModal('about')}
                            />

                            <div className="tour-step-11">
                                <FontAwesomeIcon
                                    className="configCog ml-2 mr-1 mb-0 text-xl float-right"
                                    icon={faCog}
                                    onClick={() => openConfigModal('rankings')}
                                />
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
