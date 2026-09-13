import { faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

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
    <tbody className="bg-transparent divide-y divide-gray-700">
      {paginatedContestants.map((contestant) => {
        const isSelected = !showSelected && selectedContestants.some((c) => c.id === contestant.id);
        return (
          <tr
            key={contestant.id}
            className={classNames(
              'text-[var(--er-text-secondary)] transition-colors',
              isSelected
                ? 'bg-[var(--er-surface-accent-70)] hover:bg-[var(--er-surface-accent)]'
                : 'bg-opacity-50 hover:bg-[var(--er-surface-dark)]',
            )}
          >
            <td
              className={classNames(
                'py-0 whitespace-nowrap sticky left-0 z-30',
                isSelected
                  ? 'bg-[var(--er-surface-accent)] hover:bg-[var(--er-button-primary)]'
                  : 'bg-[var(--er-surface-dark)] hover:bg-[var(--er-button-primary)]',
              )}
            >
              <div className="flex justify-center h-full">
                <button
                  onClick={() => handleToggleSelected(contestant.id)}
                  aria-label={showSelected ? 'Remove from selection' : 'Add to selection'}
                  className="text-content-secondary hover:text-slate-100 p-2 rounded-md h-full w-full transition-colors duration-fast ease-out"
                >
                  {showSelected ? (
                    <FontAwesomeIcon icon={faMinus} className="text-accent-error" />
                  ) : isSelected ? (
                    <FontAwesomeIcon icon={faCheck} className="text-accent-success" />
                  ) : (
                    <FontAwesomeIcon icon={faPlus} />
                  )}
                </button>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.year}</td>
            <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.to_country}</td>
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
