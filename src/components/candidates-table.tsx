"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, RefreshCw, ArrowUpDown, User, FileText, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import '@/styles/candidates.css';
import { formatDate, DatePresets } from '@/lib/date-formatter';
import { formatNumber } from '@/lib/number-formatter';
import { sanitizeInput } from '@/lib/sanitize';
import { isValidStringLength, sanitizeAndValidateInput } from '@/lib/data-validation';
import { statusColors } from '../../utils/statusColor';
import { GenericHoverCard } from '@/components/ui/generic-hover-card';

// Define the Application interface
interface Application {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  score: number;
  demo_score: number;
  application_status: string;
  job_title: string;
  created_at: string;
  job_id: string;
  application_id: string;
}

// Define the CandidatesTable props interface
interface CandidatesTableProps {
  applications: Application[];
  originalApplications: Application[] | null;
  totalApplicationsCount: number | null;
  loading?: boolean;
  onRefresh?: () => void;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  hasPreviousPage?: boolean;
  onLoadPrevious?: () => void;
  isFetchingNextPage?: boolean;
  isFetchingPreviousPage?: boolean;
  error?: string | null;
  hasError?: boolean;
  isNetworkError?: boolean;
  serverSidePagination?: boolean;

  // Controlled state
  searchQuery?: string;
  statusFilter?: string;
  currentPage?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';

  // Callbacks
  onSearchChange?: (query: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
}

// Status configuration
const STATUS_CONFIG = {
  in_progress: { text: 'In Progress', color: statusColors.in_progress },
  application_submitted: { text: 'Application Submitted', color: statusColors.application_submitted },
  assessment_in_progress: { text: 'Assessment In Progress', color: statusColors.assessment_in_progress },
  assessment_in_evaluation: { text: 'Assessment In Evaluation', color: statusColors.assessment_in_evaluation },
  assessment_evaluated: { text: 'Assessment Evaluated', color: statusColors.assessment_evaluated },
  assessment_questionnaire_creation: { text: 'Assessment Questionnaire Creation', color: statusColors.assessment_questionnaire_creation },
  assessment_ready: { text: 'Assessment Ready', color: statusColors.assessment_ready },
  assessment_failed: { text: 'Assessment Failed', color: statusColors.assessment_failed },
  demo_creation: { text: 'Demo Creation', color: statusColors.demo_creation },
  demo_ready: { text: 'Demo Ready', color: statusColors.demo_ready },
  demo_in_progress: { text: 'Demo In Progress', color: statusColors.demo_in_progress },
  demo_in_evaluation: { text: 'Demo In Evaluation', color: statusColors.demo_in_evaluation },
  demo_evaluated: { text: 'Demo Evaluated', color: statusColors.demo_evaluated },
  demo_failed: { text: 'Demo Failed', color: statusColors.demo_failed },
  interview_in_progress: { text: 'Interview In Progress', color: statusColors.interview_in_progress },
  interview_ready: { text: 'Interview Ready', color: statusColors.interview_ready },
  interview_scheduled: { text: 'Interview Scheduled', color: statusColors.interview_scheduled },
  paused: { text: 'Paused', color: statusColors.paused },
  completed: { text: 'Completed', color: statusColors.completed },
  suspended: { text: 'Suspended', color: statusColors.suspended },
  appealed: { text: 'Appealed', color: statusColors.appealed },
  withdrawn: { text: 'Withdrawn', color: statusColors.withdrawn },
  offered: { text: 'Offered', color: statusColors.offered },
  panelist_review_in_progress: { text: 'Panelist Review In Progress', color: statusColors.panelist_review_in_progress },
} as const;

// Status filter options
const APPLICATION_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'application_%', label: 'Application Stage' },
  { value: 'assessment_%', label: 'MCQ Assessment Stage' },
  { value: 'demo_%', label: 'Demo Assessment Stage' },
  { value: 'interview_%', label: 'Interview Stage' },
  { value: 'panelist_%', label: 'Panelist Stage' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'appealed', label: 'Appealed' },
  { value: 'suspended', label: 'Suspended' },
];

