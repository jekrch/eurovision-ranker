import classNames from 'classnames';
import React from 'react';

import { CountryContestant } from '../../../data/CountryContestant';
import { LazyLoadedFlag } from '../../LazyFlag';
import { eyebrow } from '../../modals/modalStyles';

interface SorterCompletionListProps {
  finalRanking: CountryContestant[];
}

/*
 * completion screen for the sorter: a header plus the scrollable,
 * medal-colored final ranking list.
 */
const SorterCompletionList: React.FC<SorterCompletionListProps> = ({
  finalRanking,
}) => {
  return (
    <>
      {/* Fixed header content */}
      <div className="flex-shrink-0 w-full flex flex-col items-center px-4 pt-3">
        <h4 className={classNames(eyebrow, 'mb-3')}>Your Complete Ranking</h4>
      </div>

      {/* Scrollable list */}
      {finalRanking.length > 0 && (
        <div className="w-full max-w-md mx-auto flex-1 min-h-0 overflow-y-auto px-6 pr-2 mb-4">
          <ol className="list-none p-0 m-0 space-y-2.5">
            {finalRanking.map((item, index) => {
              const rank = index + 1;
              // Medal colors for top 3
              let rankBoxColor = 'bg-[var(--er-surface-accent)]'; // default
              if (rank === 1)
                rankBoxColor = 'bg-[var(--er-interactive-primary)]'; // gold
              else if (rank === 2)
                rankBoxColor = 'bg-[var(--er-gradient-text-2)]'; // silver
              else if (rank === 3) rankBoxColor = 'bg-[var(--er-gradient-text-3)]'; // bronze

              return (
                <li
                  key={item.uid || index}
                  className="flex items-stretch bg-[var(--er-surface-accent-70)] rounded-xl ring-1 ring-inset ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_-2px_rgba(0,0,0,0.25)] overflow-hidden"
                >
                  {/* Rank box */}
                  <div
                    className={classNames(
                      'flex items-center justify-center min-w-[3.5rem] px-2 bg-gradient-to-b from-white/[0.12] to-black/[0.1] border-r border-black/20',
                      rankBoxColor,
                    )}
                  >
                    <span className="text-xl font-bold tabular-nums tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                      {rank}
                    </span>
                  </div>

                  {/* Flag box */}
                  <div className="flex items-center justify-center px-3 py-2">
                    {item.country?.key && (
                      <LazyLoadedFlag
                        code={item.country.key}
                        className="w-12 h-auto rounded-[3px] ring-1 ring-black/20 shadow-sm shadow-black/30"
                      />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col justify-center flex-1 px-4 py-2 min-w-0">
                    <span className="text-[var(--er-text-primary)] font-semibold truncate">
                      {item.contestant?.artist || 'Unknown Artist'}
                    </span>
                    {item.contestant?.song && (
                      <span className="text-sm text-[var(--er-text-tertiary)] truncate">
                        "{item.contestant.song}"
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Fixed footer text */}
      <p className="text-xs text-[var(--er-text-subtle)] flex-shrink-0 px-4 pb-4 text-center">
        You can go back to review choices, cancel, or apply this ranking.
      </p>
    </>
  );
};

export default SorterCompletionList;
