/**
 * Pagination - Reusable pagination component for list pages
 * Google-style pagination with numbered pages, ellipsis, and go-to input
 */
import React, { useState, useMemo } from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
    loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    showPageSizeSelector = false,
    pageSizeOptions = [10, 25, 50, 100],
    loading = false
}) => {
    const [goToPageValue, setGoToPageValue] = useState('');

    const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalCount);

    // Calculate which page numbers to show
    const pageNumbers = useMemo(() => {
        const pages: (number | 'ellipsis')[] = [];

        if (totalPages <= 5) {
            // Show all pages if 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage <= 3) {
                // Near the start: 1, 2, 3, 4, ..., last
                pages.push(2, 3, 4);
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near the end: 1, ..., last-3, last-2, last-1, last
                pages.push('ellipsis');
                pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                // In the middle: 1, ..., current-1, current, current+1, ..., last
                pages.push('ellipsis');
                pages.push(currentPage - 1, currentPage, currentPage + 1);
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    const handlePrevious = () => {
        if (currentPage > 1 && !loading) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages && !loading) {
            onPageChange(currentPage + 1);
        }
    };

    const handleGoToPage = () => {
        const pageNum = parseInt(goToPageValue, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage && !loading) {
            onPageChange(pageNum);
            setGoToPageValue('');
        }
    };

    const handleGoToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGoToPage();
        }
    };

    // Don't render if there's no data
    if (totalCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 py-3 border-t border-gray-200 dark:border-slate-700">
            {/* Record count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{startRecord}</span>
                {' - '}
                <span className="font-medium text-gray-900 dark:text-white">{endRecord}</span>
                {' of '}
                <span className="font-medium text-gray-900 dark:text-white">{totalCount.toLocaleString()}</span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
                {/* Page size selector */}
                {showPageSizeSelector && onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 mr-2"
                        disabled={loading}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size} / page
                            </option>
                        ))}
                    </select>
                )}

                {/* Previous arrow button */}
                <button
                    onClick={handlePrevious}
                    disabled={currentPage <= 1 || loading}
                    className={`px-3 py-1.5 text-sm border rounded-md transition-colors
                        ${currentPage <= 1 || loading
                            ? 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                        }`}
                >
                    ←
                </button>

                {/* Page number buttons */}
                {pageNumbers.map((page, index) => (
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-gray-500 dark:text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => !loading && onPageChange(page)}
                            disabled={loading}
                            className={`min-w-[36px] px-2 py-1.5 text-sm border rounded-md transition-colors
                                ${currentPage === page
                                    ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-slate-700 text-white font-medium'
                                    : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }
                                ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                            `}
                        >
                            {page.toLocaleString()}
                        </button>
                    )
                ))}

                {/* Next arrow button */}
                <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages || loading}
                    className={`px-3 py-1.5 text-sm border rounded-md transition-colors
                        ${currentPage >= totalPages || loading
                            ? 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                        }`}
                >
                    →
                </button>

                {/* Go to page input - only show if more than 7 pages */}
                {totalPages > 7 && (
                    <div className="flex items-center gap-1 ml-3">
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={goToPageValue}
                            onChange={(e) => setGoToPageValue(e.target.value)}
                            onKeyDown={handleGoToPageKeyDown}
                            placeholder="Page #"
                            className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            disabled={loading}
                        />
                        <button
                            onClick={handleGoToPage}
                            disabled={loading || !goToPageValue}
                            className={`px-3 py-1.5 text-sm border rounded-md transition-colors
                                ${loading || !goToPageValue
                                    ? 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                                }`}
                        >
                            Go
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pagination;
