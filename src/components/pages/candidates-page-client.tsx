"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidatesTable } from "@/components/candidates-table";
import ErrorBoundary from "@/components/error-boundary";
import { InviteCandidateDialog } from "@/components/invite-candidate-dialog";
import { toast } from "sonner";
import { useWarmRoute } from "@/hooks/use-warm-route";
import {
  CandidateApplication,
  CandidatesListResponse,
  CandidatesListRequest,
} from "@/lib/query/contracts/candidates";
import { candidatesListQueryOptions } from "@/lib/query/fetchers/candidates";

interface CandidatesPageClientProps {
  initialFilters: CandidatesListRequest;
  initialPayload?: CandidatesListResponse;
}

const DEFAULT_FILTERS: CandidatesListRequest = {
  searchQuery: "",
  statusFilter: "ALL",
  currentPage: 0,
  pageSize: 20,
  sortColumn: "created_at",
  sortDirection: "desc",
};

export default function CandidatesPageClient({
  initialFilters,
  initialPayload,
}: CandidatesPageClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter);
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage);
  const [pageSize, setPageSize] = useState(initialFilters.pageSize);
  const [sortColumn, setSortColumn] = useState(initialFilters.sortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialFilters.sortDirection);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const queryFilters = useMemo<CandidatesListRequest>(
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

  const isInitialQuery = useMemo(
    () =>
      queryFilters.searchQuery === initialFilters.searchQuery &&
      queryFilters.statusFilter === initialFilters.statusFilter &&
      queryFilters.currentPage === initialFilters.currentPage &&
      queryFilters.pageSize === initialFilters.pageSize &&
      queryFilters.sortColumn === initialFilters.sortColumn &&
      queryFilters.sortDirection === initialFilters.sortDirection,
    [initialFilters, queryFilters],
  );

  const {
    data: applicationsResponse,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    ...candidatesListQueryOptions(queryFilters),
    initialData: isInitialQuery && initialPayload ? initialPayload : undefined,
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

  const applications = applicationsResponse?.applications ?? [];
  const totalApplicationsCount = applicationsResponse?.totalCount ?? 0;
  const hasLoadedOnce = !isLoading;
  useWarmRoute("warm_candidates", hasLoadedOnce, 1800);

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

  const hasNextPage = totalApplicationsCount > (currentPage + 1) * pageSize;
  const hasPreviousPage = currentPage > 0;
  const isInitialLoading = isLoading && currentPage === 0 && !applicationsResponse;

  const handleInviteCandidates = async (emails: string[], jobId: string) => {
    try {
      const response = await fetch("/api/job-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails, jobId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${emails.length} candidate(s) invited successfully`, {
          description: "Invitations have been sent!",
        });
      } else {
        if (response.status === 409 && result.existingEmails) {
          toast.error("Some invitations already exist", {
            description: `Invitations already exist for: ${result.existingEmails.join(", ")}`,
          });
        } else {
          toast.error("Failed to invite candidates", {
            description: result.error || "Please try again later",
          });
        }
        throw new Error(result.error || "Failed to invite candidates");
      }
    } catch (error) {
      toast.error("Failed to invite candidates", {
        description: "Please check your connection and try again",
      });
      throw error;
    }
  };

  return (
    <div className="candidates-container">
      <div className="candidates-header">
        <h1 className="candidates-title">Candidates</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsInviteDialogOpen(true)}
            className="btn-invite bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold"
          >
            <Plus className="btn-icon" />
            Invite Candidate
          </Button>
        </div>
      </div>
      <main className="flex-1 min-h-0 h-full overflow-hidden">
        <ErrorBoundary>
          <CandidatesTable
            applications={applications as CandidateApplication[]}
            originalApplications={applications as CandidateApplication[]}
            totalApplicationsCount={totalApplicationsCount}
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

      <InviteCandidateDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteCandidates}
      />
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
