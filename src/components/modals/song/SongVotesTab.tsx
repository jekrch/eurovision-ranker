import React from 'react';
import { Vote } from '../../../data/Vote';
import { countries } from '../../../data/Countries';
import { LazyLoadedFlag } from '../../LazyFlag';
import { RoundVotes, SortKey, isPresent, toNumber } from './songModalUtils';

type SortableHeaderProps = {
    sortKeyName: SortKey;
    label: string;
    align: 'left' | 'right';
    width?: string;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({
    sortKeyName, label, align, width, sortKey, sortDir, onSort,
}) => {
    const active = sortKey === sortKeyName;
    return (
        <th className={`font-semibold pb-2 ${align === 'right' ? 'text-right' : 'text-left'} ${width ?? ''}`}>
            <button
                type="button"
                onClick={() => onSort(sortKeyName)}
                className={`inline-flex items-center gap-1 leading-none uppercase tracking-wide select-none hover:text-[var(--er-text-secondary)] ${
                    align === 'right' ? 'flex-row-reverse' : ''
                } ${active ? 'text-[var(--er-text-secondary)]' : ''}`}
                aria-label={`Sort by ${label}`}
            >
                <span>{label}</span>
                {/* glyph is always rendered so the header never shifts; only its visibility changes */}
                <span
                    className={`text-[0.6em] leading-none transition-opacity duration-150 ${
                        active ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {sortDir === 'asc' ? '▲' : '▼'}
                </span>
            </button>
        </th>
    );
};

type SongVotesTabProps = {
    roundVotes: RoundVotes[];
    selectedRound: string;
    setSelectedRound: (round: string) => void;
    activeRoundVotes: Vote[];
    hasJuryTeleSplit: boolean;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
    sortedVotes: Vote[];
};

const SongVotesTab: React.FC<SongVotesTabProps> = ({
    roundVotes,
    selectedRound,
    setSelectedRound,
    activeRoundVotes,
    hasJuryTeleSplit,
    sortKey,
    sortDir,
    onSort,
    sortedVotes,
}) => (
    <div className="flex-1 min-h-0 overflow-auto pr-4 -mr-4 mt-[1em] [scrollbar-gutter:stable]">
        {roundVotes.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
                {roundVotes.map(({ round }) => (
                    <button
                        key={round}
                        onClick={() => setSelectedRound(round)}
                        className={`rounded-md px-3 py-[0.3em] text-xs font-medium border-[0.1em] transition-colors ${
                            selectedRound === round
                                ? 'bg-[var(--er-interactive-secondary)] border-[var(--er-border-tertiary)] text-[var(--er-text-secondary)]'
                                : 'bg-[var(--er-surface-tertiary-70)] border-[var(--er-border-tertiary)] text-[var(--er-text-muted)] hover:text-[var(--er-text-secondary)]'
                        }`}
                    >
                        {round.replaceAll('-', ' ')}
                    </button>
                ))}
            </div>
        )}

        {activeRoundVotes.length ? (
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[var(--er-text-muted)] uppercase tracking-wide text-xs">
                        <SortableHeader sortKeyName="from" label="From" align="left" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                        {hasJuryTeleSplit && (
                            <>
                                <SortableHeader sortKeyName="jury" label="Jury" align="right" width="w-[3.5em]" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                                <SortableHeader sortKeyName="tele" label="Tele" align="right" width="w-[3.5em]" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                            </>
                        )}
                        <SortableHeader sortKeyName="total" label="Total" align="right" width="w-[3.5em]" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                    </tr>
                </thead>
                <tbody>
                    {sortedVotes.map((vote) => {
                        const fromCountry = countries.find(c => c.key === vote.fromCountryKey);
                        return (
                            <tr
                                key={vote.fromCountryKey}
                                className="border-t border-[var(--er-border-secondary)]"
                            >
                                <td className="py-[0.45em]">
                                    <span className="inline-flex items-center gap-2">
                                        <LazyLoadedFlag
                                            code={vote.fromCountryKey}
                                            className="w-5 flag-icon shrink-0"
                                        />
                                        <span className="text-[var(--er-text-secondary)]">
                                            {fromCountry?.name ?? vote.fromCountryKey.toUpperCase()}
                                        </span>
                                    </span>
                                </td>
                                {hasJuryTeleSplit && (
                                    <>
                                        <td className="text-right text-[var(--er-text-muted)]">
                                            {isPresent(vote.juryPoints) ? toNumber(vote.juryPoints) : '–'}
                                        </td>
                                        <td className="text-right text-[var(--er-text-muted)]">
                                            {isPresent(vote.telePoints) ? toNumber(vote.telePoints) : '–'}
                                        </td>
                                    </>
                                )}
                                <td className="text-right font-semibold text-[var(--er-text-secondary)]">
                                    {toNumber(vote.totalPoints)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        ) : (
            <div className="mt-[1.5em] text-center text-sm text-[var(--er-text-muted)] italic">
                Voting results not available
            </div>
        )}
    </div>
);

export default SongVotesTab;
