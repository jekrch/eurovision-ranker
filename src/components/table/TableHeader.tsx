import { faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

interface TableHeaderProps {
  handleSort: (column: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  showSelected: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  handleSort,
  sortColumn,
  sortDirection,
  showSelected,
}) => {
  // helper function to render sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (column === 'country') column = 'to_country';
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <FontAwesomeIcon icon={faSortUp} className="ml-1.5 text-(--er-button-primary)" />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className="ml-1.5 text-(--er-button-primary)" />
    );
  };

  // array of column headers
  const columns = ['Year', 'Country', 'Performer', 'Song'];

  return (
    <thead className="bg-(--er-surface-tertiary) text-(--er-text-tertiary) sticky top-0 z-40">
      <tr className="shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
        <th className="py-3 text-center text-[0.7rem] font-semibold uppercase tracking-widest sticky left-0 z-50 bg-(--er-surface-tertiary)">
          {showSelected ? 'Del' : 'Add'}
        </th>
        {columns.map((header) => (
          <th
            key={header}
            className={classNames(
              'px-6 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors hover:bg-white/5 hover:text-(--er-text-primary)',
              {
                'text-(--er-text-primary)':
                  sortColumn === (header === 'Country' ? 'to_country' : header.toLowerCase()),
              },
            )}
            onClick={() => handleSort(header.toLowerCase())}
          >
            <div className="flex items-center whitespace-nowrap">
              {header}
              <SortIcon column={header.toLowerCase()} />
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
