import React from 'react';
import Dropdown from '../Dropdown';

interface PaginationProps {
    pageSize: number;
    currentPage: number;
    totalPages: number;
    displayedContestants: any[];
    handlePageSizeChange: (value: string) => void;
    handlePageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    pageSize,
    currentPage,
    totalPages,
    displayedContestants,
    handlePageSizeChange,
    handlePageChange
}) => {
    const renderPageButtons = () => {
        const pageButtons = [];
        const totalButtons = 5; // number of page buttons to show
        let startPage, endPage;

        if (totalPages <= totalButtons) {
            // show all pages if total pages are less than or equal to totalButtons
            startPage = 1;
            endPage = totalPages;
        } else {
            // calculate start and end page numbers
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

        // add "First" button
        if (currentPage > 1) {
            pageButtons.push(
                <button key="first" onClick={() => handlePageChange(1)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
                    {'<<'}
                </button>
            );
        }

        // add page number buttons
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

        // add "Last" button
        if (currentPage < totalPages) {
            pageButtons.push(
                <button key="last" onClick={() => handlePageChange(totalPages)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
                    {'>>'}
                </button>
            );
        }

        return pageButtons;
    };


    return (
        <div className="mt-4 flex justify-between items-center px-4">
            <div>
                <Dropdown
                    value={`${pageSize}`}
                    onChange={handlePageSizeChange}
                    options={['10', '25', '50']}
                    buttonClassName=''
                    className="min-w-[0.9em] text-xs"
                    openUpwards={true}
                    mini={true}
                />
                <span className="text-sm text-gray-300 ml-2 mr-3 whitespace-nowrap">
                    of {displayedContestants.length}
                </span>
            </div>
            <div className="space-x-2 space-y-2">
                {renderPageButtons()}
            </div>
        </div>
    );
};

export default Pagination;