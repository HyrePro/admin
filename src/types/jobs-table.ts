/**
 * TypeScript interfaces for JobsTable component data structures
 */

/**
 * Interface for a Job object
 */
export interface Job {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
  created_at: string;
  application_analytics: JobApplicationAnalytics;
  hiring: HiringManager;
  min_salary?: number;
  max_salary?: number;
  currency?: string;
}

/**
 * Interface for job application analytics
 */
export interface JobApplicationAnalytics {
  total_applications: number;
  assessment: number;
  demo: number;
  interviews: number;
  offered: number;
}

/**
 * Interface for hiring manager information
 */
export interface HiringManager {
  first_name: string;
  last_name: string;
  avatar: string;
}

/**
 * Interface for JobsTable component props
 */
export interface JobsTableProps {
  jobs: Job[];
  // originalJobs?: Job[] | undefined;
  // totalJobsCount?: number; // Total count of jobs for correct pagination display
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
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Interface for JobRow component props
 */
export interface JobRowProps {
  job: Job;
  statusColors: Record<string, string>;
  handleCopyLink: (jobId: string) => Promise<void>;
  handleViewJob: (jobId: string) => void;
  updateJobStatusOptimistically: (jobId: string, newStatus: string) => Promise<void>;
  undoLastAction: () => void;
  translations: {
    actions: {
      copyLink: string;
      viewJob: string;
    };
  };
}

/**
 * Interface for JobRow component props without undo functionality
 */
export interface JobRowPropsWithoutUndo {
  job: Job;
  statusColors: Record<string, string>;
  handleCopyLink: (jobId: string) => Promise<void>;
  handleViewJob: (jobId: string) => void;
  updateJobStatusOptimistically: (jobId: string, newStatus: string) => Promise<void>;
  translations: {
    actions: {
      copyLink: string;
      viewJob: string;
    };
  };
}

/**
 * Interface for sorting configuration
 */
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Interface for partial errors
 */
export interface PartialError {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}

/**
 * Interface for application status options
 */
export interface StatusOption {
  value: string;
  label: string;
}

/**
 * Interface for user session
 */
export interface UserSession {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  user?: User;
}

/**
 * Interface for user
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Interface for API response
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Interface for API error context
 */
export interface ErrorContext {
  operation: string;
  component: string;
  url: string;
  method: string;
}

// Add these to your existing types file or create a new one

export interface JobsTableProps {
  jobs: Job[] ;
  originalJobs: Job[] | null;
  totalJobsCount: number | null;
  loading?: boolean;
  onRefresh?: () => void;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  hasPreviousPage?: boolean;
  onLoadPrevious?: () => void;
  isFetchingNextPage?: boolean;
  isFetchingPreviousPage?: boolean;
  error?: string | undefined | null;
  hasError?: boolean;
  isNetworkError?: boolean;
  serverSidePagination?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
}

// Update the hook interface
export interface UseJobsTableProps {
  jobs: Job[] | null;
  originalJobs: Job[] | null;
  totalJobsCount: number | null;
  onRefresh?: () => void;
  serverSidePagination?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
}

export interface JobsTableProps {
  jobs: Job[] ;
  originalJobs: Job[] | null;
  totalJobsCount: number | null;
  loading?: boolean;
  onRefresh?: () => void;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  hasPreviousPage?: boolean;
  onLoadPrevious?: () => void;
  isFetchingNextPage?: boolean;
  isFetchingPreviousPage?: boolean;
  error?: string| null;
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