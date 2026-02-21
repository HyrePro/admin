"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobsTable } from "@/components/jobs-table";
import ErrorBoundary from "@/components/error-boundary";
import { useWarmRoute } from "@/hooks/use-warm-route";
import { JobsListRequest } from "@/lib/query/contracts/jobs";
import { jobsListQueryOptions } from "@/lib/query/fetchers/jobs";

interface JobsPageClientProps {
  initialFilters: JobsListRequest;
}

const DEFAULT_FILTERS: JobsListRequest = {
  searchQuery: "",
  statusFilter: "ALL",
  currentPage: 0,
  pageSize: 20,
  sortColumn: "created_at",
  sortDirection: "desc",
};

export default function JobsPageClient({ initialFilters }: JobsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter);
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage);
  const [pageSize, setPageSize] = useState(initialFilters.pageSize);
  const [sortColumn, setSortColumn] = useState(initialFilters.sortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialFilters.sortDirection);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const queryFilters = useMemo<JobsListRequest>(
    () => ({
      searchQuery: debouncedSearchQuery,
      statusFilter,
      currentPage,
      pageSize,
      sortColumn,
      sortDirection,
    }),
    [currentPage, debouncedSearchQuery, pageSize, sortColumn, sortDirection, statusFilter],
  );

  const { data: jobsResponse, isLoading, isFetching, isError } = useQuery({
    ...jobsListQueryOptions(queryFilters),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
    if (currentPage > 0) params.set("page", String(currentPage));
    if (pageSize !== DEFAULT_FILTERS.pageSize) params.set("pageSize", String(pageSize));
    if (sortColumn !== DEFAULT_FILTERS.sortColumn) params.set("sort", sortColumn);
    if (sortDirection !== DEFAULT_FILTERS.sortDirection) {
      params.set("asc", String(sortDirection === "asc"));
    }

    if (searchParams.toString() === params.toString()) {
      return;
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [
    currentPage,
    debouncedSearchQuery,
    pageSize,
    pathname,
    router,
    searchParams,
    sortColumn,
    sortDirection,
    statusFilter,
  ]);

  const jobs = jobsResponse?.jobs ?? [];
  const totalJobsCount = jobsResponse?.totalCount ?? 0;
  const hasLoadedOnce = !isLoading;
  useWarmRoute("warm_jobs", hasLoadedOnce, 1800);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(0);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);

  const handleSortChange = useCallback((column: string, direction: "asc" | "desc") => {
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(0);
  }, []);

  const handleRefresh = useCallback(async () => {
    setSearchQuery(DEFAULT_FILTERS.searchQuery);
    setStatusFilter(DEFAULT_FILTERS.statusFilter);
    setCurrentPage(DEFAULT_FILTERS.currentPage);
    setPageSize(DEFAULT_FILTERS.pageSize);
    setSortColumn(DEFAULT_FILTERS.sortColumn);
    setSortDirection(DEFAULT_FILTERS.sortDirection);
  }, []);

  const hasNextPage = totalJobsCount > (currentPage + 1) * pageSize;
  const hasPreviousPage = currentPage > 0;
  const isInitialLoading = isLoading && currentPage === 0 && !jobsResponse;

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <h1 className="jobs-title">Jobs</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/jobs/create-job-post")}
            className="btn-create bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold"
          >
            <Plus className="btn-icon" />
            Create New Job Post
          </Button>
        </div>
      </div>
      <main className="flex-1 min-h-0 h-full overflow-hidden bg-red w-full">
        <ErrorBoundary>
          <JobsTable
            jobs={jobs}
            originalJobs={jobs}
            totalJobsCount={totalJobsCount}
            loading={isInitialLoading}
            onRefresh={handleRefresh}
            hasError={isError}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isFetchingNextPage={isFetching && !isInitialLoading}
            serverSidePagination={true}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            currentPage={currentPage}
            pageSize={pageSize}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSearchChange={handleSearchChange}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
