"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { JobsTable } from "@/components/jobs-table";
import ErrorBoundary from "@/components/error-boundary";
import { useQuery } from '@tanstack/react-query';
import { Job } from '@/types/jobs-table';

export default function JobsPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Fetch total job count (updates when filters change)
  const { data: totalJobsCount = 0, isLoading: countLoading, refetch: refetchCount } = useQuery<number>({
    queryKey: ['job-count', statusFilter, searchQuery],
    queryFn: async () => {
      console.log('Fetching job count with filters:', { statusFilter, searchQuery });
      const response = await fetch(`/api/get-job-count?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job count: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Job count:', data.count);
      return data.count || 0;
    },
    enabled: !!user && !!session,
    retry: 2,
  });

  // Fetch jobs data (updates when any parameter changes)
  const { 
    data: jobsData, 
    isLoading: loading, 
    error, 
    refetch: refetchJobs, 
    isFetching: isFetchingJobs 
  } = useQuery<Job[]>({
    queryKey: ['jobs', statusFilter, searchQuery, currentPage, pageSize, sortColumn, sortDirection],
    queryFn: async () => {
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      
      console.log('Fetching jobs with params:', {
        status: statusFilter,
        search: searchQuery,
        startIndex,
        endIndex,
        sort: sortColumn,
        asc: sortDirection === 'asc'
      });
      
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        startIndex: startIndex.toString(),
        endIndex: endIndex.toString(),
        sort: sortColumn,
        asc: (sortDirection === 'asc').toString()
      });
      
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      console.log('Fetched jobs:', data.jobs?.length || 0);
      return data.jobs || [];
    },
    enabled: !!user && !!session,
    retry: 2,
    placeholderData: (previousData) => previousData, // Prevent flicker while loading (React Query v5)
  });

  // Handle undefined case
  const jobs = jobsData ?? [];

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    console.log('Search changed:', query);
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page on search
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((status: string) => {
    console.log('Status filter changed:', status);
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page on filter
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    console.log('Page changed to:', page);
    setCurrentPage(page);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    console.log('Page size changed to:', size);
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when page size changes
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    console.log('Sort changed:', { column, direction });
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(0); // Reset to first page on sort
  }, []);

  // Handle refresh - refetch everything
  const handleRefresh = useCallback(async () => {
    console.log('Refresh requested');
    // Reset all filters and fetch fresh data
    setSearchQuery('');
    setStatusFilter('ALL');
    setCurrentPage(0);
    setSortColumn('created_at');
    setSortDirection('desc');
    
    // Refetch both count and jobs
    await Promise.all([refetchCount(), refetchJobs()]);
  }, [refetchCount, refetchJobs]);

  // Calculate pagination flags
  const hasNextPage = (currentPage + 1) * pageSize < totalJobsCount;
  const hasPreviousPage = currentPage > 0;

  // Determine loading states
  const isInitialLoading = loading && currentPage === 0;

  console.log('JobsPage render:', {
    currentPage,
    pageSize,
    jobsLength: jobs.length,
    totalJobsCount,
    hasNextPage,
    hasPreviousPage,
    isInitialLoading,
    isFetchingJobs,
    searchQuery,
    statusFilter,
    sortColumn,
    sortDirection
  });

  return (
    <div className="jobs-container flex flex-col h-full overflow-hidden">
      <div className="jobs-header flex-shrink-0">
        <h1 className="jobs-title">Jobs</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/jobs/create-job-post')}
          className='btn-create'
        >
          <Plus className="btn-icon" />
          Create New Job Post
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden min-h-0">
        <ErrorBoundary>
          <JobsTable 
            jobs={jobs} 
            originalJobs={jobs}
            totalJobsCount={totalJobsCount}
            loading={isInitialLoading} 
            onRefresh={handleRefresh}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isFetchingNextPage={isFetchingJobs && !isInitialLoading}
            serverSidePagination={true}
            // Pass controlled state
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            currentPage={currentPage}
            pageSize={pageSize}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            // Pass handlers
            onSearchChange={handleSearchChange}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}