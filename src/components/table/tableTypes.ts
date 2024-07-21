export interface ContestantRow {
    year: number;
    to_country_id: string;
    to_country: string;
    performer: string;
    song: string;
    place_contest: number;
  }
  
  export interface TableState {
    entries: ContestantRow[];
    sortColumn: string;
    sortDirection: string;
    filteredEntries: ContestantRow[];
    searchTerm: string;
    currentPage: number;
    pageSize: number;
    filters: Record<string, string | number>
  }