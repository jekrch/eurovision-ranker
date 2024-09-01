import React, { useState, useEffect } from 'react';
import Dropdown from '../Dropdown';
import classNames from 'classnames';

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
    const isCompact = true;

    const renderPageButtons = () => {
        return (
            <>
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                    {'<<'}
                </button>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                    {'<'}
                </button>
                <span className="text-sm text-gray-300">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                    {'>'}
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                    {'>>'}
                </button>
            </>
        );
        

        // const pageButtons = [];
        // const totalButtons = 5;
        // let startPage, endPage;

        // if (totalPages <= totalButtons) {
        //     startPage = 1;
        //     endPage = totalPages;
        // } else {
        //     const leftOffset = Math.floor(totalButtons / 2);
        //     const rightOffset = totalButtons - leftOffset - 1;

        //     if (currentPage <= leftOffset + 1) {
        //         startPage = 1;
        //         endPage = totalButtons;
        //     } else if (currentPage >= totalPages - rightOffset) {
        //         startPage = totalPages - totalButtons + 1;
        //         endPage = totalPages;
        //     } else {
        //         startPage = currentPage - leftOffset;
        //         endPage = currentPage + rightOffset;
        //     }
        // }

        // if (currentPage > 1) {
        //     pageButtons.push(
        //         <button key="first" onClick={() => handlePageChange(1)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
        //             {'<<'}
        //         </button>
        //     );
        // }

        // for (let page = startPage; page <= endPage; page++) {
        //     pageButtons.push(
        //         <button
        //             key={page}
        //             onClick={() => handlePageChange(page)}
        //             className={`px-2 py-1 rounded ${currentPage === page ? 'bg-[#3068ba] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm'}`}
        //         >
        //             {page}
        //         </button>
        //     );
        // }

        // if (currentPage < totalPages) {
        //     pageButtons.push(
        //         <button key="last" onClick={() => handlePageChange(totalPages)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">
        //             {'>>'}
        //         </button>
        //     );
        // }

        // return pageButtons;
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
                <span className={classNames("text-sm text-gray-300 ml-2 mr-3 whitespace-nowrap", isCompact ? "text-xs mr-1" : "")}>
                    of {displayedContestants.length}
                </span>
            </div>
            <div className="space-x-1 space-y-2">
                {renderPageButtons()}
            </div>
        </div>
    );
};

export default Pagination;