import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {  useSelector } from 'react-redux';
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
    const [lyrics, setLyrics] = useState('');
    const [composers, setComposers] = useState('');
    const [lyricists, setLyricists] = useState('');

    const contestant = props.countryContestant?.contestant;

    // useEffect(() => {
    //     setActiveTab(props.tab);
    // }, [props.tab, props.isOpen]);


    /**
     * Load additional song details 
     */
    useEffect(() => {
        if (year && contestant?.song) {
            getSongDetails(year, contestant.song)
                .then(fetchedSongDetails => {
                    assignLyrics(fetchedSongDetails?.lyrics, contestant.song)
                    setComposers(fetchedSongDetails?.composers ?? '');
                    setLyricists(fetchedSongDetails?.lyricists ?? '');
                })
                .catch(console.error);
        }
    }, [props.countryContestant]);

    function assignLyrics(
        lyrics: string | undefined,
        song: string | undefined
    ) {
        if (!lyrics?.length) {
            setLyrics('N/A');
            return;
        }

        let lines = lyrics.split('\\n');

        // if the first line is the song title and the second line is empty,
        // remove those lines
        if (lines.length >= 2 && lines[0] === song && !lines[1].trim()) {
            lines = lines.slice(2);
        }

        setLyrics(lines.join('\\n'));
    }

    //if (!props.isOpen) return null;

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
            className="z-50 select-text">

            <div className="-mt-[0.5em] mr-[1.2em] mb-3 font-semibold text-base text-slate-300">
                {props.countryContestant?.country.name} - {contestant?.artist} - "{contestant?.song}"
            </div>

            <hr className="mb-[1em] border-slate-500"/>
            
            <div className="overflow-auto">
                <LabeledValue
                    label="Composer(s)"
                    value={composers?.replaceAll(';', ', ')}
                />
                <LabeledValue
                    label="Lyricist(s)"
                    value={lyricists?.replaceAll(';', ', ')}
                />
                <hr className="mt-[1em] mr-2 border-slate-500"/>
                <div
                    className="mt-[1em]">
                    {lyrics.split('\\n').map((line, index) => (
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
