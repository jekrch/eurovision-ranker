import React, { useEffect, useState } from 'react';
import { AppState } from '../../../redux/store';
import { setTheme, setVote, setShowComparison, setRankedItems, assignVotesToContestants, setShowThumbnail, setShowPlace } from '../../../redux/rootSlice';
import {  assignVotesByContestants, fetchVotesByCode, updateVoteTypeCode, voteCodeHasType } from '../../../utilities/VoteProcessor';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import Checkbox from '../../Checkbox';
import { updateQueryParams } from '../../../utilities/UrlUtil';
import TooltipHelp from '../../TooltipHelp';
import { useAppDispatch, useAppSelector } from '../../../hooks/stateHooks';
import { CountryContestant } from '../../../data/CountryContestant';
import { Vote } from '../../../data/Vote';
import { faIceCream, faMoon, faPalette, faStar, faSun, faTree, faWater, faWheatAwn } from '@fortawesome/free-solid-svg-icons';


// Theme configuration with icons
export const THEME_OPTIONS = [
    { display: 'Default', code: '', icon: faPalette, label: 'Default' },
    { display: 'Auroral', code: 'ab', icon: faStar, label: 'Aurora' },
    { display: 'Midnight', code: 'm', icon: faMoon, label: 'Midnight' },
    { display: 'Ocean', code: 'o', icon: faWater, label: 'Ocean' },
    { display: 'Sunset', code: 's', icon: faSun, label: 'Sunset' },
    { display: 'Forest', code: 'f', icon: faTree, label: 'Forest' },
    { display: 'Pastel', code: 'p', icon: faIceCream, label: 'Pastel' },
    { display: 'Prairie', code: 'pr', icon: faWheatAwn, label: 'Prairie' }
];

