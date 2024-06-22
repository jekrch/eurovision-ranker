import React, { Dispatch, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../redux/types';
import { setTheme, setVote, setContestants } from '../../../redux/actions';
import { assignVotesByCode, updateVoteTypeCode, voteCodeHasType } from '../../../utilities/VoteProcessor';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import Checkbox from '../../Checkbox';
import { updateQueryParams } from '../../../utilities/UrlUtil';

const DisplayTab: React.FC = () => {
    const dispatch: Dispatch<any> = useDispatch();
    const vote = useSelector((state: AppState) => state.vote);
    const theme = useSelector((state: AppState) => state.theme);
    const contestants = useSelector((state: AppState) => state.contestants);

    const year = useSelector((state: AppState) => state.year);
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
                contestants,
                year,
                newVote
            );

            dispatch(
                setContestants(newContestants)
            )

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
                <h4 className="font-bold mb-[0.2em]">Show Votes</h4>

                <div className="mb-[0.5em] border-slate-700 border-y-[1px]">
                    <span className="flex items-center ml-2">
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
                        <span className="ml-5 text-sm">{'From'}</span>
                        <Dropdown
                            key="country-selector-2"
                            className="z-50 ml-4 min-w[6em] mx-auto mb-2"
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
                <h4 className="font-bold mb-[0.7em] mt-[0em]">Theme</h4>

                <div className="">
                    <Dropdown
                        key="theme-selector"
                        className="ml-5 z-50 w-30 mx-auto mb-3"
                        menuClassName=""
                        value={themeSelection}
                        onChange={(v) => onThemeInputChanged(v)}
                        options={['None', 'Auroral']}
                        showSearch={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default DisplayTab;