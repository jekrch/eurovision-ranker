import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import TooltipHelp from '../TooltipHelp';
import { Switch } from '../Switch';

interface SearchBarProps {
    searchTerm: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    globalSearch: boolean;
    updateGlobalSearch: (checked: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    handleSearch,
    globalSearch,
    updateGlobalSearch
}) => {
    return (
        <div className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center">
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
                    className="text-sm w-full pl-10 pr-4 py-[0.4em] border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-transparent text-slate-300 border-slate-400"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex items-center justify-center py-1 px-0">
                <TooltipHelp
                    content="Uncheck this to use the simple year-based selection mode"
                    className="text-slate-300 align-middle mb-1 -mr-1"
                />
                <Switch
                    label="adv"
                    className="items-center align-middle"
                    labelClassName="text-base text-slate-400"
                    checked={globalSearch}
                    setChecked={updateGlobalSearch}
                />
            </div>
        </div>
    );
};

export default SearchBar;