const DisplayTab: React.FC = () => {
    const dispatch = useAppDispatch();
    const vote = useAppSelector((state: AppState) => state.vote);
    const theme = useAppSelector((state: AppState) => state.theme);
    const showComparison = useAppSelector((state: AppState) => state.showComparison);
    const showThumbnail = useAppSelector((state: AppState) => state.showThumbnail);
    const showPlace = useAppSelector((state: AppState) => state.showPlace);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const year = useAppSelector((state: AppState) => state.year);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);

    // Get vote source option based on vote code
    const getVoteSourceOption = (voteCode: string) => {
        if (!voteCode?.length || voteCode === 'loading') {
            return 'All';
        }

        const codes = voteCode.split('-');
        const sourceCountryKey = codes[2];

        if (!sourceCountryKey) {
            return 'All';
        }

        return countries.filter((c) => c.key === sourceCountryKey)?.[0]?.name;
    };

    const [displayVoteSource, setDisplayVoteSource] = useState(() => getVoteSourceOption(vote));
    const [voteDisplaySourceOptions, setVoteDisplaySourceOptions] = useState<string[]>([
        'All',
        ...countries.sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
    ]);

    // Get display name for current theme
    const getThemeDisplayName = (themeCode: string): string => {
        const themeOption = THEME_OPTIONS.find(opt => opt.code === themeCode);
        return themeOption?.display || 'Default';
    };

    const [themeSelection, setThemeSelection] = useState(getThemeDisplayName(theme));

    // Update theme selection when theme changes
    useEffect(() => {
        setThemeSelection(getThemeDisplayName(theme));
    }, [theme]);

    // Update display vote source when vote changes
    useEffect(() => {
        const voteSourceOption = getVoteSourceOption(vote);
        if (voteSourceOption !== displayVoteSource) {
            setDisplayVoteSource(voteSourceOption);
        }
    }, [vote]);

    // Handle theme input change
    const onThemeInputChanged = (displayName: string) => {
        const themeOption = THEME_OPTIONS.find(opt => opt.display === displayName);
        const themeCode = themeOption?.code || '';
        
        dispatch(setTheme(themeCode));
        updateQueryParams({ t: themeCode });
    };

    // Handle vote type input change
    const onVoteTypeInputChanged = (voteType: string, checked: boolean) => {
        const newVote = updateVoteTypeCode(vote, voteType, checked);
        if (newVote !== vote) {
            dispatch(setVote(newVote));
            updateQueryParams({ v: newVote });
        }
    };

    const onShowComparisonChange = (checked: boolean) => {
        updateQueryParams({ cm: checked === true ? 't' : 'f' })
        dispatch(setShowComparison(checked === true));
    };

    const onShowThumbnailsChange = (checked: boolean) => {
        updateQueryParams({ p: checked === true ? 't' : 'f' })
        dispatch(setShowThumbnail(checked === true));
    };

    const onShowPlaceChange = (checked: boolean) => {
        updateQueryParams({ pl: checked === true ? 't' : 'f' })
        dispatch(setShowPlace(checked === true));
    };

    // Get vote source code from option
    const getVoteSourceCodeFromOption = (optionName: string) => {
        if (!optionName?.length || optionName === 'All') return '';
        return countries.filter((c) => c.name === optionName)?.[0]?.key;
    };

    useEffect(() => {
        const handleVoteCountryUpdate = async () => {
            if (vote === 'loading') return;

            let voteTypeCode = vote?.split('-')?.[1] ?? '';
            let countryCode = getVoteSourceCodeFromOption(displayVoteSource);
            let newVoteCode = `f-${voteTypeCode}-${countryCode}`;

            await resetRankedItemVotes(rankedItems, newVoteCode);

            if (newVoteCode !== vote) {
                updateQueryParams({ v: newVoteCode });
                dispatch(setVote(newVoteCode))
            }
        }
        handleVoteCountryUpdate();
    }, [displayVoteSource]);

    async function resetRankedItemVotes(
        rankedItems: CountryContestant[], newVoteCode: string
    ) {
        if (globalSearch) {
            let newRankedItems = await assignVotesByContestants(
                rankedItems, newVoteCode
            );
            dispatch(setRankedItems(newRankedItems));
        } else {
            let votes: Vote[] = await fetchVotesByCode(newVoteCode, year);
            dispatch(assignVotesToContestants(votes));
        }
    }

    return (
        <div className="mb-0">
            <div>
                <div className="mb-[0.5em] border-[var(--er-border-subtle)] border-b-[1px] pb-2 -mt-2">
                    <span className="flex items-center ml-2">
                        <TooltipHelp
                            content="Display the contestant's place in the final contest if applicable"
                        />
                        <span className="ml-3 text-sm font-semibold">
                            Show Place:
                        </span>
                        <Checkbox
                            id="place-checkbox"
                            checked={showPlace}
                            label=""
                            onChange={(c) => onShowPlaceChange(c)}
                        />
                    </span>
                    <span className="flex items-center ml-2">
                        <TooltipHelp
                            content="Select which types of votes to display with each ranked country"
                        />
                        <span className="ml-3 text-sm font-semibold">
                            Show Votes:
                        </span>
                        <Checkbox
                            id="total-checkbox"
                            checked={voteCodeHasType(vote, 't')}
                            onChange={(c) => onVoteTypeInputChanged('t', c)}
                            label="Total"
                        />
                        <Checkbox
                            id="tele-checkbox"
                            checked={voteCodeHasType(vote, 'tv')}
                            onChange={(c) => onVoteTypeInputChanged('tv', c)}
                            label="Tele"
                            className="ml-[0.5em]"
                        />
                        <Checkbox
                            id="jury-checkbox"
                            checked={voteCodeHasType(vote, 'j')}
                            onChange={(c) => onVoteTypeInputChanged('j', c)}
                            label="Jury"
                            className="ml-[0.5em]"
                        />
                    </span>

                    <div className="mt-[0.5em]">
                        <TooltipHelp
                            content="Choose which country to display voting counts from. 'All' will show the total vote count"
                            className="ml-4"
                        />
                        <span className="ml-3 text-sm font-semibold">
                            From:
                        </span>
                        <Dropdown
                            key="country-selector-2"
                            className="ml-5 min-w[6em] mx-auto mb-2"
                            menuClassName="w-auto"
                            value={displayVoteSource}
                            onChange={(s) => setDisplayVoteSource(s)}
                            options={voteDisplaySourceOptions}
                            showSearch={true}
                        />
                    </div>
                </div>
            </div>

            <div>
                <div className="mt-4">
                    <div>
                        <div className="mb-0">
                            <TooltipHelp
                                content="Determine whether to show a thumbnail of the song video"
                                className="ml-4 pb-1"
                            />
                            <Checkbox
                                id="thumbnail-checkbox"
                                checked={showThumbnail}
                                onChange={(c) => onShowThumbnailsChange(c)}
                                label="Show Video Thumbnails"
                            />
                        </div>
                        <div className="mb-2">
                            <TooltipHelp
                                content="When viewing a category ranking, also display the contestant's rank in each other category"
                                className="ml-4 pb-1"
                            />
                            <Checkbox
                                id="total-checkbox"
                                checked={showComparison}
                                onChange={(c) => onShowComparisonChange(c)}
                                label="Show Category Comparisons"
                            />
                        </div>
                        <span className="ml-5 font-semibold text-sm mb-[0.7em]">Theme:</span>
                        <Dropdown
                            key="theme-selector"
                            className="ml-5 w-30 mx-auto mb-3"
                            menuClassName=""
                            value={themeSelection}
                            onChange={(v) => onThemeInputChanged(v)}
                            options={THEME_OPTIONS.map(opt => opt.display)}
                            showSearch={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayTab;