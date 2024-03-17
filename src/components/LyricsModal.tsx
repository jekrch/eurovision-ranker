import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import Modal from './Modal';
import { CountryContestant } from '../data/CountryContestant';
import { getSongDetails } from '../utilities/ContestantRepository';

type SongModalProps = {
    isOpen: boolean;
    //tab: string;
    countryContestant?: CountryContestant;
    onClose: () => void;
};

const SongModal: React.FC<SongModalProps> = (props: SongModalProps) => {
    //const dispatch: Dispatch<any> = useDispatch();
    const year = useSelector((state: AppState) => state.year);
    // const [activeTab, setActiveTab] = useState(props.tab);
    const [lyrics, setLyrics] = useState<string | undefined>('');
    const [engLyrics, setEngLyrics] = useState<string | undefined>('');
    const [composers, setComposers] = useState('');
    const [lyricists, setLyricists] = useState('');
    const [showEngLyrics, setShowEngLyrics] = useState<boolean>(false);
    const contestant = props.countryContestant?.contestant;

    // useEffect(() => {
    //     setActiveTab(props.tab);
    // }, [props.tab, props.isOpen]);


    /**
     * Load additional song details 
     */
    useEffect(() => {
        if (year && contestant?.song) {
            setShowEngLyrics(false);
            getSongDetails(year, contestant.song)
                .then(fetchedSongDetails => {
                    assignLyrics(
                        fetchedSongDetails?.lyrics,
                        fetchedSongDetails?.engLyrics,
                        contestant.song
                    )
                    setComposers(fetchedSongDetails?.composers ?? '');
                    setLyricists(fetchedSongDetails?.lyricists ?? '');
                })
                .catch(console.error);
        }
    }, [props.countryContestant]);

    function assignLyrics(
        lyrics: string | undefined,
        engLyrics: string | undefined,
        song: string | undefined
    ) {

        if (!lyrics?.length) {
            setLyrics('N/A');
            return;
        }

        const finalLyrics = formatLyrics(lyrics, song);
        setLyrics(finalLyrics);

        const finalEngLyrics = formatLyrics(engLyrics, song);
        setEngLyrics(finalEngLyrics);
    }

    //if (!props.isOpen) return null;

    function formatLyrics(
        lyrics: string | undefined,
        song: string | undefined
    ) {

        if (!lyrics) {
            return lyrics;
        }

        let lines = lyrics.split('\\n');

        // if the first line is the song title and the second line is empty,
        // remove those lines
        if (lines.length >= 2 && lines[0] === song && !lines[1].trim()) {
            lines = lines.slice(2);
        }

        const finalLyrics = lines.join('\\n');

        return finalLyrics;
    }

    const LabeledValue: React.FC<
        { label: string; value: string | null | undefined }
    > = ({ label, value }) => {

        if (!value) {
            return null;
        }

        const processedValue = value.replaceAll(';', ', ');

        return (
            <div className="flex">
                <span className="text-sm mr-[0.8em] w-[6.2em] text-right font-semibold">{label}:</span>
                <span className="text-sm flex-1">{processedValue}</span>
            </div>
        );
    };

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            className="z-50 select-text min-h-[20em]">

            <div className="-mt-[0.5em] mr-[1.2em] mb-3 font-semibold text-base text-slate-[400px]">
                <span>
                    {props.countryContestant?.country.name} - {contestant?.artist} - "{contestant?.song}"
                    {engLyrics &&
                    <label className="inline-flex float-right mr-2 mt-1 items-center cursor-pointer" title="translate">
                        <input type="checkbox" 
                            value="" 
                            onChange={(e: any) => { setShowEngLyrics(e.target.checked);} }
                            className="sr-only peer" 
                        />
                        <div className="relative w-7 h-4 bg-gray-00 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-gray-400 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"><i className={`z-0 float-right text-md flag-icon -mr-2 flag-icon-gb mr-1`} /></span>
                    </label>
                    }
                </span>
            </div>

            <hr className="mb-[1em] border-slate-500" />

            <div className="overflow-auto">
                <LabeledValue
                    label="Composer(s)"
                    value={composers?.replaceAll(';', ', ')}
                />
                <LabeledValue
                    label="Lyricist(s)"
                    value={lyricists?.replaceAll(';', ', ')}
                />
                <hr className="mt-[1em] mr-2 border-slate-500" />
                <div
                    className="mt-[1em]">
                    {(showEngLyrics ? engLyrics : lyrics)?.split('\\n').map((line, index) => (
                        <div key={index}>{line?.length ? line : '\u00A0'}</div>
                    ))}
                </div>
            </div>
            {/* <div className="border-b border-gray-200 dark:border-gray-700 -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                    <TabButton
                        isActive={activeTab === 'lyrics'}
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
            </div> */}

            {/* <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">
                {activeTab === 'about' &&
                    <div className="">

                    </div>}

                {activeTab === 'donate' &&
                    <div className="mb-0">
                       
                    </div>}

            </div> */}

        </Modal>
    );
};

export default SongModal;
