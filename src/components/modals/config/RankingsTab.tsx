import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../redux/types';
import { sortByVotes } from '../../../utilities/VoteProcessor';
import { getVoteCode, hasAnyJuryVotes, hasAnyTeleVotes } from '../../../utilities/VoteUtil';
import { fetchCountryContestantsByYear } from '../../../utilities/ContestantRepository';
import { sanitizeYear, supportedYears } from '../../../data/Contestants';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import IconButton from '../../IconButton';
import { goToUrl } from '../../../utilities/UrlUtil';

const RankingsTab: React.FC = () => {
    const year = useSelector((state: AppState) => state.year);
    const theme = useSelector((state: AppState) => state.theme);
    const [rankingYear, setRankingYear] = useState(year);
    const [voteSource, setVoteSource] = useState('All');
    const [voteSourceOptions, setVoteSourceOptions] = useState<string[]>([
        'All',
        ...countries.sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
    ]);
    const [hasJuryVotes, setHasJuryVotes] = useState(false);
    const [hasTeleVotes, setHasTeleVotes] = useState(false);

    // Update vote source options based on the selected year
    useEffect(() => {
        const updateVoteSourceOptions = async () => {
            const yearContestants = await fetchCountryContestantsByYear(rankingYear);

            setVoteSourceOptions([
                'All',
                ...yearContestants.map((cc) => cc.country).sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name),
            ]);
            setHasTeleVotes(hasAnyTeleVotes(yearContestants));
            setHasJuryVotes(hasAnyJuryVotes(yearContestants));
        };
        updateVoteSourceOptions();
    }, [rankingYear]);

    // Get sorted ranking code based on the selected year, vote type, round, and vote source
    const getSortedRankingCode = async (voteYear: string, voteType: string, round: string, voteSource?: string) => {
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

        let countryContestants = await fetchCountryContestantsByYear(voteYear, voteCode);

        if (sanitizeYear(year) === '1956') {
            return countryContestants.filter((cc) => cc.contestant?.finalsRank!.toString() === '1').map((cc) => cc.id).join('');
        }

        countryContestants = await sortByVotes(countryContestants, voteYear, voteType, round, sourceCountryKey);
        const sortedContestants = countryContestants.filter((cc) => cc?.contestant?.votes !== undefined);

        return sortedContestants.map((cc) => cc.id).join('');
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
        return `+from+${sourceCountry.replaceAll(' ', '+')}`;
    };

    return (
        <div className="mb-0">
            <p className="relative mb-[1em] mt-2 text-sm">
                Select a year and voting country, then click one of the buttons to see official final rankings
            </p>
            <div className="mt-5">
                <span className="font-bold ml-0 whitespace-nowrap">ESC final rankings</span>
                <div className="relative mt-[0.7em]">
                    <div>
                        <Dropdown
                            className="z-50 w-20 mx-auto mb-2"
                            menuClassName=""
                            value={rankingYear ?? year}
                            onChange={(y) => setRankingYear(y)}
                            options={supportedYears.filter((i) => i !== '2020')}
                            showSearch={true}
                        />
                        <span className="ml-2 text-sm">{'from'}</span>

                        <Dropdown
                            key="country-selector"
                            className="z-50 ml-3 mx-auto mb-2"
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
        </div>
    );
};

export default RankingsTab;