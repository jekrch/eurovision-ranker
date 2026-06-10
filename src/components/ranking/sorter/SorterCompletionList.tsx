import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

import { CountryContestant } from '../../../data/CountryContestant';
import { LazyLoadedFlag } from '../../LazyFlag';

interface SorterCompletionListProps {
  totalComparisons: number;
  finalRanking: CountryContestant[];
}

/*
 * completion screen for the sorter: a confirmation header plus the scrollable,
 * medal-colored final ranking list.
 */
const SorterCompletionList: React.FC<SorterCompletionListProps> = ({
  totalComparisons,
  finalRanking,
}) => {
  return (
    <>
      {/* Fixed header content */}
      <div className="flex-shrink-0 w-full flex flex-col items-center px-4">
        <FontAwesomeIcon
          icon={faCheckCircle}
          className="text-4xl text-[#119822]x text-[var(--er-accent-success)] mb-3"
        />
        <p className="mb-2 text-[var(--er-text-secondary)] text-sm">
          Your ranking is ready based on {totalComparisons} choices!
        </p>
        <h4 className="text-md font-semibold text-[var(--er-text-secondary)] mb-3">
          Your Complete Ranking:
        </h4>
      </div>

      {/* Scrollable list */}
      {finalRanking.length > 0 && (
        <div className="w-full max-w-md mx-auto flex-1 min-h-0 overflow-y-auto px-6 pr-2 mb-4">
          <ol className="list-none p-0 m-0 space-y-3">
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
                  className="flex items-stretch bg-[var(--er-surface-accent-70)] rounded-lg ring-1 ring-white/5 shadow-sm overflow-hidden"
                >
                  {/* Rank box */}
                  <div
                    className={classNames(
                      'flex items-center justify-center min-w-[3.5rem] px-2',
                      rankBoxColor,
                    )}
                  >
                    <span className="text-xl font-bold text-white">{rank}</span>
                  </div>

                  {/* Flag box */}
                  <div className="flex items-center justify-center px-3 py-2">
                    {item.country?.key && (
                      <LazyLoadedFlag code={item.country.key} className="w-12 h-auto rounded-sm" />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col justify-center flex-1 px-4 py-2 min-w-0">
                    <span className="text-[var(--er-text-primary)] font-semibold truncate">
                      {item.contestant?.artist || 'Unknown Artist'}
                    </span>
                    {item.contestant?.song && (
                      <span className="text-sm text-[var(--er-text-secondary)] truncate">
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
      <p className="text-sm text-[var(--er-text-tertiary)] flex-shrink-0 px-4 pb-4 text-center">
        You can go back to review choices, cancel, or apply this ranking.
      </p>
    </>
  );
};

export default SorterCompletionList;
