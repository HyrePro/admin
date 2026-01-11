"use client";

import React from "react";
import { useJobsTable } from '@/hooks/useJobsTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, RefreshCw, ArrowUpDown, Briefcase, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import NetworkErrorState from '@/components/network-error-state';
import PartialErrorState from '@/components/partial-error-state';
import '@/styles/jobs.css';
import { formatDate, DatePresets } from '@/lib/date-formatter';
import { formatNumber } from '@/lib/number-formatter';
import { sanitizeInput } from '@/lib/sanitize';
import { isValidStringLength, sanitizeAndValidateInput } from '@/lib/data-validation';
import { JobsTableProps, JobRowPropsWithoutUndo } from '@/types/jobs-table';

import { JobActionButtons } from '@/components/jobs-table/job-action-buttons';
import { JobsPagination } from '@/components/jobs-table/jobs-pagination';

function JobsTableComponent({ 
  jobs, 
  originalJobs, 
  totalJobsCount, 
  loading = false, 
  onRefresh, 
  hasNextPage, 
  onLoadMore, 
  hasPreviousPage, 
  onLoadPrevious, 
  isFetchingNextPage, 
  isFetchingPreviousPage, 
  error, 
  hasError, 
  isNetworkError,
  serverSidePagination,
  // Controlled state
  searchQuery: controlledSearchQuery,
  statusFilter: controlledStatusFilter,
  currentPage: controlledCurrentPage,
  pageSize: controlledPageSize,
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  // Callbacks
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
  onSortChange
}: JobsTableProps) {
  console.log('JobsTableComponent rendered with:', { 
    totalJobsCount, 
    jobsLength: jobs?.length, 
    originalJobsLength: originalJobs?.length,
    serverSidePagination 
  });
  
  const router = useRouter();
  
  const {
    // State
    jobSearchQuery,
    jobStatusFilter,
    jobsCurrentPage,
    jobsFilteredCount,
    jobsFilterLoading,
    jobsPartialErrors,
    jobsSortConfig,
    jobStatusOptions,
    jobStatusColors,
    pageSize,
    setPageSize,
    
    // Refs
    jobSearchInputRef,
    
    // Computed values
    filteredJobs,
    sortedJobs,
    paginatedJobs,
    totalPages,
    startIndex,
    endIndex,
    totalDisplayCount,
    hasPreviousPage: hasPreviousPageFromHook,
    hasNextPage: hasNextPageFromHook,
    
    // Handlers
    setJobSearchQuery,
    setJobStatusFilter,
    setJobsCurrentPage,
    handleViewJob,
    handleCopyLink,
    handlePreviousPage,
    handleNextPage,
    requestSort,
    getSortIndicator,
    updateJobStatusOptimistically,
    
    // Translations
    translations,
    common,
    table,
    empty,
    pagination,
    actions,
    help
  } = useJobsTable({
    jobs: jobs || null,
    originalJobs: originalJobs || null,
    totalJobsCount: totalJobsCount || null,
    onRefresh,
    serverSidePagination,
    // Pass controlled state
    searchQuery: controlledSearchQuery,
    statusFilter: controlledStatusFilter,
    currentPage: controlledCurrentPage,
    pageSize: controlledPageSize,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
    // Pass callbacks
    onSearchChange,
    onStatusFilterChange,
    onPageChange,
    onPageSizeChange,
    onSortChange
  });

  // Check for error states first
  if (hasError) {
    if (isNetworkError) {
      return (
        <div className="flex flex-col">
          <NetworkErrorState 
            onRetry={onRefresh}
            message={error || "Unable to connect to the server. Please check your internet connection and try again."}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 text-6xl text-gray-300">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {error || "An error occurred while loading the job data. Please try again later."}
            </p>
            <Button onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        {/* Search and filter skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search jobs..." className="pl-10" disabled value="" />
          </div>
          <Select value="" disabled>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={common.search + " by status"} />
            </SelectTrigger>
            <SelectContent>
              {jobStatusOptions.map((option: { value: string; label: string }) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table skeleton */}
        <div className="table-container">
          <div className="table-scroll">
            <Table>
              <TableHeader className="table-header sticky top-0 z-20 bg-white border-b">
                <TableRow>
                  <TableHead className={cn("table-head table-head-border table-head-first")}>Job Title</TableHead>
                  <TableHead className={cn("table-head table-head-border")}>Applications</TableHead>
                  <TableHead className={cn("table-head table-head-border")}>Status</TableHead>
                  <TableHead className={cn("table-head table-head-border")}>Created</TableHead>
                  <TableHead className={cn("table-head table-head-border")}>Grade Levels</TableHead>
                  <TableHead className={cn("table-head table-head-border")}>Hiring Manager</TableHead>
                  <TableHead className={cn("table-head table-head-actions")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="table-body">
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="skeleton-primary" />
                        <Skeleton className="skeleton-secondary mt-2" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="skeleton-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="skeleton-badge" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="skeleton-date" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="skeleton-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                          <Skeleton className="skeleton-secondary" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-actions">
                      <div className="cell-content">
                        <Skeleton className="skeleton-action ml-auto" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="pagination-container">
          <div className="pagination-info">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="pagination-controls">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
   <div className="flex flex-col h-full min-h-0">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 overflow-visible flex-shrink-0">
        <div className="relative flex-1 overflow-visible">
          <Search className="absolute left-4 top-4 transform text-gray-400 h-4 w-4" />
          <Input
            ref={jobSearchInputRef}
            type="text"
            placeholder={common.search + " by title or grade level..."}
            value={jobSearchQuery ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (isValidStringLength(inputValue, 0, 100)) {
                setJobSearchQuery(sanitizeAndValidateInput(inputValue));
              }
            }}
            className="pl-10 w-full rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none border border-input mt-2 ml-2"
            aria-label={common.search + " jobs by title or grade level"}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const firstJobRow = document.querySelector('.table-row-hover') as HTMLElement;
                if (firstJobRow) {
                  firstJobRow.focus();
                }
              }
            }}
          />
          {jobsFilterLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-label="Loading">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-2">
          <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
            <SelectTrigger className="flex-grow sm:w-[180px]" aria-label={common.search + " jobs by status"}>
              <SelectValue placeholder={common.search + " by status"} />
            </SelectTrigger>
            <SelectContent>
              {jobStatusOptions.map((option: { value: string; label: string }) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {jobsFilterLoading && (
            <div className="flex items-center" aria-label="Loading">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh} 
              aria-label={common.refresh}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                  if (firstJobRow) {
                    firstJobRow.focus();
                  }
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
        
      {/* Display partial errors */}
      {jobsPartialErrors.map((error, index) => (
        <PartialErrorState
          key={`${error.type}-${index}`}
          title={`${error.type.replace('-', ' ')} issue`}
          message={error.message}
          severity={error.severity}
          onRetry={onRefresh}
        />
      ))}
    
      {/* Table Container - fills remaining space */}
      <div className="table-container h-full overflow-hidden">
        <div className="h-full overflow-auto">
          <table role="table" aria-label="Jobs table" aria-describedby="table-description">
            <caption id="table-description" className="sr-only">Job listings with title, applications, status, creation date, grade levels, hiring manager, and actions</caption>
            <TableHeader className="table-header sticky top-0 z-20 bg-white border-b">
              <TableRow role="row" className="border-l border-l-gray-200">
                <TableHead className={cn("table-head table-head-border table-head-first")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'title' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('title')}
                    aria-label={`Sort by title ${jobsSortConfig?.column === 'title' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                  >
                    {table.jobTitle}
                    {getSortIndicator('title') === 'asc' ? <ArrowUp className="h-4 w-4 opacity-50" /> : getSortIndicator('title') === 'desc' ? <ArrowDown className="h-4 w-4 opacity-50" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-border")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'total_applications' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('total_applications')}
                    aria-label={`Sort by applications`}
                  >
                    {table.applications}
                    {getSortIndicator('total_applications') === 'asc' ? '↑' : getSortIndicator('total_applications') === 'desc' ? '↓' : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-border")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'status' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('status')}
                    aria-label={`Sort by status`}
                  >
                    {table.status}
                    {getSortIndicator('status') === 'asc' ? '↑' : getSortIndicator('status') === 'desc' ? '↓' : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-border")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'created_at' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('created_at')}
                    aria-label={`Sort by created date`}
                  >
                    {table.created}
                    {getSortIndicator('created_at') === 'asc' ? '↑' : getSortIndicator('created_at') === 'desc' ? '↓' : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-border")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'grade_levels' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('grade_levels')}
                    aria-label={`Sort by grade levels ${jobsSortConfig?.column === 'grade_levels' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                  >
                    {table.gradeLevels}
                    {getSortIndicator('grade_levels') === 'asc' ? <ArrowUp className="h-4 w-4 opacity-50" /> : getSortIndicator('grade_levels') === 'desc' ? <ArrowDown className="h-4 w-4 opacity-50" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-border")} role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'hiring_name' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('hiring_name')}
                    aria-label={`Sort by hiring manager`}
                  >
                    {table.hiringManager}
                    {getSortIndicator('hiring_name') === 'asc' ? '↑' : getSortIndicator('hiring_name') === 'desc' ? '↓' : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className={cn("table-head table-head-actions")} role="columnheader" scope="col">{table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="flex-1 min-h-0 overflow-y-auto" role="rowgroup" aria-label="Jobs data">
              {paginatedJobs.length === 0 ? (
                <TableRow role="row">
                  <TableCell colSpan={7} className="text-center py-8" role="cell" aria-live="polite">
                    <div className="flex flex-col items-center justify-center">
                      {(() => {
                        // Check if filters are currently active
                        const isFilterActive = jobSearchQuery || jobStatusFilter !== 'ALL';
                        
                        // For server-side pagination, we check the total count without filters
                        // For client-side pagination, we check originalJobs
                        const hasOriginalJobs = serverSidePagination 
                          ? (totalJobsCount != null && totalJobsCount > 0)
                          : (originalJobs && originalJobs.length > 0);
                        
                        // If filters are active and no results match, show 'No Search Results'
                        if (isFilterActive && paginatedJobs.length === 0) {
                          return (
                            <div className="text-center">
                              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">{empty.noJobsMatchFilters}</h3>
                              <p className="text-muted-foreground mb-4">{empty.noJobsMatchFiltersDescription}</p>
                              <div className="flex justify-center gap-2">
                                <Button onClick={() => {
                                  setJobSearchQuery('');
                                  setJobStatusFilter('ALL');
                                }} variant="outline" aria-label={common.clearFilters}>
                                  {common.clearFilters}
                                </Button>
                                {onRefresh && (
                                  <Button onClick={onRefresh} variant="outline" aria-label={common.refreshList}>
                                    {common.refresh}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        } 
                        // If no original jobs exist and no filters are active, show 'No jobs available'
                        else if (!hasOriginalJobs) {
                          return (
                            <div className="text-center">
                              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">{empty.noJobsAvailable}</h3>
                              <p className="text-muted-foreground mb-4">{empty.noJobsAvailableDescription}</p>
                              {onRefresh && (
                                <Button onClick={onRefresh} variant="outline" className="mr-2" aria-label={common.refreshList}>
                                  {common.refresh}
                                </Button>
                              )}
                              <Button onClick={() => router.push('/jobs/create-job-post')} aria-label={common.createNewJob}>
                                {common.createNewJob}
                              </Button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center">
                              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">{empty.noJobsFound}</h3>
                              <p className="text-muted-foreground mb-4">{empty.noJobsFoundDescription}</p>
                              {onRefresh && (
                                <Button onClick={onRefresh} variant="outline" className="mr-2" aria-label={common.refreshList}>
                                  {common.refresh}
                                </Button>
                              )}
                              <Button onClick={() => router.push('/jobs/create-job-post')} aria-label={common.createNewJob}>
                                {common.createNewJob}
                              </Button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedJobs.map((job) => {
                  return (
                    <JobRow
                      key={job.id}
                      job={job}
                      statusColors={jobStatusColors}
                      handleCopyLink={handleCopyLink}
                      handleViewJob={handleViewJob}
                      updateJobStatusOptimistically={updateJobStatusOptimistically}
                      translations={{ actions }}
                    />
                  );
                })
              )}
            </TableBody>
          </table>
        </div>
          
        {/* Loading overlay - positioned within table container */}
        {isFetchingNextPage && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
              <span className="text-sm text-gray-600">Loading more jobs...</span>
            </div>
          </div>
        )}
      </div>
  
      {/* Pagination controls - Always visible at bottom */}
      <JobsPagination
        currentPage={jobsCurrentPage}
        totalPages={totalPages || 0}
        startIndex={startIndex}
        endIndex={endIndex}
        totalDisplayCount={totalDisplayCount}
        hasNextPage={hasNextPage ?? hasNextPageFromHook}
        hasPreviousPage={hasPreviousPage ?? hasPreviousPageFromHook}
        isFetchingNextPage={!!isFetchingNextPage}
        onLoadMore={handleNextPage}
        onLoadPrevious={handlePreviousPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        translations={{ common, pagination }}
        jobSearchInputRef={jobSearchInputRef as React.RefObject<HTMLInputElement>}
      />
    </div>
  );
}

// JobRow component remains the same as in your original code
const JobRow = React.memo(({ job, statusColors: jobStatusColors, handleCopyLink, handleViewJob, updateJobStatusOptimistically, translations }: any) => {
  const [focusedCell, setFocusedCell] = React.useState<number | null>(null);
  
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    handleCellKeyDown(e, 0);
  };
  
  const handleCellKeyDown = (e: React.SyntheticEvent, cellIndex: number) => {
    const event = e as React.KeyboardEvent<HTMLElement>;
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setFocusedCell(prev => (prev === null || prev >= 6) ? 0 : prev + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedCell(prev => (prev === null || prev <= 0) ? 6 : prev - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        const allRows = Array.from(document.querySelectorAll('[role="row"]'));
        const currentIndex = allRows.indexOf(e.currentTarget as Element);
        if (currentIndex < allRows.length - 1) {
          (allRows[currentIndex + 1] as HTMLElement).focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        const allRowsUp = Array.from(document.querySelectorAll('[role="row"]'));
        const currentIndexUp = allRowsUp.indexOf(e.currentTarget as Element);
        if (currentIndexUp > 0) {
          (allRowsUp[currentIndexUp - 1] as HTMLElement).focus();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (cellIndex === 6) {
          const rowElement = e.currentTarget as HTMLElement;
          const firstButton = rowElement.querySelector('button');
          if (firstButton) {
            (firstButton as HTMLElement).focus();
          }
        } else if (cellIndex === 0) {
          handleViewJob(job.id);
        }
        break;
    }
  };
  
  return (
    <TableRow 
      key={job.id} 
      className="table-row-hover"
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      role="row"
      aria-label={`Job ${job.title}, Status: ${job.status}, Applications: ${job.application_analytics.total_applications || 0}`}
      onFocus={() => setFocusedCell(null)}
    >
      <TableCell 
        className={`table-cell-border ${focusedCell === 0 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 0)}
        role="gridcell"
      >
        <div className="cell-content">
          <span className="job-title truncate max-w-xs">{sanitizeInput(job.title)}</span>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 1 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 1)}
        role="gridcell"
      >
        <div className="cell-content">
          <span className="job-applications">{formatNumber(job.application_analytics.total_applications || 0)}</span>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 2 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 2)}
        role="gridcell"
      >
        <div className="cell-content">
          <Badge
            className={cn(
              "capitalize font-medium",
              jobStatusColors[job.status] || "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            {job.status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 3 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 3)}
        role="gridcell"
      >
        <div className="cell-content">
          <span className="job-date">{formatDate(job.created_at, DatePresets.CUSTOM_MDY)}</span>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 4 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 4)}
        role="gridcell"
      >
        <div className="cell-content">
          <div className="job-grade-levels flex flex-wrap gap-1">
            {job.grade_levels && job.grade_levels.length > 0 && (
              job.grade_levels.length > 1 ? (
                // Show tooltip when there are additional grades
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-wrap gap-1">
                      {/* First grade as a badge */}
                      <Badge variant="secondary" className="text-xs">
                        {sanitizeInput(job.grade_levels[0])}
                      </Badge>
                      {/* Count of remaining grades as a second badge */}
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                        +{job.grade_levels.length - 1}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      {job.grade_levels.slice(1).map((grade: string, index: number) => (
                        <span key={index}>
                          {sanitizeInput(grade)}
                          {index < job.grade_levels.slice(1).length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                // Show only the first grade without tooltip when there's only one grade
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {sanitizeInput(job.grade_levels[0])}
                  </Badge>
                </div>
              )
            )}
            {!job.grade_levels || job.grade_levels.length === 0 && (
              <span className="text-xs text-gray-500">-</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 5 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 5)}
        role="gridcell"
      >
        <div className="cell-content">
          {(job.hiring && job.hiring.first_name && job.hiring.last_name) ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={job.hiring.avatar || ''} alt="Hiring Manager" />
                <AvatarFallback>{sanitizeInput(job.hiring.first_name)[0]}{sanitizeInput(job.hiring.last_name)[0]}</AvatarFallback>
              </Avatar>
              <span className="job-manager">{sanitizeInput(job.hiring.first_name)} {sanitizeInput(job.hiring.last_name)}</span>
            </div>
          ) : <span className="job-manager">-</span>}
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-actions ${focusedCell === 6 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 6)}
        role="gridcell"
      >
        <div className="cell-content">
          <JobActionButtons
            jobId={job.id}
            onCopyLink={handleCopyLink}
            onViewJob={handleViewJob}
            translations={translations}
          />
        </div>
      </TableCell>
    </TableRow>
  );
});

export const JobsTable = React.memo(JobsTableComponent);