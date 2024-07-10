import React, { useEffect, useState } from 'react';
import { AppState } from '../../../redux/store';
import { setTheme, setVote, setContestants, setShowComparison, setRankedItems } from '../../../redux/rootSlice';
import { assignVotesByCode, updateVoteTypeCode, voteCodeHasType } from '../../../utilities/VoteProcessor';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import Checkbox from '../../Checkbox';
import { updateQueryParams } from '../../../utilities/UrlUtil';
import TooltipHelp from '../../TooltipHelp';
import { useAppDispatch, useAppSelector } from '../../../utilities/hooks';
import { Dispatch } from '@reduxjs/toolkit';
import { CountryContestant } from '../../../data/CountryContestant';

const DisplayTab: React.FC = () => {
    const dispatch: Dispatch<any> = useAppDispatch();
    const vote = useAppSelector((state: AppState) => state.vote);
    const theme = useAppSelector((state: AppState) => state.theme);
    const showComparison = useAppSelector((state: AppState) => state.showComparison);
    const contestants = useAppSelector((state: AppState) => state.contestants);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const year = useAppSelector((state: AppState) => state.year);
    const [themeSelection, setThemeSelection] = useState('None');

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

    // Update theme selection when theme changes
    useEffect(() => {
        setThemeSelection(theme === 'ab' ? 'Auroral' : 'None');
    }, [theme]);

    // Update display vote source when vote changes
    useEffect(() => {
        const voteSourceOption = getVoteSourceOption(vote);
        if (voteSourceOption !== displayVoteSource) {
            setDisplayVoteSource(voteSourceOption);
        }
    }, [vote]);

    // Handle theme input change
    const onThemeInputChanged = (newTheme: string) => {
        if (newTheme === 'Auroral') {
            dispatch(setTheme('ab'));
            updateQueryParams({ t: 'ab' });
        } else {
            dispatch(setTheme(''));
            updateQueryParams({ t: '' });
        }
    };

    // Handle vote type input change
    const onVoteTypeInputChanged = (voteType: string, checked: boolean) => {
        const newVote = updateVoteTypeCode(vote, voteType, checked);
        if (newVote !== vote) {
            dispatch(setVote(newVote));
            updateQueryParams({ v: newVote });
        }
    };

    /**
     * Handle check even on show category comparison checkbox
     * @param checked 
     */
    const onShowComparisonChange = (checked: boolean) => {
        updateQueryParams({ cm: checked === true ? 't' : 'f' })
        dispatch(
            setShowComparison(checked === true)
        );
    };

    // Get vote source code from option
    const getVoteSourceCodeFromOption = (optionName: string) => {
        if (!optionName?.length || optionName === 'All') return '';

        return countries.filter((c) => c.name === optionName)?.[0]?.key;
    };

    /**
   * On updating the displayed voting country, update the vote code
   */
    useEffect(() => {

        const handleVoteCountryUpdate = async () => {
            if (vote === 'loading')
                return;

            let voteTypeCode = vote?.split('-')?.[1] ?? '';

            let countryCode = getVoteSourceCodeFromOption(displayVoteSource);

            let newVote = `f-${voteTypeCode}-${countryCode}`;

            let newContestants = await assignVotesByCode(
                dispatch,
                contestants,
                year,
                newVote
            );

            dispatch(
                setContestants(newContestants)
            )

            let newRankedItems: CountryContestant[] = [];
            
            for (const rankedItem of rankedItems) {
                const newRankedItem = newContestants.find(c => c.id === rankedItem.id);
                newRankedItems.push(newRankedItem ?? rankedItem);
            }
            console.log(newRankedItems);
            dispatch(
                setRankedItems(newRankedItems)
            );
            console.log(newContestants)

            if (newVote !== vote) {
                updateQueryParams({ v: newVote });

                dispatch(
                    setVote(newVote)
                )
            }
        }
        handleVoteCountryUpdate();
    }, [displayVoteSource]);

    return (
        <div className="mb-0">
            <div>
                <div className="mb-[0.5em] border-slate-700 border-b-[1px] pb-2 -mt-2">
                    <span className="flex items-center ml-2">
                        <TooltipHelp
                            tooltipContent="Select which types of votes to display with each ranked country"
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
                            tooltipContent="Choose which country to display voting counts from. 'All' will show the total vote count"
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
                        <div className="mb-2">
                            <TooltipHelp
                                tooltipContent="When viewing a category ranking, also display the contestant's rank in each other category"
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
                            options={['None', 'Auroral']}
                            showSearch={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayTab;