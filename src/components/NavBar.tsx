import React, { Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseUser } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { setShowUnranked } from '../redux/actions';

type NavbarProps = {
    openModal: (tabName: string) => void;
};

const Navbar: React.FC<NavbarProps> = ({ openModal }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const  { showUnranked } = useSelector((state: AppState) => state);
  
    return (
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-2 px-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center z-50">
                <div className="text-lg tracking-tighter gradient-text font-bold flex items-center">
                    Eurovision Ranker
                    <img
                        src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                        alt="Heart"
                        className="w-4 h-4 ml-2" />
                </div>
                <ul className="flex space-x-2">
                    <li>
                        <div className="flex items-center">
                            
                            <button
                                className="tour-step-4 tour-step-8 bg-blue-500 hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-full text-xs mr-0 w-[5em]"
                                onClick={() => dispatch(setShowUnranked(!showUnranked))}
                            >
                                {showUnranked ? 'Details' : 'Select'}
                            </button>
                            <FontAwesomeIcon
                                className="houseUser mr-1 mb-1 ml-4 text-xl tour-step-9"
                                icon={faHouseUser}
                                onClick={() => openModal('about')}
                            />
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
