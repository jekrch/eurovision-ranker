import React, { Dispatch } from 'react';
import { FaGlobe, FaTv } from 'react-icons/fa';
import Dropdown from './Dropdown'; 
import { CountryContestant } from '../data/CountryContestant'; 
import { AnyIfEmpty, useDispatch } from 'react-redux';
import { AppState } from '../redux/types';
import { useSelector } from 'react-redux';
import { setYear } from '../redux/actions';
import RankedHeaderMenu from './RankedHeaderMenu';
import { Toaster } from 'react-hot-toast';

interface IRankedItemsHeaderProps {
    setMapModalShow: () => void;
    openNameModal: () => void;
    openConfig: (tab: string) => void;
    generateYoutubePlaylistUrl: (rankedItems: CountryContestant[]) => string;
    supportedYears: string[];
}

const RankedItemsHeader: React.FC<IRankedItemsHeaderProps> = ({
    setMapModalShow,
    generateYoutubePlaylistUrl,
    openNameModal,
    openConfig,
    supportedYears
}) => {
    const dispatch: Dispatch<any> = useDispatch();
    const showUnranked = useSelector((state: AppState) => state.showUnranked);
    const year = useSelector((state: AppState) => state.year);
    const name = useSelector((state: AppState) => state.name);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);

    return (
        <div className="z-40 rounded-t-md round-b-sm w-full text-center font-bold bg-blue-900 gradient-background text-slate-300 py-1 text-md tracking-tighter shadow-md ranked-bar-background">
            {showUnranked ? (
                <div className="w-full m-auto flex items-center justify-center">
                    <Dropdown
                        className="tour-step-1 w-[5em]"
                        buttonClassName='!h-[1.8em]'
                        value={year}
                        onChange={y => { dispatch(setYear(y)); }}
                        options={supportedYears}
                        showSearch={true}
                    />
                </div>
            ) : (
                <div className="mr-2 ml-5 flex justify-between items-center">
                    {rankedItems?.length > 0 && (
                        // <a
                        //     onClick={setMapModalShow}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     title="Display geographical heat map"
                        //     className='text-slate-500 hover:text-slate-100 cursor-pointer'
                        // >
                        //     <FaGlobe className='text-xl tour-step-7' />
                        // </a>
                       <></>
                    )}
                    
                    
                    <div className="justify-center w-full ml-2 mr-2">
                        {year}
                        {name && (
                            <span className="font-bold text-slate-400 text-md"> - {name}</span>
                        )}
                    </div>
                    <RankedHeaderMenu 
                        openNameModal={openNameModal}
                        openConfig={openConfig}
                        onMapClick={setMapModalShow} 
                        generateYoutubePlaylistUrl={() => {return generateYoutubePlaylistUrl(rankedItems)}}
                    />
                    {/* {rankedHasAnyYoutubeLinks(rankedItems) && (
                        <a
                            href={generateYoutubePlaylistUrl(rankedItems)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Generate YouTube playlist"
                            className='text-slate-500 hover:text-slate-100'
                        >
                            <FaTv className='text-xl tour-step-6' />
                        </a>
                    )} */}
                </div>
            )}
        </div>
    );
};

export default RankedItemsHeader;
