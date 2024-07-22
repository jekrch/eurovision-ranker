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
import { Field, Label, Switch } from '@headlessui/react';
import Ripples from 'react-ripples';
import classNames from 'classnames';

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
                <button key="first" onClick={() => handlePageChange(1)} className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
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
                    className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
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
                <button key="last" onClick={() => handlePageChange(totalPages)} className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
                    Last
                </button>
            );
        }

        return pageButtons;
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="flex justify-between items-center mb-4 px-4">
                <div className="w-[18em] inline-flex">
                    {!showSelected && <>
                    <TooltipHelp
                        tooltipContent='Search across all columns. To search for a phrase, enclose your search term in quotes "like this"'
                        className={classNames("-ml-3 mt-4 mr-3 pb-1")}
                    />
                    <div className={classNames("relative w-full mr-2")}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search..."
                            className="pl-10 pr-4 py-1 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-transparent text-slate-300 border-slate-400"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 mt-1" />
                    </div>
                    </>}
                </div>
                <Field>

                    <div className="flex items-center">
                        <Label className="ml-3 mr-6 mt-2 text-slate-300">{'Selected'}</Label>
                        <Switch
                            checked={showSelected}
                            onChange={setShowSelected}
                            className={`mt-2 ${showSelected ? 'bg-sky-600' : 'bg-slate-600'
                                } cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-600 mr-6`}
                        >
                            <span
                                className={`${showSelected ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>


                    </div>
                </Field>

                <Dropdown
                    value={pageSize?.toString() + ' per page'}
                    onChange={handlePageSizeChange}
                    options={[
                        `10`,
                        `25`,
                        `50`
                    ]}
                    buttonClassName='py-[1.1em]'
                    className="mr-4 mt-2 min-w-[8em] float-right"
                />
            </div>

            <div className="flex-grow overflow-auto !rounded-t-md !rounded-tr-md mr-1 shadow-xl">
                <table className="w-full bg-transparent">
                    <thead className="bg-slate-700 text-slate-300 sticky top-0 z-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                {showSelected ? 'Remove' : 'Add'}
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
                            <tr key={contestant.id} className="hover:bg-slate-800 bg-opacity-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Ripples placeholder={<></>}>
                                        <button
                                            onClick={() => handleToggleSelected(contestant.id)}
                                            className="text-slate-300 hover:text-slate-100 items-center p-3 -my-2 rounded-md"
                                        >
                                            {showSelected ? (
                                                <FontAwesomeIcon icon={faMinus} className="text-red-500 align-middle" />
                                            ) : selectedContestants.some(c => c.id === contestant.id) ? (
                                                <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                                            ) : (
                                                <FontAwesomeIcon icon={faPlus} className="" />
                                            )}
                                        </button>
                                    </Ripples>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{contestant.year}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{contestant.to_country}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{contestant.performer}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{contestant.song}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-between items-center px-4">
                <span className="text-sm text-gray-300">
                    {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, displayedContestants.length)} of {displayedContestants.length} rows
                </span>
                <div className="space-x-2">
                    {renderPageButtons()}
                </div>
            </div>
        </div>
    );
};

export default ContestantTable;