// Status colors mapping
const APPLICATION_STATUS_COLORS: Record<string, string> = {
  in_progress: statusColors.in_progress,
  application_submitted: statusColors.application_submitted,
  assessment_in_progress: statusColors.assessment_in_progress,
  assessment_in_evaluation: statusColors.assessment_in_evaluation,
  assessment_evaluated: statusColors.assessment_evaluated,
  assessment_ready: statusColors.assessment_ready,
  assessment_failed: statusColors.assessment_failed,
  demo_creation: statusColors.demo_creation,
  demo_ready: statusColors.demo_ready,
  demo_in_progress: statusColors.demo_in_progress,
  demo_in_evaluation: statusColors.demo_in_evaluation,
  demo_evaluated: statusColors.demo_evaluated,
  demo_failed: statusColors.demo_failed,
  interview_in_progress: statusColors.interview_in_progress,
  interview_ready: statusColors.interview_ready,
  interview_scheduled: statusColors.interview_scheduled,
  paused: statusColors.paused,
  completed: statusColors.completed,
  suspended: statusColors.suspended,
  appealed: statusColors.appealed,
  withdrawn: statusColors.withdrawn,
  offered: statusColors.offered,
  panelist_review_in_progress: statusColors.panelist_review_in_progress,
};

// Translations
const translations = {
  common: {
    search: "Search",
    refresh: "Refresh",
    refreshList: "Refresh List",
    previous: "Previous",
    loadMore: "Load More",
    loading: "Loading",
    createNewCandidate: "Create New Candidate",
  },
  empty: {
    noCandidatesFound: "No candidates found",
    noCandidatesFoundDescription: "Try adjusting your search or filter criteria",
    noSearchResults: "No search results",
    noSearchResultsDescription: "Try different search terms",
  },
  actions: {
    view: "View",
    copyLink: "Copy Link",
    copied: "Copied!",
  },
  pagination: {
    showing: "Showing",
    to: "to",
    of: "of",
    candidates: "candidates",
    page: "Page",
    ofTotal: "of",
  },
  status: {
    all: "All Statuses",
  }
};

