import Papa from 'papaparse';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { ContestantRow } from '../components/table/tableTypes';
import { CountryContestant } from '../data/CountryContestant';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import {
  setActiveRankingAndSyncCategoryMembership,
  setEntries,
  setGlobalSearch,
  setPaginatedContestants,
  setSelectedContestants,
  setTableCurrentPage,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';
import { changePageSize, filterTable, sortTable } from '../redux/tableSlice';
import { getCountryContestantsByUids } from '../utilities/ContestantRepository';
import { fetchContestantCsv } from '../utilities/CsvCache';
import { logger } from '../utilities/logger';
import { getUrlParam } from '../utilities/UrlUtil';

export const useContestantTable = () => {
  const dispatch = useAppDispatch();
  const tableState = useAppSelector((state: AppState) => state.table.tableState);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const globalSearch = useAppSelector((state: AppState) => state.root.globalSearch);
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  const { sortColumn, sortDirection, pageSize, currentPage, entries, selectedContestants } =
    tableState;

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
          const response = await fetchContestantCsv();
          const text = await response;
          allEntries = parseCSV(text);
          dispatch(setEntries(allEntries));
        }

        // initialize selectedContestants based on rankedItems
        if (rankedItems.length > 0) {
          const rankedItemsSet = new Set(rankedItems.map((item: CountryContestant) => item.uid));

          const initialSelectedContestants = allEntries.filter((entry: ContestantRow) =>
            rankedItemsSet.has(entry.id),
          );

          if (!areContestantRowsEqual(initialSelectedContestants, selectedContestants)) {
            dispatch(setSelectedContestants(initialSelectedContestants));
          }
        }
      } catch (error) {
        logger.error('Error fetching data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch, entries.length, rankedItems, dispatch]);

  // helper function to parse CSV
  const parseCSV = (csv: string): ContestantRow[] => {
    const parseResult = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    return parseResult.data
      .map((row: Record<string, string>) => ({
        id: row.id,
        year: parseInt(row.year, 10),
        to_country_id: row.to_country_id,
        to_country: row.to_country,
        performer: row.performer,
        song: row.song,
        place_contest: parseInt(row.place_contest, 10),
      }))
      .filter(
        (entry: ContestantRow) => entry.year && entry.to_country && entry.performer && entry.song,
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
      if (areContestantRowsEqual(prevSelectedContestantsRef.current, selectedContestants)) {
        return;
      }

      const voteType = getUrlParam('v') ?? '';

      try {
        const currentRankedItems = rankedItems || [];
        const currentUids = new Set(currentRankedItems.map((item) => item.uid));
        const selectedUids = new Set(selectedContestants.map((contestant) => contestant.id));

        const uidsToAdd = selectedContestants
          .filter((contestant) => !currentUids.has(contestant.id))
          .map((contestant) => contestant.id);

        const uidsToRemove = currentRankedItems
          .filter((item) => !selectedUids.has(item.uid!))
          .map((item) => item.uid);

        const newCountryContestants = await getCountryContestantsByUids(uidsToAdd, voteType);

        const newRankedItems = [
          ...currentRankedItems.filter((item) => !uidsToRemove.includes(item.uid)),
          ...newCountryContestants,
        ];

        if (!areRankedItemsEqual(newRankedItems, prevRankedItemsRef.current)) {
          // One idempotent dispatch sets the active order and brings every other
          // category to the same membership. Doing this as separate append/remove
          // dispatches inside this re-running async effect could not converge —
          // it duplicated entries and looped, storming the URL writer. The URL is
          // projected from the store by the single writer (useUrlWriter).
          dispatch(setActiveRankingAndSyncCategoryMembership(newRankedItems));

          prevRankedItemsRef.current = newRankedItems;
        }

        prevSelectedContestantsRef.current = selectedContestants;
      } catch (error) {
        logger.error('Error updating ranked items:', error);
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
        searchTerms.every((term) =>
          Object.entries(contestant).some(
            ([key, value]) => key !== 'id' && String(value).toLowerCase().includes(term),
          ),
        ),
      );
    }

    // apply sorting
    if (sortColumn) {
      result.sort((a: ContestantRow, b: ContestantRow) => {
        if (a[sortColumn as keyof ContestantRow] < b[sortColumn as keyof ContestantRow])
          return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn as keyof ContestantRow] > b[sortColumn as keyof ContestantRow])
          return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [entries, selectedContestants, showSelected, searchTerm, sortColumn, sortDirection]);

  const displayedContestants = sortedAndFilteredContestants;
  const totalPages = Math.ceil(displayedContestants.length / pageSize);
  const paginatedContestants = displayedContestants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
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

  const handleToggleSelected = useCallback(
    (id: string) => {
      const isSelected = selectedContestants.some((contestant) => contestant.id === id);
      let newSelectedContestants: ContestantRow[];

      if (isSelected) {
        newSelectedContestants = selectedContestants.filter((contestant) => contestant.id !== id);
      } else {
        const contestantToAdd = tableState.entries.find((contestant) => contestant.id === id);
        if (!contestantToAdd) {
          return; // Contestant not found, do nothing
        }
        newSelectedContestants = [...selectedContestants, contestantToAdd];
      }

      // The selection is the only thing toggled here; the updateRankedItems
      // effect reconciles it into the per-category store rankings and the single
      // URL writer projects those to the URL.
      dispatch(setSelectedContestants(newSelectedContestants));
    },
    [selectedContestants, tableState.entries, dispatch],
  );

  // Flipping advanced (global) mode is a plain store dispatch. Store items carry
  // both the country `id` and the global `uid`, so `selectUrlParams` re-encodes
  // each category's ranking in the new mode and the single URL writer projects
  // it (along with `g`) — no URL round-trip needed.
  const updateGlobalSearch = (checked: boolean) => {
    dispatch(setGlobalSearch(checked));
  };

  /**
   * Keep the tableState.paginatedContestants field updated so that we
   * can use the "Add All" button in the Edit Nav.
   */
  useEffect(() => {
    if (!areContestantRowsEqual(tableState.paginatedContestants, paginatedContestants)) {
      dispatch(setPaginatedContestants(paginatedContestants));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tableState.currentPage,
    tableState.filters,
    tableState.entries,
    tableState.sortDirection,
    tableState.sortColumn,
    tableState.pageSize,
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
  };
};
