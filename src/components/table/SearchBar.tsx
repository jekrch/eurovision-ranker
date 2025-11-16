import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import TooltipHelp from '../TooltipHelp';
import classNames from 'classnames';

interface SearchBarProps {
    searchTerm: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    handleSearch,
    className
}) => {

    return (
        <div className={classNames("w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center", className)}>
            <TooltipHelp
                content='Search across all columns. To search for a phrase, enclose your search term in quotes "like this"'
                className="mt-2 mr-3 pb-1"
            />
            <div className="relative w-full mr-3">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search..."
                    className="text-sm w-full pl-10 pr-4 py-[0.4em] border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-transparent text-[var(--er-text-secondary)] border-[var(--er-border-primary)]"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--er-text-tertiary)]" />
            </div>
        </div>
    );
};

export default SearchBar;