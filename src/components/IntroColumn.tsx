import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseUser, faHeart, faList } from '@fortawesome/free-solid-svg-icons';

type IntroColumnProps = {
    openModal: (tabName: string) => void;
};

const IntroColumn: React.FC<IntroColumnProps> = ({ openModal }) => {
    return (
        <div className="flex justify-left items-center">
            <div className="text-gray-400 font-thin font-mono text-italic text-left ml-7 m-4 text-xs whitespace-normal max-w-[10em] mt-6">
                <ol className="list-disc mb-7">
                    <li className="mb-3">Drag countries into this column to rank</li>
                    <li className="mb-3">Rankings are saved to the URL for you to save or share with friends</li>
                    <li className="mb-2">Click 'details' above to see more info on your ranked countries</li>
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
                        className="houseUser flex items-center"
                        onClick={() => openModal('rankings')}
                    >
                        <FontAwesomeIcon
                            className="mr-2 ml-0 text-xl"
                            icon={faList}
                        />
                        <span className="ml-[0.2em] mt-[0.2em] font-bold">Rankings</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroColumn;
