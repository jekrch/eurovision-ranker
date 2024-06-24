import React, { useEffect, useState } from 'react';
import { faHeart, faHouseUser } from '@fortawesome/free-solid-svg-icons';
import TabButton from '../TabButton';
import Modal from './Modal';

type MainModalProps = {
    isOpen: boolean; 
    tab: string;
    onClose: () => void;
    startTour: () => void;
};

const MainModal: React.FC<MainModalProps> = (props: MainModalProps) => {
    const [activeTab, setActiveTab] = useState(props.tab);

    useEffect(() => {
        setActiveTab(props.tab);
    }, [props.tab, props.isOpen]);

    function startTour() {
        props.onClose();
        props.startTour();
    }

    //if (!props.isOpen) return null;

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} className="">
            <div className="border-b border-gray-200 dark:border-gray-700 -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                    <TabButton
                        isActive={activeTab === 'about'}
                        onClick={() => setActiveTab('about')}
                        icon={faHouseUser}
                        label="About"
                    />
                    <TabButton
                        isActive={activeTab === 'donate'}
                        onClick={() => setActiveTab('donate')}
                        icon={faHeart}
                        label="Donate"
                    />
                </ul>
            </div>

            <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">
                {activeTab === 'about' &&
                    <div className="">
                        <p>Thanks for using my app! Confused? Try taking the <span onClick={startTour} className="text-link">tour</span>. </p>
                        <p className="mt-4">This is an <a className="text-link" href="https://github.com/jekrch/eurovision-ranker">open-source project</a> that I'm doing in my spare time. If you have any feedback, suggestions, or want to report a bug, you can do so at my <a href="https://github.com/jekrch/eurovision-ranker/issues" className="text-link">github repository</a> or send me an email at <a href="mailto:eurovision.ranker@gmail.com" className="text-link">eurovision.ranker@gmail.com</a>. </p>
                        <p className="mt-4">I am indebted to <a className="text-link" href="https://eurovisionworld.com/">Eurovisionworld</a> for providing and maintaining detailed historical information on the contest. Their site is an incredible resource for Eurovision fans, and I highly recommend it to anyone looking for ESC-focused news, polls, articles and more: <a className="text-link" href="https://eurovisionworld.com/">eurovisionworld.com</a>.</p>
                        <p className="mt-4">Thanks also to Janne Spijkervet, John Ashley Burgoyne, and David John Baker, who have compiled a massive dataset from <a className="text-link" href="https://eurovisionworld.com/">Eurovisionworld's</a> site, which I have used in this project. Their work is available on <a className="text-link" href="https://github.com/Spijkervet/eurovision-dataset">github</a>.</p>
                        <p className="mt-4">If you're enjoying the app, please consider clicking the donate link above and making a small donation to a nonprofit youth development org in my hometown.</p>

                    </div>}

                {activeTab === 'donate' &&
                    <div className="mb-0">
                        <div className="float-left w-1/2 mr-5 mt-2">

                            <div className="aspect-ratio-box mb-5">
                                <img
                                    src={`/mnay.png`}
                                    alt="Heart"
                                    className="w-full shadow-lg rounded mb-5" />
                            </div>
                            <button
                                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-normal py-1 px-3 rounded-full text-md mb-1"
                                onClick={() => window.open('https://www.givemn.org/story/Jddsdf', '_blank')}
                            >
                                {'Donate'}
                            </button>
                        </div>
                        <div className="item-body">
                            <div>
                                <p>OK, full disclosure, I'm not from a participating nation. I live in the US: Minneapolis, MN. But I love much of Eurovision's values and spirit (and maybe a little of its drama too).</p>
                                <p className="mt-3">Minnesota Alliance With Youth is a youth development organization that empowers young people who need support in my community. If you enjoy this app and want to say thanks (and maybe motivate me to continue adding neat features in the future) please consider donating to the Alliance.</p>
                            </div>
                        </div>
                    </div>}

            </div>
            <div className="flex text-xs w-full -mb-2 mt-2 text-slate-500">
                <span className="flex-grow mr-2">
                    <a className="text-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://github.com/jekrch/eurovision-ranker/releases"
                    >v3.6</a>
                </span>
                <span className="text-right">
                    {`Copyright (c) 2023${new Date().getFullYear()?.toString() !== '2023' ? '-' + new Date().getFullYear() : ''} `}
                    <a
                        className="text-link"
                        href="https://github.com/jekrch"
                        target="_blank"
                        rel="noopener noreferrer"
                    > Jacob Krch
                    </a>. 
                    {/* <span className="whitespace-nowrap">All rights reserved</span> */}
                </span>
            </div>
        </Modal>
    );
};

export default MainModal;
