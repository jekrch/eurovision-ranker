import React, { useEffect, useState } from 'react';
import { AppState } from '../../../redux/store';
import { sortByVotes } from '../../../utilities/VoteProcessor';
import { getVoteCode, hasAnyJuryVotes, hasAnyTeleVotes } from '../../../utilities/VoteUtil';
import { fetchCountryContestantsByYear, getContestantsByCountry } from '../../../utilities/ContestantRepository';
import { sanitizeYear, supportedYears } from '../../../data/Contestants';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import IconButton from '../../IconButton';
import { goToUrl } from '../../../utilities/UrlUtil';
import TooltipHelp from '../../TooltipHelp';
import { useAppSelector } from '../../../hooks/stateHooks';
import { Contestant } from '../../../data/Contestant';

const RankingsTab: React.FC = () => {
    const year = useAppSelector((state: AppState) => state.year);
    const theme = useAppSelector((state: AppState) => state.theme);
    const [rankingYear, setRankingYear] = useState(year);
    const [voteSource, setVoteSource] = useState('All');
    const [voteSourceOptions, setVoteSourceOptions] = useState<string[]>([
        'All',
        ...countries.sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
    ]);
    const [hasJuryVotes, setHasJuryVotes] = useState(false);
    const [hasTeleVotes, setHasTeleVotes] = useState(false);

    const [contestantCountries, setContestantCountries] = useState<string[]>([
        '',
        ...countries.sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
    ]);
    const [contestantCountry, setContestantCountry] = useState('');
    const [contestantCountryOrder, setContestantCountryOrder] = useState('Year');
    // Update vote source options based on the selected year
    useEffect(() => {
        const updateVoteSourceOptions = async () => {

            const yearContestants = await fetchCountryContestantsByYear(rankingYear, undefined);

            setVoteSourceOptions([
                'All',
                ...yearContestants.map((cc) => cc.country).sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
            ]);
            setHasTeleVotes(hasAnyTeleVotes(yearContestants));
            setHasJuryVotes(hasAnyJuryVotes(yearContestants));
        };
        updateVoteSourceOptions();
    }, [rankingYear]);
   
    /**
     * Get sorted ranking code based on the selected year, vote type, round, and vote source
     * 
     * @param voteYear 
     * @param voteType 
     * @param round 
     * @param voteSource 
     * @returns 
     */
    const getSortedRankingCode = async (
        voteYear: string, voteType: string, 
        round: string, voteSource?: string
    ) => {
        let voteCode = undefined;
        let sourceCountryKey = undefined;

        if (voteSource?.length && voteSource !== 'All') {
            sourceCountryKey = countries.find((c) => c.name === voteSource)?.key;
            if (!sourceCountryKey) {
                console.error('Unable to find vote source: ' + voteSource);
            } else {
                voteCode = `${round}-${voteType}-${sourceCountryKey}`;
            }
        }

        let countryContestants = await fetchCountryContestantsByYear(
            voteYear, voteCode
        );

        if (sanitizeYear(year) === '1956') {
            return countryContestants.filter((cc) => 
                cc.contestant?.finalsRank!.toString() === '1'
            ).map((cc) => cc.id)
            .join('');
        }

        countryContestants = await sortByVotes(
            countryContestants, voteType,
             round, sourceCountryKey
        );
        const sortedContestants = countryContestants.filter(
            (cc) => cc?.contestant?.votes !== undefined
        );

        return sortedContestants.map((cc) => cc.id).join('');
    };

    // Open total ranking based on the selected year and vote source
    const openAllContestantsByCountry = async (onlyFinalists: boolean = false) => {
        let contestants: Contestant[] = await getContestantsByCountry(contestantCountry);

        if (onlyFinalists) {
            contestants = contestants.filter((cc) => cc.finalsRank);
        }

        switch (contestantCountryOrder) {
            case 'Year':
                contestants = contestants.sort(
                    (cc1, cc2) => Number(cc2.year) - Number(cc1.year)
                );
                break;
            case 'Rank':
                contestants = contestants.sort((cc1, cc2) => {
                    // no rank should be last
                    if (!cc1.finalsRank && !cc2.finalsRank) return 0;
                    if (!cc1.finalsRank) return 1;
                    if (!cc2.finalsRank) return -1;
                    
                    // lower rank first
                    return Number(cc1.finalsRank) - Number(cc2.finalsRank);
                  });
                break
        }

        const concatenatedIds = contestants.map((cc) => cc.id).join('');
        
        const displayStr = (contestantCountryOrder === 'Rank') ? 'pl=t&' : '';

        goToUrl(
            `?r=>${concatenatedIds}&` +
            `g=t&` +
            displayStr +
            `n=${encodeURIComponent(contestantCountry)}&`, //+
            //`v=${getVoteCode('f', 't', voteSource)}`,
            theme
        );
    };

    // Open total ranking based on the selected year and vote source
    const openTotalRanking = async () => {
        const voteYear = rankingYear ?? year;
        const concatenatedIds = await getSortedRankingCode(voteYear, 'total', 'final', voteSource);
        goToUrl(
            `?r=${concatenatedIds}&` +
            `y=${voteYear.substring(2, 4)}&` +
            `n=Final${getSourceCountryPostfix(voteSource)}&` +
            `v=${getVoteCode('f', 't', voteSource)}`,
            theme
        );
    };

    // Open total televote ranking based on the selected year and vote source
    const openTotalTelevoteRanking = async () => {
        const rankCode = await getTotalTelevoteRankingCode(voteSource);
        goToUrl(rankCode, theme);
    };

    // Open total jury ranking based on the selected year and vote source
    const openTotalJuryRanking = async () => {
        const rankCode = await getTotalJuryRankingCode(voteSource);
        goToUrl(rankCode, theme);
    };

    // Get total televote ranking code based on the selected year and vote source
    const getTotalTelevoteRankingCode = async (voteSource: string) => {
        const voteYear = rankingYear ?? year;
        const concatenatedIds = await getSortedRankingCode(voteYear, 'televote', 'final', voteSource);
        return (
            `?r=${concatenatedIds}&` +
            `y=${voteYear.substring(2, 4)}&` +
            `n=Final+Televote${getSourceCountryPostfix(voteSource)}&` +
            `v=${getVoteCode('f', 'tv', voteSource)}`
        );
    };

    // Get total jury ranking code based on the selected year and vote source
    const getTotalJuryRankingCode = async (voteSource: string) => {
        const voteYear = rankingYear ?? year;
        const concatenatedIds = await getSortedRankingCode(voteYear, 'jury', 'final', voteSource);
        return (
            `?r=${concatenatedIds}&` +
            `y=${voteYear.substring(2, 4)}&` +
            `n=Final+Jury${getSourceCountryPostfix(voteSource)}&` +
            `v=${getVoteCode('f', 'j', voteSource)}`
        );
    };

    // Get source country postfix based on the selected vote source
    const getSourceCountryPostfix = (sourceCountry?: string) => {
        if (!sourceCountry?.length || sourceCountry === 'All') {
            return '';
        }
        return `+from+${encodeURIComponent(sourceCountry).replaceAll(' ', '+')}`;
    };

    return (
        <div className="mb-0">
            <p className="relative mb-[1em] mt-2 text-sm">
                Generate rankings based on selected year, or see all contestants for a selected country.
            </p>
            <div className="mt-5">
                <span className="font-bold ml-0 whitespace-nowrap">ESC final rankings</span>               
                <TooltipHelp
                    content="Select a year and voting country, then click one of the buttons to see official final rankings"
                    className="ml-0 z-50"
                />
                <div className=" mt-[0.7em]">
                    <div>
                        <Dropdown
                            className="w-22 mx-auto mb-2"
                            menuClassName=""
                            value={rankingYear ?? year}
                            onChange={(y) => setRankingYear(y)}
                            options={supportedYears.filter((i) => i !== '2020' && i !== '2025')}
                            showSearch={true}
                        />
                        <span className="ml-2 text-sm">from</span>
                        <TooltipHelp
                            content="Choose which country to display voting counts from. 'All' will show the total vote count"
                            className="ml-4 z-50"
                        />
                        <Dropdown
                            key="country-selector"
                            className="ml-3 mx-auto mb-2"
                            menuClassName="w-auto"
                            value={voteSource}
                            onChange={(s) => setVoteSource(s)}
                            options={voteSourceOptions}
                            showSearch={true}
                        />
                    </div>

                    <div className="mt-2 ml-0">
                        <span className="">
                            <IconButton
                                onClick={openTotalRanking}
                                className="pl-[1em] pr-[1em] rounded-md"
                                title="total"
                            />
                            {hasTeleVotes && (
                                <IconButton
                                    onClick={openTotalTelevoteRanking}
                                    className="ml-3 pl-[1em] pr-[1em] rounded-md"
                                    title="televote"
                                />
                            )}
                            {hasJuryVotes && (
                                <IconButton
                                    onClick={openTotalJuryRanking}
                                    className="ml-3 pl-[1em] pr-[1em] rounded-md"
                                    title="jury"
                                />
                            )}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-5">
                <span className="font-bold ml-0 whitespace-nowrap">Contestants by country </span>                        
                    <TooltipHelp
                        content="Display all past and current contestants for a specific country"
                        className="ml-0 z-50"
                    />
                <div className=" mt-[0.7em]">
                    <div>
                       <div>
                        <Dropdown
                            key="country-selector"
                            className="mx-auto mb-2 min-w-[5em]"
                            menuClassName="w-auto"
                            value={contestantCountry}
                            onChange={(s) => setContestantCountry(s)}
                            options={contestantCountries}
                            showSearch={true}
                        /> 
                        <span className="mx-2">order by</span> 
                        <Dropdown
                            key="country-order-selector"
                            className="mx-auto mb-2 min-w-[5em]"
                            menuClassName="w-auto"
                            value={contestantCountryOrder}
                            onChange={(s) => setContestantCountryOrder(s)}
                            options={['Year', 'Rank']}
                            showSearch={false}
                        />
                        </div>
                        <div className="mt-2 -ml-4">
                            <IconButton
                                onClick={openAllContestantsByCountry}
                                className="ml-4 pl-[1em] pr-[1em] rounded-md"
                                title="all"
                                disabled={!contestantCountry}
                            />
                            <IconButton
                                onClick={() => openAllContestantsByCountry(true)}
                                className="ml-4 pl-[1em] pr-[1em] rounded-md"
                                title="finalists"
                                disabled={!contestantCountry}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankingsTab;