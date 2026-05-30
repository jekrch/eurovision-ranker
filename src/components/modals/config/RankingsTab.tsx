import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faGlobe,
    faMobileScreenButton,
    faGavel,
    faFlag,
    faList,
    faStar,
} from '@fortawesome/free-solid-svg-icons';
import { AppState } from '../../../redux/store';
import { sortByVotes } from '../../../utilities/VoteProcessor';
import { getVoteCode, hasAnyJuryVotes, hasAnyTeleVotes } from '../../../utilities/VoteUtil';
import { fetchCountryContestantsByYear, getContestantsByCountry } from '../../../utilities/ContestantRepository';
import { sanitizeYear, supportedYears } from '../../../data/Contestants';
import { countries } from '../../../data/Countries';
import Dropdown from '../../Dropdown';
import { goToUrl } from '../../../utilities/UrlUtil';
import TooltipHelp from '../../TooltipHelp';
import { useAppSelector } from '../../../hooks/stateHooks';
import { Contestant } from '../../../data/Contestant';

// Shared styling tokens — kept in sync with the modern GroupsTab look.
const sectionLabel =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--er-text-subtle)]';
const fieldLabel = 'text-xs text-[var(--er-text-subtle)]';
const primaryBtn =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors';
const sectionCard =
    'rounded-lg bg-[var(--er-button-neutral)]/15 ring-1 ring-white/5 overflow-hidden';
const headerBar =
    'flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[var(--er-button-neutral)]/15';

const RankingsTab: React.FC = () => {
    const year = useAppSelector((state: AppState) => state.year);
    const theme = useAppSelector((state: AppState) => state.theme);
    const [rankingYear, setRankingYear] = useState(year !== '2026' ? year : '2025');
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
        <div className="text-sm space-y-4">
            <p className="text-xs leading-relaxed text-[var(--er-text-tertiary)]">
                Generate official rankings for a contest year, or browse every contestant a country has sent.
            </p>

            {/* ESC final rankings */}
            <section className={sectionCard}>
                <div className={headerBar}>
                    <FontAwesomeIcon icon={faTrophy} className="text-[var(--er-button-primary)] text-xs shrink-0" />
                    <h3 className={sectionLabel}>ESC final rankings</h3>
                    <TooltipHelp
                        content="Select a year and voting country, then choose a vote source to see the official final ranking"
                        className="z-50"
                    />
                </div>

                <div className="p-4">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 mb-3.5">
                    <span className={fieldLabel}>Year</span>
                    <Dropdown
                        className="w-20"
                        menuClassName=""
                        value={rankingYear ?? year}
                        onChange={(y) => setRankingYear(y)}
                        options={supportedYears.filter((i) => i !== '2020' && i !== '2026')}
                        showSearch={true}
                    />
                    <span className={fieldLabel}>from</span>
                    <Dropdown
                        key="country-selector"
                        className="min-w-[7rem]"
                        menuClassName="w-auto"
                        value={voteSource}
                        onChange={(s) => setVoteSource(s)}
                        options={voteSourceOptions}
                        showSearch={true}
                    />
                    <TooltipHelp
                        content="Choose which country to display voting counts from. 'All' shows the total vote count"
                        className="z-50"
                    />
                </div>

                {rankingYear === '2026' ? (
                    <p className="text-xs italic text-[var(--er-text-subtle)]">
                        No voting data available yet for 2026.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={openTotalRanking} className={primaryBtn}>
                            <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                            Total
                        </button>
                        {hasTeleVotes && (
                            <button type="button" onClick={openTotalTelevoteRanking} className={primaryBtn}>
                                <FontAwesomeIcon icon={faMobileScreenButton} className="text-xs" />
                                Televote
                            </button>
                        )}
                        {hasJuryVotes && (
                            <button type="button" onClick={openTotalJuryRanking} className={primaryBtn}>
                                <FontAwesomeIcon icon={faGavel} className="text-xs" />
                                Jury
                            </button>
                        )}
                    </div>
                )}
                </div>
            </section>

            {/* Contestants by country */}
            <section className={sectionCard}>
                <div className={headerBar}>
                    <FontAwesomeIcon icon={faFlag} className="text-[var(--er-button-primary)] text-xs shrink-0" />
                    <h3 className={sectionLabel}>Contestants by country</h3>
                    <TooltipHelp
                        content="Display all past and current contestants for a specific country"
                        className="z-50"
                    />
                </div>

                <div className="p-4">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 mb-3.5">
                    <Dropdown
                        key="country-selector"
                        className="min-w-[7rem]"
                        menuClassName="w-auto"
                        value={contestantCountry}
                        onChange={(s) => setContestantCountry(s)}
                        options={contestantCountries}
                        showSearch={true}
                    />
                    <span className={fieldLabel}>order by</span>
                    <Dropdown
                        key="country-order-selector"
                        className="min-w-[5rem]"
                        menuClassName="w-auto"
                        value={contestantCountryOrder}
                        onChange={(s) => setContestantCountryOrder(s)}
                        options={['Year', 'Rank']}
                        showSearch={false}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => openAllContestantsByCountry()}
                        className={primaryBtn}
                        disabled={!contestantCountry}
                    >
                        <FontAwesomeIcon icon={faList} className="text-xs" />
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => openAllContestantsByCountry(true)}
                        className={primaryBtn}
                        disabled={!contestantCountry}
                    >
                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                        Finalists
                    </button>
                </div>
                </div>
            </section>
        </div>
    );
};

export default RankingsTab;