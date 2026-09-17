import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

import TooltipHelp from '../TooltipHelp';

interface SearchBarProps {
  searchTerm: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, handleSearch, className }) => {
  return (
    <div
      className={classNames(
        'w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center',
        className,
      )}
    >
      <TooltipHelp
        content='Search across all columns. To search for a phrase, enclose your search term in quotes "like this"'
        className="mt-2 mr-3 pb-1"
      />
      <div className="relative w-full mr-3 mt-1">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search..."
          className="block text-sm w-full pl-9 pr-4 py-[0.45em] rounded-lg bg-[var(--er-surface-tertiary-70)] text-[var(--er-text-primary)] placeholder-[var(--er-text-subtle)] ring-1 ring-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/50 transition-shadow"
        />
        <FontAwesomeIcon
          icon={faSearch}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--er-text-subtle)]"
        />
      </div>
    </div>
  );
};

export default SearchBar;