function CandidatesTableComponent({
  applications,
  originalApplications,
  totalApplicationsCount,
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
}: CandidatesTableProps) {
  const router = useRouter();

  // State for uncontrolled components if not provided
  const [localSearchQuery, setLocalSearchQuery] = useState(controlledSearchQuery || '');
  const [localStatusFilter, setLocalStatusFilter] = useState(controlledStatusFilter || 'ALL');
  const [localCurrentPage, setLocalCurrentPage] = useState(controlledCurrentPage || 0);
  const [localPageSize, setLocalPageSize] = useState(controlledPageSize || 20);
  const [localSortColumn, setLocalSortColumn] = useState(controlledSortColumn || 'created_at');
  const [localSortDirection, setLocalSortDirection] = useState(controlledSortDirection || 'desc');

  // Refs
  const candidateSearchInputRef = useRef<HTMLInputElement>(null);

  // State for tracking operations
  const [isSorting, setIsSorting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [jobsFilterLoading, setJobsFilterLoading] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const searchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : localSearchQuery;
  const statusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : localStatusFilter;
  const currentPage = controlledCurrentPage !== undefined ? controlledCurrentPage : localCurrentPage;
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : localPageSize;
  const sortColumn = controlledSortColumn !== undefined ? controlledSortColumn : localSortColumn;
  const sortDirection = controlledSortDirection !== undefined ? controlledSortDirection : localSortDirection;


  // Apply controlled state updates
  const handleSearchChange = useCallback((query: string) => {
    if (onSearchChange) {
      setIsFiltering(true);
      setJobsFilterLoading(true);
      onSearchChange(query);
      // Reset filtering state after a short delay
      setTimeout(() => {
        setIsFiltering(false);
        setJobsFilterLoading(false);
      }, 300);
    } else {
      setLocalSearchQuery(query);
    }
  }, [onSearchChange]);

  const handleStatusFilterChange = useCallback((status: string) => {
    if (onStatusFilterChange) {
      setIsFiltering(true);
      setJobsFilterLoading(true);
      onStatusFilterChange(status);
      // Reset filtering state after a short delay
      setTimeout(() => {
        setIsFiltering(false);
        setJobsFilterLoading(false);
      }, 300);
    } else {
      setLocalStatusFilter(status);
    }
  }, [onStatusFilterChange]);

  const handlePageChange = useCallback((page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setLocalCurrentPage(page);
    }
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      setLocalPageSize(size);
    }
  }, [onPageSizeChange]);

  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc') => {
    if (onSortChange) {
      // Track sorting operation
      setIsSorting(true);
      setJobsFilterLoading(true);
      onSortChange(column, direction);
      // Reset sorting state after a short delay to allow UI update
      setTimeout(() => {
        setIsSorting(false);
        setJobsFilterLoading(false);
      }, 300);
    } else {
      setLocalSortColumn(column);
      setLocalSortDirection(direction);
    }
  }, [onSortChange]);

  // Filter applications based on search and status
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter(app => {
      const matchesSearch = !searchQuery || 
        app.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || app.application_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Calculate pagination details
  const paginationDetails = useMemo(() => {
    const totalItems = serverSidePagination ? totalApplicationsCount || 0 : filteredApplications.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const totalDisplayCount = serverSidePagination ? totalApplicationsCount || 0 : filteredApplications.length;

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      totalDisplayCount
    };
  }, [serverSidePagination, totalApplicationsCount, filteredApplications.length, pageSize, currentPage]);

  // Get paginated applications
  const paginatedApplications = useMemo(() => {
    if (serverSidePagination) {
      return applications;
    }

    return filteredApplications.slice(
      paginationDetails.startIndex,
      paginationDetails.endIndex
    );
  }, [serverSidePagination, applications, filteredApplications, paginationDetails.startIndex, paginationDetails.endIndex]);

  // Handle viewing an application
  const handleViewApplication = useCallback((jobId: string, applicationId: string) => {
    router.push(`/jobs/${jobId}/${applicationId}`);
  }, [router]);

  // Handle copying link
  const handleCopyLink = useCallback(async (jobId: string, applicationId: string) => {
    try {
      const url = `${window.location.origin}/jobs/${jobId}/${applicationId}`;
      await navigator.clipboard.writeText(url);
      // Optionally show a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Handle next page
  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [hasNextPage, currentPage, handlePageChange]);

  // Handle previous page
  const handlePreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, handlePageChange]);



  // Handle sort
  const handleSort = useCallback((column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    handleSortChange(column, newDirection);
  }, [sortColumn, sortDirection, handleSortChange]);

  // Get sort indicator
  const getSortIndicator = useCallback((column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  }, [sortColumn, sortDirection]);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || 
      { text: status, color: 'bg-gray-100 text-gray-800' };
  }, []);

  // Determine if it's initial loading (no data yet) or just refreshing data
  const isInitialLoading = loading && (!applications || applications.length === 0);

  if (isInitialLoading) {
    return (
      <div className="candidates-table-container flex flex-col h-full min-h-0">
        {/* Search and filter skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search candidates..." className="pl-10" disabled value="" />
          </div>
          <Select value="" disabled>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={translations.common.search + " by status"} />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Table skeleton */}
        <div className="flex-1 min-h-0 border rounded-md bg-white overflow-hidden mb-4">
          <div className="h-full overflow-auto">
            <table className="w-full caption-bottom text-sm relative">
              <TableHeader className="sticky top-0 z-20 bg-white border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn("table-head table-head-border table-head-first bg-white")}>
                    <div className="flex items-center gap-1 cell-content">
                      Candidate
                    </div>
                  </TableHead>
                  <TableHead className={cn("table-head table-head-border bg-white")}>
                    <div className="flex items-center gap-1 cell-content">
                      Job Applied
                    </div>
                  </TableHead>
                  <TableHead className={cn("table-head table-head-border bg-white")}>
                    <div className="flex items-center gap-1 cell-content">
                      Status
                    </div>
                  </TableHead>
                  <TableHead className={cn("table-head table-head-border table-head-assessment bg-white")}>
                    <div className="assessment-header">
                      <span>Assessment</span>
                    </div>
                    <div className="assessment-subheader">
                      <span className="assessment-col">M</span>
                      <span className="assessment-col">V</span>
                      <span className="assessment-col-last">I</span>
                    </div>
                  </TableHead>
                  <TableHead className={cn("table-head table-head-border bg-white")}>
                    <div className="flex items-center gap-1 cell-content">
                      Date Applied
                    </div>
                  </TableHead>
                  <TableHead className={cn("table-head table-head-actions bg-white")}>
                    <div className="table-head-content cell-content">Actions</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody role="rowgroup" aria-label="Candidates data">
                {/* Skeleton rows */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="table-row-hover">
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <p className="candidate-name">
                          <Skeleton className="h-4 w-3/4 bg-gray-200" />
                        </p>
                        <p className="candidate-email">
                          <Skeleton className="h-3 w-1/2 bg-gray-200 mt-1" />
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell-border candidate-job">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-3/4 bg-gray-200" />
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-6 w-1/3 bg-gray-200 rounded-md" />
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell-border table-cell-assessment">
                      <div className="assessment-scores">
                        <span className="assessment-value">
                          <Skeleton className="h-4 w-8 bg-gray-200" />
                        </span>
                        <span className="assessment-value">
                          <Skeleton className="h-4 w-8 bg-gray-200" />
                        </span>
                        <span className="assessment-value-disabled">
                          <Skeleton className="h-4 w-8 bg-gray-200" />
                        </span>
                      </div>
                      <div className="assessment-spacer">&nbsp;</div>
                    </TableCell>
                    
                    <TableCell className="table-cell-border candidate-date">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-1/2 bg-gray-200" />
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell-actions">
                      <div className="cell-content">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
                          <Skeleton className="h-8 w-8 rounded-md bg-gray-200" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="pagination-container flex-shrink-0 w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="pagination-info">
            <Skeleton className="h-4 w-48 bg-gray-200" />
          </div>
          
          <div className="pagination-controls flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Skeleton className="h-4 w-24 bg-gray-200" />
              <Skeleton className="h-8 w-20 bg-gray-200" />
            </div>
            
            <div className="flex gap-2 flex-wrap justify-center">
              <Skeleton className="h-8 w-24 bg-gray-200" />
              <Skeleton className="h-8 w-24 bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="candidates-table-container flex flex-col h-full min-h-0">
  {/* Search and Filters - Fixed at top */}
  <div className="flex flex-col sm:flex-row gap-4 mb-4 overflow-visible flex-shrink-0">
    <div className="relative flex-1 overflow-visible">
      <Search className="absolute left-4 top-5 transform text-gray-400 h-4 w-4" />
      <Input
        ref={candidateSearchInputRef}
        type="text"
        placeholder="Search candidates by name, email, job..."
        value={searchQuery}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (isValidStringLength(inputValue, 0, 100)) {
            handleSearchChange(sanitizeAndValidateInput(inputValue));
          }
        }}
        className="pl-10 w-full rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none border border-input mt-2 ml-2"
        aria-label="Search candidates by name, email, job"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const firstCandidateRow = document.querySelector('.table-row-hover') as HTMLElement;
            if (firstCandidateRow) {
              firstCandidateRow.focus();
            }
          }
        }}
      />
      
    </div>
    <div className="flex gap-4 mt-2">
      <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
        <SelectTrigger className="flex-grow sm:w-[180px]" aria-label={translations.common.search + " candidates by status"}>
          <SelectValue placeholder={translations.common.search + " by status"} />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
     
      {onRefresh && (
        <Button
          variant="outline"
          onClick={handleRefresh}
          aria-label={translations.common.refresh}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              const firstCandidateRow = document.querySelector('[role="row"]') as HTMLElement;
              if (firstCandidateRow) {
                firstCandidateRow.focus();
              }
            }
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>

  {/* Table Container - Custom wrapper with fixed header */}
  <div className="flex-1 min-h-0 border rounded-md bg-white overflow-hidden">
    <div className="h-full overflow-auto">
      {/* Use native table element to bypass Table component's wrapper */}
      <table className="w-full caption-bottom text-sm relative">
        <TableHeader className="sticky top-0 z-20 bg-white border-b">
          <TableRow className="hover:bg-transparent">
            <TableHead 
              className={cn("table-head table-head-border table-head-first bg-white border-l", "cursor-pointer hover:bg-gray-50")}
              onClick={() => handleSort('candidate')}
            >
              <div className="flex items-center gap-1 cell-content">
                Candidate
                {getSortIndicator('candidate')}
              </div>
            </TableHead>
            <TableHead 
              className={cn("table-head table-head-border bg-white", "cursor-pointer hover:bg-gray-50")}
              onClick={() => handleSort('job_title')}
            >
              <div className="flex items-center gap-1 cell-content">
                Job Applied
                {getSortIndicator('job_title')}
              </div>
            </TableHead>
            <TableHead 
              className={cn("table-head table-head-border bg-white", "cursor-pointer hover:bg-gray-50")}
              onClick={() => handleSort('application_status')}
            >
              <div className="flex items-center gap-1 cell-content">
                Status
                {getSortIndicator('application_status')}
              </div>
            </TableHead>
            <TableHead className={cn("table-head table-head-border table-head-assessment bg-white")}>
              <div className="assessment-header">
                <span>Assessment</span>
              </div>
              <div className="assessment-subheader">
                <span className="assessment-col cell-content">M</span>
                <span className="assessment-col cell-content">V</span>
                <span className="assessment-col-last cell-content">I</span>
              </div>
            </TableHead>
            <TableHead 
              className={cn("table-head table-head-border bg-white", "cursor-pointer hover:bg-gray-50")}
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center gap-1 cell-content">
                Date Applied
                {getSortIndicator('created_at')}
              </div>
            </TableHead>
            <TableHead className={cn("table-head table-head-actions bg-white")}>
              <div className="table-head-content cell-content">Actions</div>
            </TableHead>
          </TableRow>
        </TableHeader>
       
        <TableBody role="rowgroup" aria-label="Candidates data">
  
          {paginatedApplications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8" role="cell">
                <div className="flex flex-col items-center justify-center">
                  {(() => {
                    const isFilterActive = searchQuery || statusFilter !== 'ALL';
                    const hasOriginalApplications = serverSidePagination 
                      ? (totalApplicationsCount != null && totalApplicationsCount > 0)
                      : (originalApplications && originalApplications.length > 0);
                    
                    if (isFilterActive && paginatedApplications.length === 0) {
                      return (
                        <div className="text-center">
                          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">{translations.empty.noSearchResults}</h3>
                          <p className="text-muted-foreground mb-4">{translations.empty.noSearchResultsDescription}</p>
                          <Button onClick={() => {
                            handleSearchChange('');
                            handleStatusFilterChange('ALL');
                          }} variant="outline" className="mr-2">
                            Clear Filters
                          </Button>
                          {onRefresh && (
                            <Button onClick={handleRefresh} variant="outline">
                              {translations.common.refresh}
                            </Button>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center">
                          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">{translations.empty.noCandidatesFound}</h3>
                          <p className="text-muted-foreground mb-4">{translations.empty.noCandidatesFoundDescription}</p>
                          {onRefresh && (
                            <Button onClick={handleRefresh} variant="outline" className="mr-2">
                              {translations.common.refresh}
                            </Button>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedApplications.map((application) => (
              <ApplicationRow
                key={`${application.application_id}-${application.job_id}`}
                application={application}
                statusColors={APPLICATION_STATUS_COLORS}
                handleCopyLink={handleCopyLink}
                handleViewApplication={handleViewApplication}
                translations={{ actions: translations.actions }}
              />
            ))
          )}
        </TableBody>
      </table>
      
      {/* Loading overlay - positioned within table container */}
      {(isFetchingNextPage || jobsFilterLoading) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
            <span className="text-sm text-gray-600">
              {isFetchingNextPage ? 'Loading more candidates...' : 
               isSorting ? 'Refreshing candidates...' : 
               isFiltering ? 'Updating candidates...' : 
               'Loading candidates...'}
            </span>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Pagination - Fixed at bottom */}
 <div className="pagination-container flex-shrink-0 w-full flex items-center justify-between gap-4 py-2" role="navigation" aria-label="Pagination">
  <div className="pagination-info flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 justify-between">
    <div aria-live="polite">
      {translations.pagination.showing} <span className="pagination-value">{formatNumber(paginationDetails.startIndex + 1)}</span> {translations.pagination.to}{' '}
      <span className="pagination-value">{formatNumber(paginationDetails.endIndex || 0)}</span> {translations.pagination.of}{' '}
      <span className="pagination-value">{formatNumber(paginationDetails.totalDisplayCount)}</span> {translations.pagination.candidates}
      <span className="sr-only">{translations.pagination.page} {currentPage + 1} {translations.pagination.ofTotal} {paginationDetails.totalPages || 1}</span>
    </div>
    
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Rows per page:</span>
      <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
        <SelectTrigger className="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="30">30</SelectItem>
          <SelectItem value="40">40</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <div className="pagination-controls flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handlePreviousPage}
      disabled={!hasPreviousPage}
      className="pagination-btn"
      aria-label={translations.common.previous + " page"}
    >
      <ArrowLeft className="btn-icon" />
      <span className="hidden sm:inline-block ml-2">{translations.common.previous}</span>
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={handleNextPage}
      disabled={!hasNextPage || isFetchingNextPage}
      className="pagination-btn"
      aria-label={isFetchingNextPage ? translations.common.loading + " more candidates" : "Load More"}
    >
      <span className="hidden sm:inline-block mr-2">{isFetchingNextPage ? translations.common.loading + "..." : "Load More"}</span>
      <ArrowRight className="btn-icon" />
    </Button>
  </div>
</div>
</div>
  );
}

interface ApplicationRowProps {
  application: Application;
  statusColors: Record<string, string>;
  handleCopyLink: (jobId: string, applicationId: string) => void;
  handleViewApplication: (jobId: string, applicationId: string) => void;
  translations: {
    actions: {
      view: string;
      copyLink: string;
      copied: string;
    };
  };
}

const ApplicationRow = React.memo(({ 
  application, 
  statusColors,
  handleCopyLink,
  handleViewApplication,
  translations 
}: ApplicationRowProps) => {
  const statusBadge = STATUS_CONFIG[application.application_status as keyof typeof STATUS_CONFIG] || 
    { text: application.application_status, color: 'bg-gray-100 text-gray-800' };

  return (
    <TableRow className="table-row-hover">
      <TableCell className="table-cell-border">
        <div className="cell-content flex items-center gap-2">
          <div className="flex flex-col">
            <GenericHoverCard entity="candidate" entityId={application.application_id}>
              <span className="candidate-name cursor-pointer decoration-dotted underline-offset-2">
                {sanitizeInput(application.first_name)} {sanitizeInput(application.last_name)}
              </span>
            </GenericHoverCard>
            <span className="candidate-email">
              {(application.email || 'Email not specified').substring(0, 42)}{(application.email && application.email.length > 42) ? '...' : ''}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="table-cell-border candidate-job">
        <div className="cell-content">
          <GenericHoverCard entity="job" entityId={application.job_id}>
            <span className="cursor-pointer decoration-dotted underline-offset-2">
              {sanitizeInput(application.job_title)}
            </span>
          </GenericHoverCard>
        </div>
      </TableCell>

      <TableCell className="table-cell-border">
        <div className="cell-content">
          <GenericHoverCard entity="application-stage" entityId={application.application_status}>
            <Badge className={statusBadge.color}>
              <div className="badge-text">{statusBadge.text}</div>
            </Badge>
          </GenericHoverCard>
        </div>
      </TableCell>

      <TableCell className="table-cell-border table-cell-assessment">
        <div className="assessment-scores">
          <span className="assessment-value">
            {application.score}
          </span>
          <span className="assessment-value">
            {application.demo_score || "-"}
          </span>
          <span className="assessment-value-disabled">
            -
          </span>
        </div>
        <div className="assessment-spacer">&nbsp;</div>
      </TableCell>

      <TableCell className="table-cell-border candidate-date">
        <div className="cell-content">
          {application.created_at
            ? new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '-'}
        </div>
      </TableCell>

      <TableCell className="table-cell-actions">
        <div className="cell-content">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="action-btn"
                  onClick={() => handleCopyLink(application.job_id, application.application_id)}
                  aria-label={`${translations.actions.copyLink} for ${application.first_name} ${application.last_name}`}
                >
                  <FileText className="btn-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {translations.actions.copyLink}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="action-btn"
                  onClick={() => handleViewApplication(application.job_id, application.application_id)}
                  aria-label={`${translations.actions.view} application for ${application.first_name} ${application.last_name}`}
                >
                  <ArrowRight className="btn-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {translations.actions.view}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
});

export const CandidatesTable = React.memo(CandidatesTableComponent);