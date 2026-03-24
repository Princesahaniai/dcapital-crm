import { useState, useMemo } from 'react';

interface PaginationResult<T> {
    currentItems: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setItemsPerPage: (count: number) => void;
    itemsPerPage: number;
}

export function usePagination<T>(items: T[], defaultPerPage = 24): PaginationResult<T> {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageState] = useState(defaultPerPage);

    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

    // Auto-reset to page 1 when items change significantly (e.g. filter change)
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);

    const currentItems = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex]
    );

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const nextPage = () => goToPage(safePage + 1);
    const prevPage = () => goToPage(safePage - 1);

    const setItemsPerPage = (count: number) => {
        setItemsPerPageState(count);
        setCurrentPage(1);
    };

    return {
        currentItems,
        currentPage: safePage,
        totalPages,
        totalItems: items.length,
        startIndex: startIndex + 1,
        endIndex,
        goToPage,
        nextPage,
        prevPage,
        setItemsPerPage,
        itemsPerPage
    };
}
