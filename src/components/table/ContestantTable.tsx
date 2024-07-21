import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../redux/store';
import { ContestantRow } from './tableTypes';
import { changePageSize, filterTable, sortTable } from '../../redux/tableSlice';
import { useAppDispatch } from '../../utilities/hooks';
import { setTableCurrentPage } from '../../redux/rootSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

const ContestantTable: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tableState } = useSelector((state: AppState) => state);
    const { sortColumn, sortDirection, filters, pageSize, currentPage, entries } = tableState;
    const [searchTerm, setSearchTerm] = useState('');

    // Apply sorting and filtering
    const sortedAndFilteredContestants = React.useMemo(() => {
        let result = [...entries];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(contestant => 
                Object.values(contestant).some(value => 
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                if (a[sortColumn as keyof ContestantRow] < b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? -1 : 1;
                if (a[sortColumn as keyof ContestantRow] > b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [entries, searchTerm, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(sortedAndFilteredContestants.length / pageSize);
    const paginatedContestants = sortedAndFilteredContestants.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleSort = (column: string) => {
        dispatch(sortTable(column));
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        dispatch(filterTable({ search: event.target.value }));
    };

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(changePageSize(Number(event.target.value)));
    };

    const handlePageChange = (page: number) => {
        dispatch(setTableCurrentPage(page));
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? 
            <FontAwesomeIcon icon={faSortUp} className="ml-1" /> : 
            <FontAwesomeIcon icon={faSortDown} className="ml-1" />;
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
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <select 
                    value={pageSize} 
                    onChange={handlePageSizeChange}
                    className="border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                </select>
            </div>
            <div className="flex-grow overflow-auto">
                <table className="w-full bg-transparent">
                    <thead className="bg-gray-800 text-white sticky top-0">
                        <tr>
                            {['Year', 'Country', 'Performer', 'Song'].map((header) => (
                                <th 
                                    key={header} 
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                    onClick={() => handleSort(header.toLowerCase())}
                                >
                                    {header} <SortIcon column={header.toLowerCase()} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-700">
                        {paginatedContestants.map((contestant) => (
                            <tr key={`${contestant.year}-${contestant.to_country}-${contestant.song}`} className="hover:bg-gray-700 bg-opacity-50">
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
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedAndFilteredContestants.length)} of {sortedAndFilteredContestants.length} entries
                </span>
                <div className="space-x-2">
                    {renderPageButtons()}
                </div>
            </div>
        </div>
    );
};

export default ContestantTable;