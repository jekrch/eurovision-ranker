import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseUser, faHeart, faList, faGlasses } from '@fortawesome/free-solid-svg-icons';

type IntroColumnProps = {
    openModal: (tabName: string) => void;
    openConfigModal: (tabName: string) => void;
    setRunTour:  (runTour: boolean) => void;
};

const IntroColumn: React.FC<IntroColumnProps> = ({ openModal, openConfigModal, setRunTour }) => {
    return (
        <div className="flex justify-left items-center ">
            <div className="text-gray-400 font-normal tracking-tight font-sans text-italic text-left ml-7 m-4 text-xs whitespace-normal max-w-[10em] mt-6">
                <ol className="list-disc mb-7">
                    <li className="mb-3">Drag countries into this column to rank</li>
                    <li className="mb-3">Click 'Details' above to see more info on your ranked countries</li>
                    <li className="mb-2">Rankings are saved to the URL for you to save or share with friends</li>
                </ol>

                <div className="">
                    <div
                        className="flex items-center houseUser mb-7"
                        onClick={() => openModal('about')}
                    >
                        <FontAwesomeIcon
                            className="mr-2 ml-0 text-xl"
                            icon={faHouseUser}
                        />
                        <span className="ml-[0.2em] mt-[0.2em] font-bold">About</span>
                    </div>

                    <div
                        className="houseUser flex items-center mb-7"
                        onClick={() => openModal('donate')}
                    >
                        <FontAwesomeIcon
                            className="mr-2 ml-0 text-xl"
                            icon={faHeart}
                        />
                        <span className="ml-[0.2em] mt-[0.2em] font-bold">Donate</span>
                    </div>

                    <div
                        className="houseUser flex items-center mb-7"
                        onClick={() => openConfigModal('rankings')}
                    >
                        <FontAwesomeIcon
                            className="mr-2 ml-0 text-xl"
                            icon={faList}
                        />
                        <span className="ml-[0.2em] mt-[0.2em] font-bold">Rankings</span>
                    </div>

                    <div
                        className="houseUser flex items-center mb-2"
                        onClick={() => setRunTour(true)}
                    >
                        <FontAwesomeIcon
                            className="mr-2 ml-0 text-xl"
                            icon={faGlasses}
                        />
                        <span className="ml-[0.2em] mt-[0.2em] font-bold">Tour</span>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default IntroColumn;
