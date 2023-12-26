import classNames from 'classnames';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import Dropdown from './Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHouseUser, faList } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import TabButton from './TabButton';
import { supportedYears } from '../data/Contestants';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import ReactDOM from 'react-dom';
import { fetchCountryContestantsByYear } from '../utilities/ContestantFactory';
import { CountryContestant } from '../data/CountryContestant';

type MainModalProps = {
    isOpen: boolean;
    tab: string;
    onClose: () => void;
};

const MainModal: React.FC<MainModalProps> = (props: MainModalProps) => {
    const dispatch: Dispatch<any> = useDispatch();
    const { year } = useSelector((state: AppState) => state);

    const [activeTab, setActiveTab] = useState(props.tab);
    const modalRef = useRef<HTMLDivElement>(null);
    const [rankingYear, setRankingYear] = useState(year);
    const currentDomain = window.location.origin; // Get the current domain
    const currentPath = window.location.pathname; // Get the current path
    const triggerButtonRef = useRef<HTMLDivElement>(null);

    function getUrl(queryString: string) {
        return `${currentDomain}${currentPath}${queryString}`;
    }

    function goToUrl(queryString: string) {
        const url = getUrl(queryString);
        window.location.href = url;
    }

    useEffect(() => {
        setActiveTab(props.tab);
    }, [props.tab, props.isOpen]);

    useEffect(() => {
        setRankingYear(year);
    }, [year]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                props.onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [modalRef, props]);

    async function openEscFinals() {
        const finalsYear = rankingYear ?? year;
        const countryContestants: CountryContestant[] = await fetchCountryContestantsByYear(finalsYear);
        const filteredContestants = countryContestants.filter(cc => cc.contestant?.finalsRank !== undefined && cc.contestant.finalsRank !== null);

        // Sort by finalsRank in ascending order
        const sortedContestants = filteredContestants.sort((a, b) => a.contestant!.finalsRank! - b.contestant!.finalsRank!);

        // generate the ranking param
        const concatenatedIds = sortedContestants.map(cc => cc.id).join('');

        console.log(concatenatedIds);
        goToUrl(`?r=${concatenatedIds}&y=${finalsYear.substring(2, 4)}&n=finals`)
    }

    if (!props.isOpen) return null;

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
                    <TabButton
                        isActive={activeTab === 'rankings'}
                        onClick={() => setActiveTab('rankings')}
                        icon={faList}
                        label="Rankings"
                    />
                </ul>
            </div>

            <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">
                {activeTab === 'about' &&
                    <div className="">
                        <p>Thanks for using my app! I'm just getting started, so expect a lot of changes here in the coming months.</p>
                        <p className="mt-4">This is an <a className="text-link" href="https://github.com/jekrch/eurovision-ranker">open-source project</a> that I'm doing in my spare time. If you have any feedback, suggestions, or want to report a bug, you can do so at my <a href="https://github.com/jekrch/eurovision-ranker/issues" className="text-link">github repository</a> or send me an email at <a href="mailto:eurovision.ranker@gmail.com" className="text-link">eurovision.ranker@gmail.com</a>. </p>
                        <p className="mt-4">I am indebted to Janne Spijkervet, John Ashley Burgoyne, and David John Baker, who have compiled a massive data-set, which I have used in this project. Their work is available on github: <a className="text-link" href="https://github.com/Spijkervet/eurovision-dataset">eurovision-dataset</a>.</p>
                        <p className="mt-4">If you're enjoying the app, please consider clicking the donate link above and making a small donation to a nonprofit youth development org in my hometown.</p>
                    </div>}

                {activeTab === 'donate' &&
                    <div className="mb-0">
                        <div className="float-left w-1/2 mr-5 mt-2">

                            <img
                                src={`${process.env.PUBLIC_URL}/mnay.png`}
                                alt="Heart"
                                className="w-full shadow-lg rounded mb-5" />

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

                {activeTab === 'rankings' &&
                    <div className="mb-0">
                        <p><a className="text-link mb-3" href={getUrl("?r=ikd.gt4on&y=23&n=Your+Dev%27s+Personal+Favs")}>My personal favs from 2023 :-)</a></p>
                        <div className=" mt-3">
                            <p className="relative">

                                <Dropdown
                                    className="mx-auto w-[5em] z-50"
                                    menuClassName="max-h-20"
                                    value={rankingYear ?? year}
                                    onChange={y => { setRankingYear(y); }}
                                    options={supportedYears.filter(i => i !== '2024')}
                                /> <span onClick={openEscFinals} className="text-link cursor-pointer no-select ml-2"> ESC finals</span>

                            </p>
                            <p className="relative mb-[7em] mt-2 text-sm">(Select a year and click the link to see the final ranking in that year's finals)</p>
                            {/* <p><a className="text-link" href={getUrl("?r=envw4g.gmckyjib.dod16f.ca7.bhq&y=23&n=finals")}>2023 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=ghde.bw1r7436myc.ef8.gbnktoq&y=22&n=finals")}>2022 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=woftgn0y9r.h71e.bjv4.g.ea.a3dqh&y=21&n=finals")}>2021 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=3w9fe45.ectklj0.coa.b.amrdv.fqh&y=19&n=finals")}>2019 ESC finals</a></p> */}
                        </div>
                    </div>}
            </div>
        </Modal>
    );
};

export default MainModal;

