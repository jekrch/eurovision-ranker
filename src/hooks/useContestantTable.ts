import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import Papa from 'papaparse';
import { useAppDispatch } from './stateHooks';
import { ContestantRow } from '../components/table/tableTypes';
import { setEntries, setGlobalSearch, setRankedItems, setSelectedContestants, setTableCurrentPage, toggleSelectedContestant } from '../redux/rootSlice';
import { CountryContestant } from '../data/CountryContestant';
import { getUrlParam, updateQueryParams, updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { getCountryContestantsByUids } from '../utilities/ContestantRepository';
import { changePageSize, filterTable, sortTable } from '../redux/tableSlice';
import { AppState } from '../redux/store';

export const useContestantTable = () => {
    const dispatch = useAppDispatch();
    const { tableState, showUnranked, rankedItems, globalSearch, categories, activeCategory } = useSelector((state: AppState) => state);
    const { sortColumn, sortDirection, filters, pageSize, currentPage, entries, selectedContestants } = tableState;
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
                    const allEntries: ContestantRow[] = parseCSV(text);
                    console.log('FILL')
                    dispatch(
                        setEntries(allEntries)
                    );
                }

                // initialize selectedContestants based on rankedItems
                if (rankedItems.length > 0) {
                    const rankedItemsSet = new Set(
                        rankedItems.map((item: CountryContestant) => item.uid)
                    );
                    const initialSelectedContestants = allEntries.filter((entry: any) => rankedItemsSet.has(entry.id));
                    if (areContestantRowsEqual(initialSelectedContestants, selectedContestants)) {
                        return;
                    }
                    console.log(initialSelectedContestants)
                    dispatch(
                        setSelectedContestants(initialSelectedContestants)
                    );
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [globalSearch, entries.length, rankedItems, dispatch]);

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
            // Check if selectedContestants has actually changed
            if (areContestantRowsEqual(prevSelectedContestantsRef.current, selectedContestants)) {
                return;
            }

            const voteType = getUrlParam('v') ?? '';

            try {
                const currentRankedItems = rankedItems || [];
                const currentUids = new Set(currentRankedItems.map((item: CountryContestant) => item.uid));
                const selectedUids = new Set(selectedContestants.map((contestant: ContestantRow) => contestant.id));

                const uidsToAdd = selectedContestants
                    .filter((contestant: ContestantRow) => !currentUids.has(contestant.id))
                    .map((contestant: ContestantRow) => contestant.id);

                const uidsToRemove = currentRankedItems
                    .filter((item: CountryContestant) => !selectedUids.has(item.uid!))
                    .map((item: CountryContestant) => item.uid);

                const newCountryContestants = await getCountryContestantsByUids(uidsToAdd, voteType);

                const newRankedItems = [
                    ...currentRankedItems.filter((item: CountryContestant) => !uidsToRemove.includes(item.uid)),
                    ...newCountryContestants
                ];

                // Only dispatch if there's an actual change in rankedItems
                if (!areRankedItemsEqual(newRankedItems, prevRankedItemsRef.current)) {
                    dispatch(setRankedItems(newRankedItems));

                    updateUrlFromRankedItems(
                        activeCategory, categories, newRankedItems
                    );

                    // Update the rankedItems ref after processing
                    prevRankedItemsRef.current = newRankedItems;
                }

                // Update the selectedContestants ref after processing
                prevSelectedContestantsRef.current = selectedContestants;
            } catch (error) {
                console.error('Error updating ranked items:', error);
            }
        };

        updateRankedItems();
    }, [selectedContestants, activeCategory, categories, rankedItems]);


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

    const handleSort = (column: string) => {
        if (column === 'country') {
            column = 'to_country';
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

    const updateGlobalSearch = (checked: boolean) => {
        updateQueryParams({ 'g': checked ? 't' : undefined });
        dispatch(setGlobalSearch(checked));
    };

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
        selectedContestants
    };
};