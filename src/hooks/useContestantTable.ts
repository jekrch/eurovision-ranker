import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { ContestantRow } from '../components/table/tableTypes';
import { setEntries, setGlobalSearch, setPaginatedContestants, setRankedItems, setSelectedContestants, setTableCurrentPage } from '../redux/rootSlice';
import { CountryContestant } from '../data/CountryContestant';
import { getUrlParam, updateQueryParams, updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { getCountryContestantsByUids } from '../utilities/ContestantRepository';
import { changePageSize, filterTable, sortTable } from '../redux/tableSlice';
import { AppState } from '../redux/store';
import { convertRankingUrlParamsByMode } from '../utilities/ContestantUtil';
import { isArrayEqual } from '../utilities/RankAnalyzer';

export const useContestantTable = () => {
    const dispatch = useAppDispatch();
    const tableState = useAppSelector((state: AppState) => state.tableState);
    const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
    const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
    const categories = useAppSelector((state: AppState) => state.categories);
    const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
    
    const { sortColumn, sortDirection, pageSize, currentPage, entries, selectedContestants } = tableState;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showSelected, setShowSelected] = useState(false);
    
    const prevSelectedContestantsRef = useRef<ContestantRow[]>([]);
    const prevRankedItemsRef = useRef<CountryContestant[]>([]);


    // fetch data and initialize selectedContestants
    useEffect(() => {
        if (!globalSearch) return;

        const fetchData = async () => {
            try {
                let allEntries: ContestantRow[] = entries;
                
                if (!entries?.length) {
                    const response = await fetch('/contestants.csv');
                    const text = await response.text();
                    allEntries = parseCSV(text);
                    dispatch(setEntries(allEntries));
                }

                // initialize selectedContestants based on rankedItems
                if (rankedItems.length > 0) {
                    const rankedItemsSet = new Set(
                        rankedItems.map((item: CountryContestant) => item.uid)
                    );

                    const initialSelectedContestants = allEntries.filter(
                        (entry: any) => rankedItemsSet.has(entry.id)
                    );

                    if (
                        !areContestantRowsEqual(
                            initialSelectedContestants, 
                            selectedContestants)
                    ) {
                        dispatch(
                            setSelectedContestants(initialSelectedContestants)
                        );
                    }
                }

                // update URL parameters for main ranking and category rankings
                convertRankingURLParams();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [globalSearch, entries.length, rankedItems, dispatch]);
    
    const updateRankingURLParams = useCallback(() => {
        const mainRanking = rankedItems.map(item => item.uid).join('');
        const params: { [key: string]: string } = { };

        categories.forEach((_, index) => {
            const categoryParam = `r${index + 1}`;
            const categoryRanking = getUrlParam(categoryParam) || '';
            params[categoryParam] = categoryRanking;
        });

        updateQueryParams(params);
    }, [rankedItems, categories]);
    
    const convertRankingURLParams = useCallback(() => {
        convertRankingUrlParamsByMode(
            categories, globalSearch, rankedItems
        );
    }, [globalSearch, rankedItems, categories]);

    // helper function to parse CSV
    const parseCSV = (csv: string): ContestantRow[] => {
        const parseResult = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            transform: (value: string) => value.trim()
        });

        return parseResult.data
            .map((row: any) => ({
                id: row.id,
                year: parseInt(row.year, 10),
                to_country_id: row.to_country_id,
                to_country: row.to_country,
                performer: row.performer,
                song: row.song,
                place_contest: parseInt(row.place_contest, 10)
            }))
            .filter((entry: ContestantRow) =>
                entry.year && entry.to_country && entry.performer && entry.song
            );
    };

    // Custom comparison function for ContestantRow arrays
    const areContestantRowsEqual = (arr1: ContestantRow[], arr2: ContestantRow[]): boolean => {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].id !== arr2[i].id || arr1[i].year !== arr2[i].year) {
                return false;
            }
        }
        return true;
    };

    // Custom comparison function for CountryContestant arrays
    const areRankedItemsEqual = (arr1: CountryContestant[], arr2: CountryContestant[]): boolean => {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].uid !== arr2[i].uid) {
                return false;
            }
        }
        return true;
    };

    
    useEffect(() => {
        const updateRankedItems = async () => {
            if (
                areContestantRowsEqual(
                    prevSelectedContestantsRef.current, 
                    selectedContestants
                )
            ) {
                return;
            }

            const voteType = getUrlParam('v') ?? '';

            try {
                const currentRankedItems = rankedItems || [];
                const currentUids = new Set(currentRankedItems.map(item => item.uid));
                const selectedUids = new Set(selectedContestants.map(contestant => contestant.id));

                const uidsToAdd = selectedContestants
                    .filter(contestant => !currentUids.has(contestant.id))
                    .map(contestant => contestant.id);

                const uidsToRemove = currentRankedItems
                    .filter(item => !selectedUids.has(item.uid!))
                    .map(item => item.uid);

                const newCountryContestants = await getCountryContestantsByUids(uidsToAdd, voteType);

                const newRankedItems = [
                    ...currentRankedItems.filter(item => !uidsToRemove.includes(item.uid)),
                    ...newCountryContestants
                ];

                if (!areRankedItemsEqual(newRankedItems, prevRankedItemsRef.current)) {
                    dispatch(setRankedItems(newRankedItems));

                    updateUrlFromRankedItems(
                        activeCategory, categories, newRankedItems
                    );

                    prevRankedItemsRef.current = newRankedItems;
                }

                prevSelectedContestantsRef.current = selectedContestants;
            } catch (error) {
                console.error('Error updating ranked items:', error);
            }
        };

        updateRankedItems();
    }, [selectedContestants, activeCategory, categories, rankedItems, dispatch]);


    // reset page and search term when switching views
    useEffect(() => {
        dispatch(setTableCurrentPage(1));
        setSearchTerm('');
    }, [showSelected, dispatch]);
        
    const sortedAndFilteredContestants = useMemo(() => {
        const tableRows = showSelected ? selectedContestants : entries;

        // use a Set to keep track of unique ids
        const uniqueIds = new Set<string>();
        let result = tableRows.filter((contestant: ContestantRow) => {
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

            result = result.filter((contestant: ContestantRow) =>
                searchTerms.every(term =>
                    Object.entries(contestant).some(([key, value]) =>
                        key !== 'id' && String(value).toLowerCase().includes(term)
                    )
                )
            );
        }

        // apply sorting
        if (sortColumn) {
            result.sort((a: any, b: any) => {
                if (a[sortColumn as keyof ContestantRow] < b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? -1 : 1;
                if (a[sortColumn as keyof ContestantRow] > b[sortColumn as keyof ContestantRow]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [entries, selectedContestants, showSelected, searchTerm, sortColumn, sortDirection]);

    const displayedContestants = sortedAndFilteredContestants;
    const totalPages = Math.ceil(displayedContestants.length / pageSize);
    const paginatedContestants = displayedContestants.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const updateCategoryRankings = useCallback((contestantId: string, isAdding: boolean) => {
        categories.forEach((_, index) => {
            const categoryParam = `r${index + 1}`;
            let currentRanking = new URLSearchParams(window.location.search).get(categoryParam) || '';
            if (!currentRanking.startsWith('>')) {
                currentRanking = `>${currentRanking}`;
            }

            let updatedRanking: string;

            if (isAdding) {
                updatedRanking = currentRanking + contestantId;
            } else {
                updatedRanking = currentRanking.replace(contestantId, '');
            }

            updateQueryParams({ [categoryParam]: updatedRanking });
        });
    }, [categories]);
    
    const handleSort = (column: string) => {
        if (column === 'country') {
            column = 'to_country';
        }
        dispatch(
            sortTable(column)
        );
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

    const handleToggleSelected = useCallback((id: string) => {
        const isSelected = selectedContestants.some(contestant => contestant.id === id);
        let newSelectedContestants: ContestantRow[];

        if (isSelected) {
            newSelectedContestants = selectedContestants.filter(contestant => contestant.id !== id);
            updateCategoryRankings(id, false); // Remove from category rankings
        } else {
            const contestantToAdd = tableState.entries.find(contestant => contestant.id === id);
            if (contestantToAdd) {
                newSelectedContestants = [...selectedContestants, contestantToAdd];
                updateCategoryRankings(id, true); // Add to category rankings
            } else {
                return; // Contestant not found, do nothing
            }
        }

        dispatch(
            setSelectedContestants(newSelectedContestants)
        );

        if (globalSearch) {
            updateRankingURLParams();
        }
    }, [selectedContestants, tableState.entries, dispatch, updateCategoryRankings, globalSearch, updateRankingURLParams, convertRankingURLParams]);


    const updateGlobalSearch = (checked: boolean) => {
        updateQueryParams({ 'g': checked ? 't' : undefined });
        dispatch(
            setGlobalSearch(checked)
        );

        convertRankingURLParams();
    };

    /**
     * Keep the tableState.paginatedContestants field updated so that we 
     * can use the "Add All" button in the Edit Nav.
     */
    useEffect(() => {
        if (
            !areContestantRowsEqual(
                tableState.paginatedContestants, 
                paginatedContestants
            )
        ) {    
            dispatch(
                setPaginatedContestants(
                    paginatedContestants
                )
            );
        }
    }, [
        tableState.currentPage, 
        tableState.filters, 
        tableState.entries, 
        tableState.sortDirection, 
        tableState.sortColumn, 
        tableState.pageSize
    ]);

    return {
        paginatedContestants,
        handleSort,
        handleSearch,
        handlePageSizeChange,
        handlePageChange,
        handleToggleSelected,
        searchTerm,
        showSelected,
        setShowSelected,
        globalSearch,
        updateGlobalSearch,
        pageSize,
        currentPage,
        totalPages,
        displayedContestants,
        selectedContestants,
        convertRankingURLParams
    };
};
