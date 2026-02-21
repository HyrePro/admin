export type SortDirection = "asc" | "desc";

export type ListFilters = {
  statusFilter: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: SortDirection;
};

