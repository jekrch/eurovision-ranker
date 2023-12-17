import classNames from 'classnames';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
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

    useEffect(() => {
        setActiveTab(props.tab)
    }, [props.tab, props.isOpen]);


    if (!props.isOpen) return null;

    return (
        <div className="fixed z-200 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="relative bg-[#272557] opacity-95 m-4 h-[90vh] text-slate-400 z-200 p-6 rounded-lg shadow-lg max-w-lg w-full">
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

                        <li className="mr-2">
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
                        </li>
                        {/* Additional tabs as needed */}
                    </ul>
                </div>

                <div className="pt-4">
                    {activeTab === 'about' &&
                        <div>
                            Thanks for using my app. I'm just getting started, so expect a lot of changes here in the coming months.
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
                            <div className="text-red-400 text-xs">(Warning: this will clear all current rankings)</div>
                          </div>
                        </div>
                      </div>}
                    {/* Additional tab contents */}
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;

