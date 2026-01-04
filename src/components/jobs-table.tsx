"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { Search, ChevronLeft, ChevronRight, Eye, Copy, RefreshCw, ArrowUpDown, Briefcase, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getJobCount } from '@/lib/supabase/api/get-job-count';
import { requestDeduplicator, generateRequestKey } from '@/lib/request-deduplicator';
import { updateJobStatus } from '@/lib/supabase/api/update-job-status';
import NetworkErrorState from '@/components/network-error-state';
import PartialErrorState from '@/components/partial-error-state';
import '@/styles/jobs.css';
import { useTranslations } from '@/contexts/i18n-context';
import { formatDate, DatePresets } from '@/lib/date-formatter';
import { formatNumber } from '@/lib/number-formatter';
import { formatCurrency, formatSalaryRange } from '@/lib/currency-formatter';
import { sanitizeInput } from '@/lib/sanitize';
import { isValidStringLength, sanitizeAndValidateInput } from '@/lib/data-validation';
import { Job, JobsTableProps, JobRowProps, SortConfig, PartialError, StatusOption } from '@/types/jobs-table';
import { filterJobs, sortJobs, paginateJobs, calculatePaginationDetails } from '@/lib/job-utils';
import { JobStatusDropdown } from '@/components/jobs-table/job-status-dropdown';
import { JobActionButtons } from '@/components/jobs-table/job-action-buttons';
import { JobsPagination } from '@/components/jobs-table/jobs-pagination';

