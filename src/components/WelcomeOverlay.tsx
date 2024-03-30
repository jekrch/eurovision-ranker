import React, { useRef } from 'react';
import { FaList, FaTv, FaGlobe, FaCog, FaHeart } from 'react-icons/fa';
import IconButton from './IconButton';
import { faCheck, faGlasses } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

interface WelcomeOverlayProps {
    exiting: boolean;
    handleGetStarted: () => void;
    handleTakeTour: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ handleGetStarted, handleTakeTour, exiting }) => {

    const overlayContentRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: React.MouseEvent) => {
        if (overlayContentRef.current && !overlayContentRef.current.contains(event.target as Node)) {
            handleGetStarted();
        }
    };

    return (
        <div
            className={`z-50 w-full h-full fixed top-0 left-0 flex items-center justify-center`} // bg-gray-900 transition-opacity duration-100 ${exiting ? 'bg-opacity-0' : 'bg-opacity-80'}`}
            style={{ zIndex: 1000 }}
            onClick={handleClickOutside}
        >
            <div className={`overlay-bg transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-30'}`}></div>
            <div className={`overlay-bg overlay-bg2 transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-30'}`}></div>
            <div className={`overlay-bg overlay-bg3 transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-30'}`}></div>
            <div
                ref={overlayContentRef}
                className={
                    classNames(
                        "flex flex-col justify-between z-50 overlay left-5 right-5 top-[3em] ",
                        "bottom-[1em] rounded-xl absolute bg-[#1d2344] gradient-background-modalx opacity-98 pb-6 pt-6",
                        "m-auto shadow-lg max-w-[20em] max-h-[20em] text-slate-400 opacity-96"
                    )}
                style={{ zIndex: 300 }}
            >
                <div className="text-slate-400 mx-8 mt-0">
                    <div className="text-md text-center font-semibold tracking-tight text-slate-400 mb-0 leading-tight">
                        Welcome to
                        <div className="mt-0">
                            <span className="text-xl gradient-text font-bold">Eurovision Ranker <img
                                src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                                alt="Heart"
                                className="w-5 h-5 ml-0 mb-1 inline pulse-on-load" /></span>
                        </div>
                    </div>
                </div>


                <div className="text-sm mx-8 my-4 mt-1 overflow-auto">
                    <div className="mb-2 italic text-sm">where you can...</div>
                    <ol className="list-none text-md space-y-[2px]">
                        <li className="flex items-start"> <FaList className="mt-1 mr-2 text-indigo-500" /> <span>rank contests going back to 1956</span></li>
                        <li className="flex items-start"> <FaTv className="mt-1 mr-2 text-blue-500" /> <span>create YouTube playlists </span></li>
                        <li className="flex items-start"> <FaGlobe className='mt-1 mr-2 text-sky-500' /> <span>view a heat map of your ranking</span></li>
                        <li className="flex items-start"> <FaCog className='mt-1 mr-2 text-slate-500' /> <span>explore past voting records</span></li>
                        <li className="flex items-start"> <FaHeart className='mt-1 mr-2 opacity-0' /> <span>...and more!</span></li>
                    </ol>
                </div>

                <div className="mx-8 mb-2 space-y-1 space-x-3">
                    <IconButton
                        icon={faCheck}
                        className="w-[9em] py-2 rounded-lg"
                        iconClassName='mr-[3px]'
                        title='Get Started'
                        onClick={handleGetStarted}
                    />
                    <IconButton
                        icon={faGlasses}
                        className="w-[9em] py-2 rounded-lg bg-blue-700"
                        title='Take Tour'
                        onClick={handleTakeTour}
                    />
                </div>
            </div>
        </div>
    );
}

export default WelcomeOverlay;
