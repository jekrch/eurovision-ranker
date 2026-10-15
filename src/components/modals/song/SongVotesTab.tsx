import React from 'react';

import { RoundVotes, SortKey, isPresent, toNumber } from './songModalUtils';
import { countries } from '../../../data/Countries';
import { Vote } from '../../../data/Vote';
import { LazyLoadedFlag } from '../../LazyFlag';

type SortableHeaderProps = {
  sortKeyName: SortKey;
  label: string;
  align: 'left' | 'right';
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({
  sortKeyName,
  label,
  align,
  sortKey,
  sortDir,
  onSort,
}) => {
  const active = sortKey === sortKeyName;
  return (
    <th
      className={`font-semibold pb-2 ${align === 'right' ? 'text-right pl-3' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKeyName)}
        className={`inline-flex items-center gap-1 leading-none uppercase tracking-wide select-none hover:text-(--er-text-secondary) ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-(--er-text-secondary)' : ''}`}
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
}) => {
  // Header and rows are separate tables so only the rows scroll. Both use a
  // fixed layout with the same colgroup, and both wrappers reserve the same
  // scrollbar gutter, so the columns line up.
  const colgroup = (
    <colgroup>
      <col />
      {hasJuryTeleSplit && (
        <>
          <col className="w-[4.5em]" />
          <col className="w-[4.5em]" />
        </>
      )}
      <col className="w-[5em]" />
    </colgroup>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col mt-[1em]">
      {roundVotes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {roundVotes.map(({ round }) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`rounded-md px-3 py-[0.3em] text-xs font-medium border-[0.1em] transition-colors ${
                selectedRound === round
                  ? 'bg-(--er-interactive-secondary) border-(--er-border-tertiary) text-(--er-text-secondary)'
                  : 'bg-(--er-surface-tertiary-70) border-(--er-border-tertiary) text-(--er-text-muted) hover:text-(--er-text-secondary)'
              }`}
            >
              {round.replaceAll('-', ' ')}
            </button>
          ))}
        </div>
      )}

      {activeRoundVotes.length ? (
        <>
          <div className="overflow-hidden pr-4 -mr-4 scrollbar-gutter-stable">
            <table className="w-full table-fixed text-sm">
              {colgroup}
              <thead>
                <tr className="text-(--er-text-muted) uppercase tracking-wide text-xs">
                  <SortableHeader
                    sortKeyName="from"
                    label="From"
                    align="left"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  {hasJuryTeleSplit && (
                    <>
                      <SortableHeader
                        sortKeyName="jury"
                        label="Jury"
                        align="right"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortableHeader
                        sortKeyName="tele"
                        label="Tele"
                        align="right"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                    </>
                  )}
                  <SortableHeader
                    sortKeyName="total"
                    label="Total"
                    align="right"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                </tr>
              </thead>
            </table>
          </div>

          <div className="flex-1 min-h-0 overflow-auto pr-4 -mr-4 scrollbar-gutter-stable">
            <table className="w-full table-fixed text-sm">
              {colgroup}
              <tbody>
                {sortedVotes.map((vote) => {
                  const fromCountry = countries.find((c) => c.key === vote.fromCountryKey);
                  return (
                    <tr key={vote.fromCountryKey} className="border-t border-(--er-border-secondary)">
                      <td className="py-[0.45em]">
                        <span className="inline-flex items-center gap-2 min-w-0 max-w-full">
                          <LazyLoadedFlag code={vote.fromCountryKey} className="w-5 flag-icon shrink-0" />
                          <span className="text-(--er-text-secondary) truncate">
                            {fromCountry?.name ?? vote.fromCountryKey.toUpperCase()}
                          </span>
                        </span>
                      </td>
                      {hasJuryTeleSplit && (
                        <>
                          <td className="text-right pl-3 text-(--er-text-muted) tabular-nums">
                            {isPresent(vote.juryPoints) ? toNumber(vote.juryPoints) : '–'}
                          </td>
                          <td className="text-right pl-3 text-(--er-text-muted) tabular-nums">
                            {isPresent(vote.telePoints) ? toNumber(vote.telePoints) : '–'}
                          </td>
                        </>
                      )}
                      <td className="text-right pl-3 font-semibold text-(--er-text-secondary) tabular-nums">
                        {toNumber(vote.totalPoints)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="mt-[1.5em] text-center text-sm text-(--er-text-muted) italic">
          Voting results not available
        </div>
      )}
    </div>
  );
};

export default SongVotesTab;
