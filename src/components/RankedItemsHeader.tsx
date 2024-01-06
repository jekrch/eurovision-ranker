import React, { Dispatch } from 'react';
import { FaGlobe, FaTv } from 'react-icons/fa';
import Dropdown from './Dropdown'; // Adjust import path as necessary
import { CountryContestant } from '../data/CountryContestant'; // Adjust import path as necessary
import { useDispatch } from 'react-redux';
import { AppState } from '../redux/types';
import { useSelector } from 'react-redux';
import { setYear } from '../redux/actions';

interface IRankedItemsHeaderProps {
    setMapModalShow: () => void;
    generateYoutubePlaylistUrl: (rankedItems: CountryContestant[]) => string;
    rankedHasAnyYoutubeLinks: (rankedItems: CountryContestant[]) => boolean;
    supportedYears: string[];
}

const RankedItemsHeader: React.FC<IRankedItemsHeaderProps> = ({
    setMapModalShow,
    generateYoutubePlaylistUrl,
    rankedHasAnyYoutubeLinks,
    supportedYears
}) => {
    const dispatch: Dispatch<any> = useDispatch();
    const showUnranked = useSelector((state: AppState) => state.showUnranked);
    const year = useSelector((state: AppState) => state.year);
    const name = useSelector((state: AppState) => state.name);
    const rankedItems = useSelector((state: AppState) => state.rankedItems);

    return (
        <div className="z-40 rounded-t-md w-full text-center font-bold bg-blue-900 text-slate-300 py-1 text-md tracking-tighter ">
            {showUnranked ? (
                <div className="w-full m-auto flex items-center justify-center">
                    <Dropdown
                        className="tour-step-1 w-[5em]"
                        value={year}
                        onChange={y => { dispatch(setYear(y)); }}
                        options={supportedYears}
                        showSearch={true}
                    />
                </div>
            ) : (
                <div className="mx-2 flex justify-between items-center">
                    {rankedItems?.length > 0 && (
                        <a
                            onClick={setMapModalShow}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Display geographical heat map"
                            className='text-slate-500 hover:text-slate-100 cursor-pointer'
                        >
                            <FaGlobe className='text-xl tour-step-7' />
                        </a>
                    )}
                    <div className="justify-center w-full ml-2">
                        {year}
                        {name && (
                            <span className="font-bold text-slate-400 text-md"> - {name}</span>
                        )}
                    </div>
                    {rankedHasAnyYoutubeLinks(rankedItems) && (
                        <a
                            href={generateYoutubePlaylistUrl(rankedItems)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Generate YouTube playlist"
                            className='text-slate-500 hover:text-slate-100'
                        >
                            <FaTv className='text-xl tour-step-6' />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default RankedItemsHeader;
