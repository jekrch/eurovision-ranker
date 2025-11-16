import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

interface TableHeaderProps {
    handleSort: (column: string) => void;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    showSelected: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({ handleSort, sortColumn, sortDirection, showSelected }) => {
    // helper function to render sort icon
    const SortIcon = ({ column }: { column: string }) => {
        if (column === 'country') column = 'to_country';
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ?
            <FontAwesomeIcon icon={faSortUp} className="ml-2" /> :
            <FontAwesomeIcon icon={faSortDown} className="ml-2" />;
    };

    // array of column headers
    const columns = ['Year', 'Country', 'Performer', 'Song'];

    return (
        <thead className="bg-[var(--er-button-neutral-hover)] text-[var(--er-text-secondary)] sticky top-0 z-40">
            <tr>
                <th className="py-3 text-center text-xs font-medium uppercase tracking-wider sticky left-0 z-50 bg-[var(--er-button-neutral-hover)]">
                    {showSelected ? 'Del' : 'Add'}
                </th>
                {columns.map((header) => (
                    <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[var(--er-button-primary)]"
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