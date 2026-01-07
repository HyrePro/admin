import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Job, SortConfig } from '@/types/jobs-table';
import { 
  getFilteredJobs, 
  getSortedJobs, 
  getPaginatedJobs, 
  getPaginationDetails,
  updateJobStatusOptimistically as updateJobStatusOptimisticallyLogic,
} from '@/lib/jobs-table-logic';
import { useTranslations } from '@/contexts/i18n-context';

interface UseJobsTableProps {
  jobs: Job[] | null;
  originalJobs: Job[] | null;
  totalJobsCount: number | null;
  onRefresh?: () => void;
  serverSidePagination?: boolean;
  
  // Controlled state from parent
  searchQuery?: string;
  statusFilter?: string;
  currentPage?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  
  // Callbacks to parent
  onSearchChange?: (query: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
}

export const useJobsTable = ({
  jobs,
  originalJobs,
  totalJobsCount,
  onRefresh,
  serverSidePagination = false,
  searchQuery: controlledSearchQuery,
  statusFilter: controlledStatusFilter,
  currentPage: controlledCurrentPage,
  pageSize: controlledPageSize,
  sortColumn: controlledSortColumn,
  sortDirection: controlledSortDirection,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: UseJobsTableProps) => {
  const translations = useTranslations();
  const router = useRouter();
  
  const jobStatusOptions = [
    { value: "ALL", label: translations.status.all },
    { value: "OPEN", label: translations.status.open },
    { value: "PAUSED", label: translations.status.paused },
    { value: "COMPLETED", label: translations.status.completed },
  ];
  
  const { common, table, empty, pagination, actions, help } = translations;

  // Use controlled state if in server-side mode, otherwise manage locally
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState("ALL");
  const [localCurrentPage, setLocalCurrentPage] = useState(0);
  const [localPageSize, setLocalPageSize] = useState(20);
  const [localSortConfig, setLocalSortConfig] = useState<SortConfig | null>(null);
  
  const jobSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; jobId: string; previousStatus: string; newStatus: string } | null>(null);
  const [jobsPartialErrors, setJobsPartialErrors] = useState<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[]>([]);

  // Determine which state to use
  const jobSearchQuery = serverSidePagination ? (controlledSearchQuery ?? "") : localSearchQuery;
  const jobStatusFilter = serverSidePagination ? (controlledStatusFilter ?? "ALL") : localStatusFilter;
  const jobsCurrentPage = serverSidePagination ? (controlledCurrentPage ?? 0) : localCurrentPage;
  const pageSize = serverSidePagination ? (controlledPageSize ?? 20) : localPageSize;
  
  // For sort config, convert from controlled to SortConfig format
  const jobsSortConfig = serverSidePagination && controlledSortColumn
    ? { column: controlledSortColumn, direction: controlledSortDirection || 'asc' }
    : localSortConfig;

  // Debounced search query for client-side mode only
  const [debouncedJobSearchQuery, setDebouncedJobSearchQuery] = useState(jobSearchQuery);
  
  useEffect(() => {
    if (!serverSidePagination) {
      // Client-side mode: debounce for filtering
      const timer = setTimeout(() => {
        setDebouncedJobSearchQuery(jobSearchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Server-side mode: debounce and call parent callback
      const timer = setTimeout(() => {
        if (onSearchChange) {
          onSearchChange(jobSearchQuery);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [jobSearchQuery, serverSidePagination, onSearchChange]);

  const jobStatusColors: Record<string, string> = {
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPEALED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  // Client-side filtering (only in client-side mode)
  const filteredJobs = useMemo(() => {
    if (serverSidePagination) {
      return jobs || [];
    }
    return getFilteredJobs(jobs || [], debouncedJobSearchQuery, jobStatusFilter);
  }, [jobs, debouncedJobSearchQuery, jobStatusFilter, serverSidePagination]);

  // Client-side sorting (only in client-side mode)
  const sortedJobs = useMemo(() => {
    if (serverSidePagination) {
      return filteredJobs;
    }
    return getSortedJobs(filteredJobs, jobsSortConfig);
  }, [filteredJobs, jobsSortConfig, serverSidePagination]);

  // Client-side pagination (only in client-side mode)
  const paginatedJobs = useMemo(() => {
    if (serverSidePagination) {
      // In server mode, show exactly what we received
      return sortedJobs;
    }
    return getPaginatedJobs(sortedJobs, jobsCurrentPage, pageSize);
  }, [sortedJobs, jobsCurrentPage, pageSize, serverSidePagination]);

  // Calculate display count
  const totalDisplayCount = serverSidePagination 
    ? (totalJobsCount || 0) 
    : sortedJobs.length;

  // Pagination details
  const { totalPages, startIndex, endIndex } = useMemo(() => {
    if (serverSidePagination) {
      const total = totalJobsCount || 0;
      const pages = Math.ceil(total / pageSize);
      const start = jobsCurrentPage * pageSize;
      const end = Math.min(start + (jobs?.length || 0), total);
      
      return {
        totalPages: pages,
        startIndex: start,
        endIndex: end
      };
    }
    return getPaginationDetails(totalDisplayCount, jobsCurrentPage, pageSize);
  }, [serverSidePagination, totalJobsCount, jobsCurrentPage, pageSize, jobs?.length, totalDisplayCount]);

  const setJobSearchQuery = useCallback((query: string) => {
  setLocalSearchQuery(query);
}, []);

  // Handlers for status filter
  const setJobStatusFilter = useCallback((status: string) => {
    if (serverSidePagination && onStatusFilterChange) {
      onStatusFilterChange(status);
    } else {
      setLocalStatusFilter(status);
      setLocalCurrentPage(0);
    }
  }, [serverSidePagination, onStatusFilterChange]);

  // Handlers for pagination
  const handlePreviousPage = useCallback(() => {
    const newPage = Math.max(0, jobsCurrentPage - 1);
    if (serverSidePagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalCurrentPage(newPage);
    }
  }, [jobsCurrentPage, serverSidePagination, onPageChange]);

  const handleNextPage = useCallback(() => {
    const newPage = Math.min(totalPages - 1, jobsCurrentPage + 1);
    if (serverSidePagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalCurrentPage(newPage);
    }
  }, [totalPages, jobsCurrentPage, serverSidePagination, onPageChange]);

  const setPageSize = useCallback((newSize: number | ((prev: number) => number)) => {
    const resolvedSize = typeof newSize === 'function' ? newSize(pageSize) : newSize;
    
    if (serverSidePagination && onPageSizeChange) {
      onPageSizeChange(resolvedSize);
    } else {
      setLocalPageSize(resolvedSize);
      setLocalCurrentPage(0);
    }
  }, [serverSidePagination, onPageSizeChange, pageSize]);

  // Sort handler
  const requestSort = useCallback((column: string) => {
    if (serverSidePagination && onSortChange) {
      // In server mode, determine new direction
      let newDirection: 'asc' | 'desc' = 'asc';
      
      if (jobsSortConfig && jobsSortConfig.column === column) {
        if (jobsSortConfig.direction === 'asc') {
          newDirection = 'desc';
        } else {
          // Reset to default sort
          onSortChange('created_at', 'desc');
          return;
        }
      }
      
      onSortChange(column, newDirection);
    } else {
      // Client-side sorting
      if (jobsSortConfig && jobsSortConfig.column === column) {
        if (jobsSortConfig.direction === 'asc') {
          setLocalSortConfig({ column, direction: 'desc' });
        } else {
          setLocalSortConfig(null);
        }
      } else {
        setLocalSortConfig({ column, direction: 'asc' });
      }
    }
  }, [jobsSortConfig, serverSidePagination, onSortChange]);

  const getSortIndicator = useCallback((columnName: string) => {
    if (jobsSortConfig?.column === columnName) {
      return jobsSortConfig.direction === 'asc' ? 'asc' : 'desc';
    }
    return 'none';
  }, [jobsSortConfig]);

  // Other handlers
  const handleViewJob = useCallback((jobId: string) => {
    router.push(`/jobs/${jobId}`);
  }, [router]);

  const handleCopyLink = useCallback(async (jobId: string) => {
    const jobLink = `https://www.hyriki.com/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(jobLink);
      toast.success("Job link copied to clipboard");
    } catch (err) { 
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy job link");
    }
  }, []);

  const updateJobStatusOptimistically = useCallback(async (jobId: string, newStatus: string) => {
    try {
      const jobIndex = jobs?.findIndex(job => job.id === jobId);
      if (jobIndex === -1 || jobIndex === undefined) {
        throw new Error('Job not found');
      }
      
      const previousStatus = (jobs || [])[jobIndex].status;
      
      await updateJobStatusOptimisticallyLogic(jobId, newStatus, jobs, onRefresh);
      
      toast.success('Job status updated successfully');
      setLastAction({ type: 'status-update', jobId, previousStatus, newStatus });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update job status');
    }
  }, [jobs, onRefresh]);
  
  const undoLastAction = useCallback(() => {
    if (!lastAction) {
      toast.info('No action to undo');
      return;
    }
    
    const { type, jobId, previousStatus } = lastAction;
    
    if (type === 'status-update') {
      updateJobStatusOptimistically(jobId, previousStatus);
      toast.success('Action undone');
      setLastAction(null);
    }
  }, [lastAction, updateJobStatusOptimistically]);

  return {
    // State
    jobSearchQuery,
    jobStatusFilter,
    jobsCurrentPage,
    jobsFilteredCount: totalDisplayCount,
    jobsFilterLoading: false,
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
    hasPreviousPage: jobsCurrentPage > 0,
    hasNextPage: jobsCurrentPage < totalPages - 1,
    
    // Handlers
    setJobSearchQuery,
    setJobStatusFilter,
    setJobsCurrentPage: serverSidePagination && onPageChange ? onPageChange : setLocalCurrentPage,
    setPageSize,
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
  };
};