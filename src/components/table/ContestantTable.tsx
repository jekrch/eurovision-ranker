import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../redux/store';
import { ContestantRow } from './tableTypes';
import { changePageSize, filterTable, sortTable } from '../../redux/tableSlice';
import { useAppDispatch } from '../../utilities/hooks';
import { setTableCurrentPage, toggleSelectedContestant } from '../../redux/rootSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSortUp, faSortDown, faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons';
import Dropdown from '../Dropdown';
import TooltipHelp from '../TooltipHelp';

import Ripples from 'react-ripples';
import classNames from 'classnames';
import { Switch } from '../Switch';

const ContestantTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tableState } = useSelector((state: AppState) => state);
    const { sortColumn, sortDirection, filters, pageSize, currentPage, entries, selectedContestants } = tableState;
    const [searchTerm, setSearchTerm] = useState('');
    const [showSelected, setShowSelected] = useState(false);

    // apply sorting and filtering
    const sortedAndFilteredContestants = useMemo(() => {
        // use a Set to keep track of unique ids
        const uniqueIds = new Set<string>();
        let result = entries.filter(contestant => {
            if (uniqueIds.has(contestant.id)) {
                return false;
            }
            uniqueIds.add(contestant.id);
            return true;
        });

        // apply search filter
        if (searchTerm) {
            const isQuotedSearch = /^".*"$/.test(searchTerm.trim());
            const searchTerms = isQuotedSearch
                ? [searchTerm.trim().slice(1, -1).toLowerCase()]
                : searchTerm.toLowerCase().split(/\s+/);

            result = result.filter(contestant =>
                searchTerms.every(term =>
                    Object.entries(contestant).some(([key, value]) =>
                        key !== 'id' && String(value).toLowerCase().includes(term)
                    )
                )
            );
        }

        // apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                if (a[sortColumn as keyof ContestantRow] < b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? -1 : 1;
                if (a[sortColumn as keyof ContestantRow] > b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [entries, searchTerm, sortColumn, sortDirection]);

    // pagination logic
    const displayedContestants = showSelected ? selectedContestants : sortedAndFilteredContestants;
    const totalPages = Math.ceil(displayedContestants.length / pageSize);
    const paginatedContestants = displayedContestants.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // handler functions
    const handleSort = (column: string) => {
        if (column === 'country') {
            column = 'to_country'
        }
        dispatch(sortTable(column));
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        dispatch(filterTable({ search: event.target.value }));
    };

    const handlePageSizeChange = (value: string) => {
        dispatch(changePageSize(Number(value)));
    };

    const handlePageChange = (page: number) => {
        dispatch(setTableCurrentPage(page));
    };

    const handleToggleSelected = (id: string) => {
        dispatch(toggleSelectedContestant(id));
    };

    // SortIcon component
    const SortIcon = ({ column }: { column: string }) => {
        if (column === 'country') column = 'to_country';
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ?
            <FontAwesomeIcon icon={faSortUp} className="ml-2" /> :
            <FontAwesomeIcon icon={faSortDown} className="ml-2" />;
    };

    const renderPageButtons = () => {
        const pageButtons = [];
        const totalButtons = 5; // Number of page buttons to show
        let startPage, endPage;

        if (totalPages <= totalButtons) {
            // Show all pages if total pages are less than or equal to totalButtons
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calculate start and end page numbers
            const leftOffset = Math.floor(totalButtons / 2);
            const rightOffset = totalButtons - leftOffset - 1;

            if (currentPage <= leftOffset + 1) {
                startPage = 1;
                endPage = totalButtons;
            } else if (currentPage >= totalPages - rightOffset) {
                startPage = totalPages - totalButtons + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - leftOffset;
                endPage = currentPage + rightOffset;
            }
        }

        // Add "First" button
        if (currentPage > 1) {
            pageButtons.push(
                <button key="first" onClick={() => handlePageChange(1)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
                    First
                </button>
            );
        }

        // Add ellipsis if needed
        if (startPage > 1) {
            pageButtons.push(<span key="ellipsis1" className="px-3 py-1">...</span>);
        }

        // Add page number buttons
        for (let page = startPage; page <= endPage; page++) {
            pageButtons.push(
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 rounded ${currentPage === page ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm'}`}
                >
                    {page}
                </button>
            );
        }

        // Add ellipsis if needed
        if (endPage < totalPages) {
            pageButtons.push(<span key="ellipsis2" className="px-3 py-1">...</span>);
        }

        // Add "Last" button
        if (currentPage < totalPages) {
            pageButtons.push(
                <button key="last" onClick={() => handlePageChange(totalPages)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
                    Last
                </button>
            );
        }

        return pageButtons;
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-slate-300">
            <div className="flex flex-col mb-4 px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center">
                        {!showSelected && (
                            <>
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
                                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-transparent text-slate-300 border-slate-400"
                                    />
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mr-3 py-1">
                        <Switch 
                            label='Selected'
                            checked={showSelected} 
                            setChecked={setShowSelected}
                        />
                        <Dropdown
                            value={`${pageSize} per page`}
                            onChange={handlePageSizeChange}
                            options={['10', '25', '50']}
                            buttonClassName='py-2'
                            className="min-w-[8em] mt-[0.5em]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-auto !rounded-t-md !rounded-tr-md mr-1 shadow-xl">
                <div className="relative">
                    <table className="w-full bg-transparent table-fixed">
                        <colgroup>
                            <col className="w-[3em]" />
                            <col className="w-24" />
                            <col className="w-40" />
                            <col className="w-48" />
                            <col className="w-64" />
                        </colgroup>
                        <thead className="bg-slate-700 text-slate-300 sticky top-0 z-40">
                            <tr>
                                <th className="py-3 text-center text-xs font-medium uppercase tracking-wider sticky left-0 z-50 bg-slate-700">
                                    {showSelected ? 'Del' : 'Add'}
                                </th>
                                {['Year', 'Country', 'Performer', 'Song'].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-sky-800"
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
                        <tbody className="bg-transparent divide-y divide-gray-700">
                            {paginatedContestants.map((contestant) => (
                                <tr key={contestant.id} className="hover:bg-slate-800 bg-opacity-50 text-slate-300">
                                    <td className="py-0 whitespace-nowrap sticky left-0 z-30 bg-slate-900 hover:bg-sky-900">
                                        <div className="flex justify-center h-full">
                                            <Ripples className="flex items-center justify-center w-full h-full" placeholder={<></>}>
                                                <button
                                                    onClick={() => handleToggleSelected(contestant.id)}
                                                    className="text-slate-300 hover:text-slate-100 p-2 rounded-md h-full w-full" 
                                                >
                                                    {showSelected ? (
                                                        <FontAwesomeIcon icon={faMinus} className="text-red-500" />
                                                    ) : selectedContestants.some(c => c.id === contestant.id) ? (
                                                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    )}
                                                </button>
                                            </Ripples>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip">{contestant.to_country}</td>
                                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip" title={contestant.performer}>{contestant.performer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap overflow-x-clip" title={contestant.song}>{contestant.song}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center px-4">
                <span className="text-sm text-gray-300">
                    {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, displayedContestants.length)} of {displayedContestants.length} rows
                </span>
                <div className="space-x-2 space-y-2">
                    {renderPageButtons()}
                </div>
            </div>
        </div>
    );
};

export default ContestantTable;