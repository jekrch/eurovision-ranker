import { faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';
import Ripples from 'react-ripples';

import { ContestantRow } from './tableTypes';

interface TableBodyProps {
  paginatedContestants: ContestantRow[];
  handleToggleSelected: (id: string) => void;
  showSelected: boolean;
  selectedContestants: ContestantRow[];
}

const TableBody: React.FC<TableBodyProps> = ({
  paginatedContestants,
  handleToggleSelected,
  showSelected,
  selectedContestants,
}) => {
  return (
    <tbody className="bg-transparent divide-y divide-white/5">
      {paginatedContestants.map((contestant) => {
        const isSelected = !showSelected && selectedContestants.some((c) => c.id === contestant.id);
        return (
          <tr
            key={contestant.id}
            className={classNames(
              'group text-sm text-[var(--er-text-secondary)] transition-colors',
              isSelected
                ? 'bg-[var(--er-surface-accent-70)] hover:bg-[var(--er-surface-accent)]'
                : 'hover:bg-white/[0.04]',
            )}
          >
            <td
              className={classNames(
                'py-0 whitespace-nowrap sticky left-0 z-30 transition-colors',
                isSelected ? 'bg-[var(--er-surface-accent)]' : 'bg-[var(--er-card-surface-base)]',
              )}
            >
              <div className="flex justify-center h-full">
                <Ripples
                  className="flex items-center justify-center w-full h-full"
                  placeholder={<></>}
                >
                  <button
                    onClick={() => handleToggleSelected(contestant.id)}
                    aria-label={showSelected ? 'Remove' : isSelected ? 'Deselect' : 'Select'}
                    className="flex items-center justify-center p-2 h-full w-full focus:outline-none"
                  >
                    <span
                      className={classNames(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs ring-1 transition-colors',
                        showSelected
                          ? 'bg-[var(--er-accent-error)]/10 ring-[var(--er-accent-error)]/30 text-[var(--er-accent-error)] group-hover:bg-[var(--er-accent-error)]/20'
                          : isSelected
                            ? 'bg-[var(--er-accent-success)]/15 ring-[var(--er-accent-success)]/40 text-[var(--er-accent-success)]'
                            : 'bg-white/5 ring-white/10 text-[var(--er-text-tertiary)] group-hover:bg-[var(--er-button-primary)] group-hover:ring-transparent group-hover:text-white',
                      )}
                    >
                      {showSelected ? (
                        <FontAwesomeIcon icon={faMinus} />
                      ) : isSelected ? (
                        <FontAwesomeIcon icon={faCheck} />
                      ) : (
                        <FontAwesomeIcon icon={faPlus} />
                      )}
                    </span>
                  </button>
                </Ripples>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap overflow-x-clip tabular-nums text-[var(--er-text-tertiary)]">
              {contestant.year}
            </td>
            <td className="px-6 py-4 whitespace-nowrap overflow-x-clip font-medium text-[var(--er-text-primary)]">
              {contestant.to_country}
            </td>
            <td
              className="px-6 py-4 whitespace-nowrap overflow-x-clip"
              title={contestant.performer}
            >
              {contestant.performer}
            </td>
            <td className="px-6 py-4 whitespace-nowrap overflow-x-clip" title={contestant.song}>
              {contestant.song}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
};

export default TableBody;
