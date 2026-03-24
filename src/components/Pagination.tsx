import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage, totalPages, totalItems, startIndex, endIndex,
    onPageChange, onNext, onPrev
}) => {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const delta = 1;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-2">
            {/* Counter */}
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Showing <span className="text-gray-900 dark:text-white">{startIndex}–{endIndex}</span> of{' '}
                <span className="text-gray-900 dark:text-white">{totalItems}</span>
            </p>

            {/* Page Controls */}
            <div className="flex items-center gap-1">
                {/* First */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="First Page"
                >
                    <ChevronsLeft size={16} />
                </button>

                {/* Prev */}
                <button
                    onClick={onPrev}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Previous Page"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-all ${
                                currentPage === page
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Next Page"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Last */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Last Page"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};