function JobsTableComponent({ jobs, originalJobs, totalJobsCount, loading = false, onRefresh, hasNextPage, onLoadMore, hasPreviousPage, onLoadPrevious, isFetchingNextPage, isFetchingPreviousPage, error, hasError, isNetworkError }: JobsTableProps) {
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
    undoLastAction,
    
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
    onRefresh
  });

  // Check for error states first
  if (hasError) {
    if (isNetworkError) {
      // Show network error state
      return (
        <div className="flex flex-col h-full">
          <NetworkErrorState 
            onRetry={onRefresh}
            message={error || "Unable to connect to the server. Please check your internet connection and try again."}
          />
        </div>
      );
    } else {
      // Show general error state
      return (
        <div className="flex flex-col h-full">
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
      <div className="flex flex-col h-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              disabled
            />
          </div>
          <Select disabled>
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

        <div className="table-container">
          <div className="table-scroll">
            <Table>
              <TableHeader className="table-header">
                <TableRow>
                  <TableHead className="table-head table-head-border">Job Title</TableHead>
                  <TableHead className="table-head table-head-border">Applications</TableHead>
                  <TableHead className="table-head table-head-border">Status</TableHead>
                  <TableHead className="table-head table-head-border">Created</TableHead>
                  <TableHead className="table-head table-head-border">Grade Levels</TableHead>
                  <TableHead className="table-head table-head-border">Hiring Manager</TableHead>
                  <TableHead className="table-head table-head-border">Salary</TableHead>
                  <TableHead className="table-head table-head-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="table-body">
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-actions">
                      <div className="cell-content">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Skeleton - Always shown at bottom */}
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
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={jobSearchInputRef}
            placeholder={common.search + " by title or grade level..."}
            value={jobSearchQuery ?? ""}
            onChange={(e) => {
              // Validate and sanitize the input
              const inputValue = e.target.value;
              if (isValidStringLength(inputValue, 0, 100)) { // Max 100 chars
                setJobSearchQuery(sanitizeAndValidateInput(inputValue));
              }
            }}
            className="pl-10"
            aria-label={common.search + " jobs by title or grade level"}
            aria-describedby="search-help-text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Move focus to the first job row when Enter is pressed
                const firstJobRow = document.querySelector('.table-row-hover') as HTMLElement;
                if (firstJobRow) {
                  firstJobRow.focus();
                }
              }
            }}
          />
          <p id="search-help-text" className="sr-only">{help.search}</p>
          {jobsFilterLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-label="Loading">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex gap-4">
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
                  // If tab on refresh button, move to first element in table
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

      {/* Table Container - Using the same structure as candidates page */}
      <div className="table-container">
        <div className="table-scroll">
          <Table role="table" aria-label="Jobs table" aria-describedby="table-description">
            <caption id="table-description" className="sr-only">Job listings with title, applications, status, creation date, grade levels, hiring manager, and actions</caption>
            <TableHeader className="table-header">
              <TableRow role="row">
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'title' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('title')}
                    aria-label={`Sort by title ${jobsSortConfig?.column === 'title' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.jobTitle}
                    {getSortIndicator('title')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'total_applications' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('total_applications')}
                    aria-label={`Sort by applications ${jobsSortConfig?.column === 'total_applications' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.applications}
                    {getSortIndicator('total_applications')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'status' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('status')}
                    aria-label={`Sort by status ${jobsSortConfig?.column === 'status' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.status}
                    {getSortIndicator('status')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'created_at' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('created_at')}
                    aria-label={`Sort by created date ${jobsSortConfig?.column === 'created_at' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.created}
                    {getSortIndicator('created_at')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'grade_levels' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('grade_levels')}
                    aria-label={`Sort by grade levels ${jobsSortConfig?.column === 'grade_levels' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.gradeLevels}
                    {getSortIndicator('grade_levels')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col" aria-sort={jobsSortConfig?.column === 'hiring_name' ? (jobsSortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto justify-start"
                    onClick={() => requestSort('hiring_name')}
                    aria-label={`Sort by hiring manager ${jobsSortConfig?.column === 'hiring_name' ? jobsSortConfig.direction === 'asc' ? '(ascending)' : '(descending)' : '(not sorted)'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus to the first job row when tabbing from sort button
                        const firstJobRow = document.querySelector('[role="row"]') as HTMLElement;
                        if (firstJobRow) {
                          firstJobRow.focus();
                        }
                      }
                    }}
                  >
                    {table.hiringManager}
                    {getSortIndicator('hiring_name')}
                  </Button>
                </TableHead>
                <TableHead className="table-head table-head-border" role="columnheader" scope="col">Salary</TableHead>
                <TableHead className="table-head table-head-actions" role="columnheader" scope="col">{table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="table-body" role="rowgroup" aria-label="Jobs data">
              {paginatedJobs.length === 0 ? (
                <TableRow role="row">
                  <TableCell colSpan={8} className="text-center py-8" role="cell" aria-live="polite">
                    <div className="flex flex-col items-center justify-center">
                      {(() => {
                        if (originalJobs && originalJobs.length === 0) {
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
                              <div className="sr-only">No jobs available to display</div>
                            </div>
                          );
                        } else if (jobSearchQuery || jobStatusFilter !== 'ALL') {
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
                              <div className="sr-only">No jobs match the current filters</div>
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
                              <div className="sr-only">No jobs match the current criteria</div>
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
                      undoLastAction={undoLastAction}
                      translations={{
                        actions
                      }}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination controls - Always shown at bottom */}
      <JobsPagination
        currentPage={jobsCurrentPage}
        totalPages={totalPages || 0}
        startIndex={startIndex}
        endIndex={endIndex}
        totalDisplayCount={totalDisplayCount}
        hasNextPage={!!hasNextPage}
        hasPreviousPage={!!hasPreviousPage}
        isFetchingNextPage={!!isFetchingNextPage}
        onLoadMore={handleNextPage}
        onLoadPrevious={handlePreviousPage}
        translations={{
          common,
          pagination
        }}
        jobSearchInputRef={jobSearchInputRef as React.RefObject<HTMLInputElement>}
      />
    </div>
  );
}


const JobRow = React.memo(({ job, statusColors: jobStatusColors, handleCopyLink, handleViewJob, updateJobStatusOptimistically, undoLastAction, translations }: JobRowProps) => {
  const [focusedCell, setFocusedCell] = React.useState<number | null>(null); // Track which cell is focused
  
  // Handle keyboard navigation within the row
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    handleCellKeyDown(e, 0);
  };
  
  const handleCellKeyDown = (e: React.SyntheticEvent, cellIndex: number) => {
    // Type assertion to handle different element types
    const event = e as React.KeyboardEvent<HTMLElement>;
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setFocusedCell(prev => (prev === null || prev >= 7) ? 0 : prev + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedCell(prev => (prev === null || prev <= 0) ? 7 : prev - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        // Move to the same cell in the next row - handled by parent component
        const allRows = Array.from(document.querySelectorAll('[role="row"]'));
        const currentIndex = allRows.indexOf(e.currentTarget as Element);
        if (currentIndex < allRows.length - 1) {
          (allRows[currentIndex + 1] as HTMLElement).focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Move to the same cell in the previous row - handled by parent component
        const allRowsUp = Array.from(document.querySelectorAll('[role="row"]'));
        const currentIndexUp = allRowsUp.indexOf(e.currentTarget as Element);
        if (currentIndexUp > 0) {
          (allRowsUp[currentIndexUp - 1] as HTMLElement).focus();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Activate the primary action for the current cell
        if (cellIndex === 6) { // Actions cell
          // Focus on the first action button
          const rowElement = e.currentTarget as HTMLElement;
          const firstButton = rowElement.querySelector('button');
          if (firstButton) {
            (firstButton as HTMLElement).focus();
          }
        } else if (cellIndex === 0) { // Title cell
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
      aria-label={`Job ${job.title}, Status: ${job.status}, Applications: ${job.application_analytics.total_applications || 0}, Created: ${new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
      onFocus={(e) => {
        // When the row gets focus, reset the focused cell
        setFocusedCell(null);
      }}
    >
      <TableCell 
        className={`table-cell-border ${focusedCell === 0 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 0)}
        role="gridcell"
      >
        <div className="cell-content">
          <div className="flex flex-col">
            <span>{sanitizeInput(job.title)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 1 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 1)}
        role="gridcell"
      >
        <div className="cell-content">
          <div className="font-medium">{formatNumber(job.application_analytics.total_applications || 0)}</div>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 2 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 2)}
        role="gridcell"
      >
        <div className="cell-content">
          <JobStatusDropdown
            status={job.status}
            statusColors={jobStatusColors}
            onStatusChange={(newStatus) => updateJobStatusOptimistically(job.id, newStatus)}
          />
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 3 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 3)}
        role="gridcell"
      >
        <div className="cell-content">
          {formatDate(job.created_at, DatePresets.CUSTOM_MDY)}
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 4 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 4)}
        role="gridcell"
      >
        <div className="cell-content">
          <div className="flex flex-wrap gap-1">
            {job.grade_levels?.slice(0, 2).map((grade) => (
              <Badge key={grade} variant="secondary" className="text-xs">
                {sanitizeInput(grade)}
              </Badge>
            ))}
            {job.grade_levels && job.grade_levels.length > 2 && (
              <div className="w-full flex flex-wrap gap-1 mt-1">
                {job.grade_levels.slice(2).map((grade) => (
                  <Badge key={grade} variant="secondary" className="text-xs">
                    {sanitizeInput(grade)}
                  </Badge>
                ))}
              </div>
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
          {(job.hiring && job.hiring.first_name && job.hiring.last_name)  ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={job.hiring.avatar || ''} alt="Hiring Manager" />
                <AvatarFallback>{sanitizeInput(job.hiring.first_name)[0]}{sanitizeInput(job.hiring.last_name)[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{sanitizeInput(job.hiring.first_name)}{sanitizeInput(job.hiring.last_name)}</span>
            </div>
          ): <div>-</div>}
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-border ${focusedCell === 6 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 6)}
        role="gridcell"
      >
        <div className="cell-content">
          <div className="font-medium">
            {job.min_salary !== undefined || job.max_salary !== undefined 
              ? formatSalaryRange(job.min_salary, job.max_salary, job.currency || 'USD')
              : 'Not specified'}
          </div>
        </div>
      </TableCell>
      <TableCell 
        className={`table-cell-actions ${focusedCell === 7 ? 'focus:outline focus:outline-2 focus:outline-blue-500' : ''}`}
        tabIndex={-1}
        onKeyDown={(e) => handleCellKeyDown(e, 7)}
        role="gridcell"
      >
        <div className="cell-content">
          <JobActionButtons
            jobId={job.id}
            onCopyLink={handleCopyLink}
            onViewJob={handleViewJob}
            onUndo={undoLastAction}
            translations={translations}
            showUndo={true}
          />
        </div>
      </TableCell>
    </TableRow>
  );
});

export const JobsTable = React.memo(JobsTableComponent);