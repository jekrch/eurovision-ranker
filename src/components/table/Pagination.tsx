import React from 'react';
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
    const navButtonClass = classNames(
        "flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-base font-semibold leading-none",
        "text-[var(--er-text-primary)] bg-[var(--er-button-neutral)]",
        "hover:bg-[var(--er-button-primary)] hover:text-white transition-colors",
        "disabled:opacity-40 disabled:pointer-events-none"
    );

    const renderPageButtons = () => {
        return (
            <>
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    aria-label="First page"
                    className={navButtonClass}
                >
                    {'«'}
                </button>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className={navButtonClass}
                >
                    {'‹'}
                </button>
                <span className="px-1.5 text-sm font-medium text-[var(--er-text-secondary)] tabular-nums whitespace-nowrap">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className={navButtonClass}
                >
                    {'›'}
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Last page"
                    className={navButtonClass}
                >
                    {'»'}
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
        //         <button key="first" onClick={() => handlePageChange(1)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-[var(--er-button-secondary-hover)]">
        //             {'<<'}
        //         </button>
        //     );
        // }

        // for (let page = startPage; page <= endPage; page++) {
        //     pageButtons.push(
        //         <button
        //             key={page}
        //             onClick={() => handlePageChange(page)}
        //             className={`px-2 py-1 rounded ${currentPage === page ? 'bg-[var(--er-button-primary)] text-white' : 'bg-gray-700 text-gray-300 hover:bg-[var(--er-button-secondary-hover)] text-sm'}`}
        //         >
        //             {page}
        //         </button>
        //     );
        // }

        // if (currentPage < totalPages) {
        //     pageButtons.push(
        //         <button key="last" onClick={() => handlePageChange(totalPages)} className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-[var(--er-button-secondary-hover)]">
        //             {'>>'}
        //         </button>
        //     );
        // }

        // return pageButtons;
    };

    return (
        <div className="mt-2 mr-1 flex items-center justify-between gap-2 rounded-md bg-[var(--er-surface-tertiary-70)] px-2 py-1.5">
            <div className="flex items-center gap-2">
                <Dropdown
                    value={`${pageSize}`}
                    onChange={handlePageSizeChange}
                    options={['10', '25', '50']}
                    buttonClassName=''
                    className="min-w-[0.9em] text-sm"
                    openUpwards={true}
                    mini={true}
                />
                <span className="text-sm text-[var(--er-text-secondary)] whitespace-nowrap">
                    of {displayedContestants.length}
                </span>
            </div>
            <div className="flex items-center gap-1">
                {renderPageButtons()}
            </div>
        </div>
    );
};

export default Pagination;