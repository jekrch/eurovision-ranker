import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { Dispatch } from 'redux';
import Dropdown from './Dropdown';
import { faEdit, faList } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import TabButton from './TabButton';
import { supportedYears } from '../data/Contestants';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { CountryContestant } from '../data/CountryContestant';
import { hasAnyJuryVotes, hasAnyTeleVotes, sortByVotes, updateVoteTypeCode, voteCodeHasType } from '../utilities/VoteProcessor';
import { countries } from '../data/Countries';
import { setTheme, setVote } from '../redux/actions';
import { updateQueryParams } from '../utilities/UrlUtil';

type ConfigModalProps = {
    isOpen: boolean;
    tab: string;
    onClose: () => void;
    startTour: () => void;
};

const ConfigModal: React.FC<ConfigModalProps> = (props: ConfigModalProps) => {
    const dispatch: Dispatch<any> = useDispatch();
    const { year, vote, theme } = useSelector((state: AppState) => state);

    const [themeSelection, setThemeSelection] = useState('None');
    const [hasJuryVotes, setHasJuryVotes] = useState(false);
    const [hasTeleVotes, setHasTeleVotes] = useState(false);
    const [activeTab, setActiveTab] = useState(props.tab);
    const [rankingYear, setRankingYear] = useState(year);
    const [voteSource, setVoteSource] = useState('All');
    const currentDomain = window.location.origin; // Get the current domain
    const currentPath = window.location.pathname; // Get the current path
    const triggerButtonRef = useRef<HTMLDivElement>(null);
    const voteSourceOptions = ['All', ...countries.sort((a, b) => a.name.localeCompare(b.name)).map(c => c.name)];

    function getVoteTypeOption(voteCode: string) {
        if (!voteCode?.length || voteCode == 'loading') {
            return 'None';
        }

        let codes = voteCode.split("-");

        switch (codes[1]) {
            case 'tv':
                return 'Tele'
            case 'j':
            case 'jury':
                return 'Jury';
            default:
                return 'Total';
        }
    }

    function onThemeInputChanged(newTheme: string) {
        if (newTheme == 'Auroral') {
            dispatch(
                setTheme('ab')
            )
            updateQueryParams({ t: 'ab' });
        } else {
            dispatch(
                setTheme('')
            )
            updateQueryParams({ t: '' });
        }
    }

    function onVoteTypeInputChanged(voteType: string, checked: boolean) {

        let newVote = updateVoteTypeCode(vote, voteType, checked);
        if (newVote !== vote) {

            dispatch(
                setVote(newVote)
            );
            updateQueryParams({ v: newVote });
        }
    }

    useEffect(() => {
        if (theme === 'ab') {
            setThemeSelection('Auroral');
        } else {
            setThemeSelection('None')
        }
    }, [theme]);

    // function getVoteSourceOption(voteCode: string) {

    //     console.log(voteCode);
    //     if (!voteCode?.length || voteCode == 'loading') {
    //         return 'All';
    //     }

    //     let codes = voteCode.split("-");
    //     let sourceCountryKey = codes[2];

    //     console.log(sourceCountryKey)

    //     if (!sourceCountryKey) {
    //         return 'All'
    //     }

    //     return countries.filter(
    //         c => c.key === sourceCountryKey
    //     )?.[0]?.name;
    // }

    // useEffect(() => {
    //     setVoteTypeSelection(
    //         getVoteTypeOption(vote)
    //     );
    //     setVoteSource(
    //         getVoteSourceOption(vote)
    //     );
    // }, [vote]);

    useEffect(() => {

        // if (vote === 'loading')
        //     return;

        // console.log(voteTypeSelection)

        // if (!voteTypeSelection) {
        //     return;
        // }

        // let newVoteTypeCode = getVoteTypeCodeFromOption(voteTypeSelection);
        // let countryCode = getVoteSourceCodeFromOption(voteSource);

        // let newVote = `f-${newVoteTypeCode}-${countryCode}`;
        // console.log(newVote);

        // updateQueryParams({ v: newVote });

        // dispatch(
        //     setVote(newVote)
        // )

    }, [voteSource]);


    function getVoteSourceCodeFromOption(
        optionName: string
    ) {
        if (!optionName?.length || optionName === 'All')
            return '';

        return countries.filter(
            c => c.name === optionName
        )?.[0]?.key;
    }

    function getVoteTypeCodeFromOption(
        optionName: string
    ) {
        if (!optionName) {
            return;
        }

        switch (optionName) {
            case 'Jury':
                return 'j'
            case 'Total':
                return 't';
            case 'Tele':
                return 'tv'
            default:
                return;
        }
    }

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
        const handleYearUpdate = async () => {
            let yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(rankingYear);

            let hasTeleVotes = hasAnyTeleVotes(yearContestants)
            setHasTeleVotes(hasTeleVotes);

            let hasJuryVotes = hasAnyJuryVotes(yearContestants);
            setHasJuryVotes(hasJuryVotes);
        }

        handleYearUpdate();
    }, [rankingYear]);

    function startTour() {
        props.onClose();
        props.startTour();
    }

    async function getSortedRankingCode(
        voteYear: string,
        voteType: string,
        round: string
    ) {
        let countryContestants: CountryContestant[] = await fetchCountryContestantsByYear(voteYear);
        countryContestants = await sortByVotes(
            countryContestants,
            voteYear,
            voteType,
            round
        );

        const sortedContestants = countryContestants.filter(
            cc => cc?.contestant?.votes !== undefined
        );

        // generate the ranking param
        let concatenatedIds = sortedContestants.map(cc => cc.id).join('');
        return concatenatedIds;
    }

    async function openTotalRanking() {
        const voteYear = rankingYear ?? year;

        let concatenatedIds = await getSortedRankingCode(
            voteYear, 'total', 'final'
        );

        goToUrl(
            `?r=${concatenatedIds}&y=${voteYear.substring(2, 4)}&n=Final&v=f-t`
        )
    }

    async function openTotalTelevoteRanking() {
        const voteYear = rankingYear ?? year;

        let concatenatedIds = await getSortedRankingCode(
            voteYear, 'televote', 'final'
        );

        //console.log(`?r=${concatenatedIds}&y=${voteYear.substring(2, 4)}&n=Final+Televote&v=f-tv`)
        goToUrl(
            `?r=${concatenatedIds}&y=${voteYear.substring(2, 4)}&n=Final+Televote&v=f-tv`
        )
    }

    async function openTotalJuryRanking() {
        const voteYear = rankingYear ?? year;

        let concatenatedIds = await getSortedRankingCode(
            voteYear, 'jury', 'final'
        );

        goToUrl(
            `?r=${concatenatedIds}&y=${voteYear.substring(2, 4)}&n=Final+Jury+Vote&v=f-j`
        )
    }

    if (!props.isOpen) return null;

    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} className="">
            <div className="border-b border-gray-200 dark:border-gray-700 -mt-4">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">

                    <TabButton
                        isActive={activeTab === 'rankings'}
                        onClick={() => setActiveTab('rankings')}
                        icon={faList}
                        label="Rankings"
                    />

                    <TabButton
                        isActive={activeTab === 'display'}
                        onClick={() => setActiveTab('display')}
                        icon={faEdit}
                        label="Display"
                    />
                </ul>
            </div>

            <div className="overflow-y-auto pt-4 select-text pb-3 flex-grow">

                {activeTab === 'display' &&
                    <div className="mb-0">
                        <div>
                            <h4 className="font-bold mb-3">Show Votes</h4>

                            <div className="mb-[1em]">
                                {/* <Dropdown
                                key="type-selector"
                                className="z-50 w-20 h-10 mx-auto mb-2"  // Adjusted for Tailwind (w-[5em] to w-20)
                                menuClassName="max-h-[6em]"
                                value={voteTypeSelection}
                                onChange={v => { setVoteTypeSelection(v); }}
                                options={['None', 'Total', 'Tele', 'Jury']}
                                showSearch={false}
                            /> */}
                                <span className="flex items-center ml-2">
                                    <input
                                        key="total-input-checkbox"
                                        type="checkbox"
                                        checked={voteCodeHasType(vote, 't')}
                                        onChange={c => { onVoteTypeInputChanged('t', c.target.checked); }}
                                        className="w-4 h-4 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600" />
                                    <label key="total-label" className="ms-2 text-xs font-medium text-gray-300">
                                        Total
                                    </label>

                                    <input
                                        key={`tele-checkbox-${hasTeleVotes}`}
                                        type="checkbox"
                                        checked={voteCodeHasType(vote, 'tv')}
                                        onChange={c => { onVoteTypeInputChanged('tv', c.target.checked); }}
                                        className="ml-6 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                    <label key="link-checkbox" className="ms-2 text-xs font-medium text-gray-900 dark:text-gray-300">
                                        Tele
                                    </label>

                                    <input
                                        key={`jury-checkbox-${hasTeleVotes}`}
                                        type="checkbox"
                                        checked={voteCodeHasType(vote, 'j')}
                                        onChange={c => { onVoteTypeInputChanged('j', c.target.checked); }}
                                        className="ml-6 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                    <label key="jury-checkbox" className="ms-2 text-xs font-medium text-gray-900 dark:text-gray-300">
                                        Jury
                                    </label>


                                </span>
                                {/* hidden for now */}
                                <div className="mt-[1em] hidden">
                                    <span className="ml-2 text-sm">{'from'}</span>
                                    <Dropdown
                                        key="country-selector"
                                        className="z-50 ml-4 w-[6em] w-auto mx-auto mb-2"  // Adjusted for Tailwind (w-[5em] to w-20)
                                        menuClassName="max-h-[8em] w-auto"
                                        value={voteSource}
                                        onChange={s => { setVoteSource(s); }}
                                        options={voteSourceOptions}
                                        showSearch={true}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3 mt-[2em]">Theme</h4>

                            <div className="mb-[3em]">
                                <Dropdown
                                    key="theme-selector"
                                    className="ml-2 z-50 w-20 h-10 mx-auto mb-2"  // Adjusted for Tailwind (w-[5em] to w-20)
                                    menuClassName="max-h-[6em]"
                                    value={themeSelection}
                                    onChange={v => { onThemeInputChanged(v); }}
                                    options={['None', 'Auroral']}
                                    showSearch={false}
                                />


                            </div>

                        </div>
                    </div>
                }

                {activeTab === 'rankings' &&
                    <div className="mb-0">
                        <div className=" mt-3">
                            <div className="relative">
                                <Dropdown
                                    className="z-50 w-20 mx-auto mb-2"  // Adjusted for Tailwind (w-[5em] to w-20)
                                    menuClassName="max-h-[7em]"
                                    value={rankingYear ?? year}
                                    onChange={y => { setRankingYear(y); }}
                                    options={supportedYears.filter(i => i !== '2024' && i !== '2020')}
                                    showSearch={true}
                                />

                                <span className="font-bold ml-2 whitespace-nowrap">ESC finals</span>

                                <span className="">
                                    <span
                                        onClick={openTotalRanking}
                                        className="text-link ml-2">
                                        total
                                    </span>
                                    {hasTeleVotes &&
                                        <span
                                            onClick={openTotalTelevoteRanking}
                                            className="text-link ml-2">
                                            televote
                                        </span>
                                    }
                                    {hasJuryVotes &&
                                        <span
                                            onClick={openTotalJuryRanking}
                                            className="text-link ml-2">
                                            jury
                                        </span>
                                    }
                                </span>
                            </div>
                            <p className="relative mb-[1em] mt-2 text-sm">(Select a year and click the link to see the final ranking in that year's finals)</p>
                            {/* <p><a className="text-link" href={getUrl("?r=envw4g.gmckyjib.dod16f.ca7.bhq&y=23&n=finals")}>2023 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=ghde.bw1r7436myc.ef8.gbnktoq&y=22&n=finals")}>2022 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=woftgn0y9r.h71e.bjv4.g.ea.a3dqh&y=21&n=finals")}>2021 ESC finals</a></p>
                            <p><a className="text-link" href={getUrl("?r=3w9fe45.ectklj0.coa.b.amrdv.fqh&y=19&n=finals")}>2019 ESC finals</a></p> */}
                        </div>
                        <p className="mb-[8em]"><a className="text-link text-sm mb-[3em]" href={getUrl("?r=ikd.gt4on&y=23&n=Your+Dev%27s+Personal+Favs")}>My personal favs from 2023 :-)</a></p>
                    </div>}
            </div>

        </Modal>
    );
};

export default ConfigModal;

