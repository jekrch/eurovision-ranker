export interface ContestantRow {
    id: string;
    year: number;
    to_country_id: string;
    to_country: string;
    performer: string;
    song: string;
    place_contest: number;
  }
  
  export interface TableState {
    entries: ContestantRow[];
    selectedContestants: ContestantRow[];
    paginatedContestants: ContestantRow[];
    sortColumn: string;
    sortDirection: string;
    filteredEntries: ContestantRow[];
    searchTerm: string;
    currentPage: number;
    pageSize: number;
    filters: Record<string, string | number>
  }