import classNames from 'classnames';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import Dropdown from './Dropdown';

type ConfigModalProps = {
    isOpen: boolean;
    tab: string;
    onClose: () => void;
    setYear: Dispatch<SetStateAction<string>>;
    year: string;
};

const ConfigModal: React.FC<ConfigModalProps> = (props: ConfigModalProps) => {
    const [activeTab, setActiveTab] = useState(props.tab); 
    const modalRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed z-200 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div
                ref={modalRef}
                className="relative bg-[#272557] opacity-95 m-4 h-auto text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full">
                <button
                    onClick={props.onClose}
                    className="absolute top-0 right-0 mt-4 mr-4 text-gray-300 text-lg leading-none hover:text-gray-400"
                >
                    &#x2715;
                </button>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'about' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <svg
                                    className={`w-4 h-4 me-2 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300 ${activeTab === 'about' ? '!text-blue-500' : ''}`}
                                    aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                                </svg>
                                About
                            </button>
                        </li>

                        {/* <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'settings' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <svg
                                    className={`w-4 h-4 me-2 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300 ${activeTab === 'settings' ? '!text-blue-500' : ''}`}
                                    aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 11.424V1a1 1 0 1 0-2 0v10.424a3.228 3.228 0 0 0 0 6.152V19a1 1 0 1 0 2 0v-1.424a3.228 3.228 0 0 0 0-6.152ZM19.25 14.5A3.243 3.243 0 0 0 17 11.424V1a1 1 0 0 0-2 0v10.424a3.227 3.227 0 0 0 0 6.152V19a1 1 0 1 0 2 0v-1.424a3.243 3.243 0 0 0 2.25-3.076Zm-6-9A3.243 3.243 0 0 0 11 2.424V1a1 1 0 0 0-2 0v1.424a3.228 3.228 0 0 0 0 6.152V19a1 1 0 1 0 2 0V8.576A3.243 3.243 0 0 0 13.25 5.5Z" />
                                </svg>
                                Settings
                            </button>
                        </li> */}

                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab('donate')}
                                className={`inline-flex items-center justify-center p-4 ${activeTab === 'donate' ? 'text-blue-500 border-blue-500 border-b-2' : 'hover:text-gray-500 hover:border-gray-300'}`}
                            >
                                <svg fill="currentColor" height="14px" width="14px" id="heart" className="mr-2 "
                                    viewBox="0 0 471.701 471.701">
                                    <g>
                                        <path d="M433.601,67.001c-24.7-24.7-57.4-38.2-92.3-38.2s-67.7,13.6-92.4,38.3l-12.9,12.9l-13.1-13.1
		c-24.7-24.7-57.6-38.4-92.5-38.4c-34.8,0-67.6,13.6-92.2,38.2c-24.7,24.7-38.3,57.5-38.2,92.4c0,34.9,13.7,67.6,38.4,92.3
		l187.8,187.8c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-3.9l188.2-187.5c24.7-24.7,38.3-57.5,38.3-92.4
		C471.801,124.501,458.301,91.701,433.601,67.001z M414.401,232.701l-178.7,178l-178.3-178.3c-19.6-19.6-30.4-45.6-30.4-73.3
		s10.7-53.7,30.3-73.2c19.5-19.5,45.5-30.3,73.1-30.3c27.7,0,53.8,10.8,73.4,30.4l22.6,22.6c5.3,5.3,13.8,5.3,19.1,0l22.4-22.4
		c19.6-19.6,45.7-30.4,73.3-30.4c27.6,0,53.6,10.8,73.2,30.3c19.6,19.6,30.3,45.6,30.3,73.3
		C444.801,187.101,434.001,213.101,414.401,232.701z"/>
                                    </g>
                                </svg>
                                Donate
                            </button>
                        </li>

                    </ul>
                </div>

                <div className="pt-4 select-text pb-3">
                    {activeTab === 'about' &&
                        <div className="">
                            <p>Thanks for using my app! I'm just getting started, so expect a lot of changes here in the coming months.</p>
                            <p className="mt-4">This is an open-source project that I'm doing in my spare time. If you have any feedback, suggestions, or want to report a bug, you can do so at my <a href="https://github.com/jekrch/eurovision-ranker/issues" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">github repository</a> or send me an email at <a href="mailto:eurovision.ranker@gmail.com" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">eurovision.ranker@gmail.com</a>. </p>
                            <p className="mt-4">In the meantime, if you're enjoying the app, please consider clicking the donate link above and making a small donation to a nonprofit youth development org in my hometown.</p>
                            {/* 
                            <iframe
                                className="donate-widget border-0 m-0 h-[30em]"
                                src="https://www.givemn.org/forms/Jddsdf?id=nmng3g&embed=donation_widget"
                                title="Donation Widget"
                            ></iframe> */}

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
                            </div></div>}
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;

