import classNames from 'classnames';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import Dropdown from './Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHouseUser, faList } from '@fortawesome/free-solid-svg-icons';

type MainModalProps = {
    isOpen: boolean;
    tab: string;
    onClose: () => void;
    setYear: Dispatch<SetStateAction<string>>;
    year: string;
};

const MainModal: React.FC<MainModalProps> = (props: MainModalProps) => {
    const [activeTab, setActiveTab] = useState(props.tab);
    const modalRef = useRef<HTMLDivElement>(null);

    const currentDomain = window.location.origin; // Get the current domain
    const currentPath = window.location.pathname; // Get the current path

    function getUrl(queryString: string) {
        return `${currentDomain}${currentPath}${queryString}`;
    }

    useEffect(() => {
        setActiveTab(props.tab)
    }, [props.tab, props.isOpen]);

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


    if (!props.isOpen) return null;

    return (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div
                ref={modalRef}
                className="relative bg-[#272557] opacity-95 m-4 h-auto max-h-[90vh] text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full flex flex-col">
                <button
                    onClick={props.onClose}
                    className="absolute top-0 right-0 mt-4 mr-4 text-gray-300 text-lg leading-none hover:text-gray-400"
                >
                    &#x2715;
                </button>
                <div className="border-b border-gray-200 dark:border-gray-700 -mt-4">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'about' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <FontAwesomeIcon
                                    className="mr-2 text-md"
                                    icon={faHouseUser}
                                />
                                About
                            </button>
                        </li>
                        
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('donate')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'donate' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <FontAwesomeIcon
                                    className="mr-2 text-md"
                                    icon={faHeart}
                                />
                                Donate
                            </button>
                        </li>

                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('rankings')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'settings' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <FontAwesomeIcon
                                    className="mr-2 text-md"
                                    icon={faList}

                                />
                                Rankings
                            </button>
                        </li>

                    </ul>
                </div>

                <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">
                    {activeTab === 'about' &&
                        <div className="">
                            <p>Thanks for using my app! I'm just getting started, so expect a lot of changes here in the coming months.</p>
                            <p className="mt-4">This is an <a className="text-link" href="https://github.com/jekrch/eurovision-ranker">open-source project</a> that I'm doing in my spare time. If you have any feedback, suggestions, or want to report a bug, you can do so at my <a href="https://github.com/jekrch/eurovision-ranker/issues" className="text-link">github repository</a> or send me an email at <a href="mailto:eurovision.ranker@gmail.com" className="text-link">eurovision.ranker@gmail.com</a>. </p>
                            <p className="mt-4">In the meantime, if you're enjoying the app, please consider clicking the donate link above and making a small donation to a nonprofit youth development org in my hometown.</p>
                        </div>}
                    {activeTab === 'settings' &&
                        <div className="flex flex-col items-start">
                            <div className="flex items-center">
                                <div className="mr-4">
                                    <Dropdown
                                        value={props.year}
                                        onChange={props.setYear}
                                        options={['2023', '2022', '2021']}
                                    />
                                </div>
                                <div>
                                    Set the contest year
                                    <div className="text-slate-500 text-xs">(Warning: any currently ranked countries that did not participate will be removed)</div>
                                </div>
                            </div>
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
                            <p className="mb-2">Click the links to see different rankings </p>
                            <p><a className="text-link mb-2" href={getUrl("?r=hrczesbeisnofrfi&y=23&n=Your+Dev%27s+Personal+Favs")}>My personal favs from 2023 :-)</a></p>
                            <div className="space-y-1 mt-2">
                                <p><a className="text-link" href={getUrl("?r=sefiilitnouabeeeauczltcyhramatfresmdplchsialptrsgbde&y=23&n=finals")}>2023 ESC finals</a></p>
                                <p><a className="text-link" href={getUrl("?r=uagbessersitmdgrptnonlpleeltauazchrobeamficzisfrde&y=22&n=finals")}>2022 ESC finals</a></p>
                                <p><a className="text-link" href={getUrl("?r=itfrchisuafimtltrugrbgptmdserscyilnobeazalsmnlesdegb&y=21&n=finals")}>2021 ESC finals</a></p>
                                <p><a className="text-link" href={getUrl("?r=nlitruchsenomkazauisczdkcymtsifralrssmeegresilbydegb&y=19&n=finals")}>2019 ESC finals</a></p>
                            </div>
                        </div>}
                </div>
            </div>
        </div>
    );
};

export default MainModal;

