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
  fetchFilteredJobCount,
  saveStateToStorage,
  loadStateFromStorage
} from '@/lib/jobs-table-logic';
import { useTranslations } from '@/contexts/i18n-context';

interface UseJobsTableProps {
  jobs: Job[] | null;
  originalJobs: Job[] | null;
  totalJobsCount: number | null;
  onRefresh?: () => void;
}

interface UseJobsTableReturn {
  // State
  jobSearchQuery: string;
  jobStatusFilter: string;
  jobsCurrentPage: number;
  jobsFilteredCount: number;
  jobsFilterLoading: boolean;
  jobsPartialErrors: {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[];
  jobsSortConfig: SortConfig | null;
  jobStatusOptions: { value: string; label: string }[];
  jobStatusColors: Record<string, string>;
  pageSize: number;
  
  // Refs
  jobSearchInputRef: React.RefObject<HTMLInputElement | null>;
  
  // Computed values
  filteredJobs: Job[];
  sortedJobs: Job[];
  paginatedJobs: Job[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalDisplayCount: number;
  
  // Handlers
  setJobSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setJobStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  setJobsCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  handleViewJob: (jobId: string) => void;
  handleCopyLink: (jobId: string) => Promise<void>;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  requestSort: (column: string) => void;
  getSortIndicator: (columnName: string) => string | null;
  updateJobStatusOptimistically: (jobId: string, newStatus: string) => Promise<void>;
  undoLastAction: () => void;
  
  // Translations
  translations: any;
  common: any;
  table: any;
  empty: any;
  pagination: any;
  actions: any;
  help: any;
}

export const useJobsTable = ({
  jobs,
  originalJobs,
  totalJobsCount,
  onRefresh
}: UseJobsTableProps): UseJobsTableReturn => {
  const translations = useTranslations();
  const router = useRouter();
  
  const jobStatusOptions = [
    { value: "ALL", label: translations.status.all },
    { value: "OPEN", label: translations.status.open },
    { value: "PAUSED", label: translations.status.paused },
    { value: "COMPLETED", label: translations.status.completed },
  ];
  
  const { common, table, empty, pagination, actions, help } = translations;

  // Load persisted state from localStorage
  const persistedState = loadStateFromStorage();
  
  // Existing state with initial values from persisted state
  const [jobSearchQuery, setJobSearchQuery] = useState<string>(
    persistedState?.jobSearchQuery || ""
  );
  const jobSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState(
    persistedState?.jobStatusFilter || "ALL"
  );
  const [jobsCurrentPage, setJobsCurrentPage] = useState(
    persistedState?.jobsCurrentPage || 0
  );
  const [jobsFilteredCount, setJobsFilteredCount] = useState<number>(0);
  const [jobsFilterLoading, setJobsFilterLoading] = useState(false);
  
  // State for partial errors
  // State for tracking last action for undo functionality
  const [lastAction, setLastAction] = useState<{ type: string; jobId: string; previousStatus: string; newStatus: string } | null>(null);
  
  const [jobsPartialErrors, setJobsPartialErrors] = useState<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[]>([]);
  
  // Sorting state with initial value from persisted state
  const [jobsSortConfig, setJobsSortConfig] = useState<SortConfig | null>(
    persistedState?.jobsSortConfig || null
  );
  
  const pageSize = 10;

  // Debounced search query to prevent too many API calls while typing
  const [debouncedJobSearchQuery, setDebouncedJobSearchQuery] = useState(jobSearchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedJobSearchQuery(jobSearchQuery);
    }, 300); // 300ms debounce time
    
    return () => {
      clearTimeout(timer);
    };
  }, [jobSearchQuery]);

  // Save state to localStorage when relevant state changes
  useEffect(() => {
    const stateToSave = {
      jobSearchQuery,
      jobStatusFilter,
      jobsCurrentPage,
      jobsSortConfig,
    };
    saveStateToStorage(stateToSave);
  }, [jobSearchQuery, jobStatusFilter, jobsCurrentPage, jobsSortConfig]);

  const jobStatusColors: Record<string, string> = {
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPEALED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  /**
   * Filter and search jobs based on search query and status filter
   * @returns Array of jobs that match the current search and filter criteria
   */
  const filteredJobs = useMemo(() => {
    return getFilteredJobs(jobs || [], debouncedJobSearchQuery, jobStatusFilter);
  }, [jobs, debouncedJobSearchQuery, jobStatusFilter]);

  /**
   * Sort jobs based on the current sort configuration
   * @returns Array of jobs sorted according to the current sort settings
   */
  const sortedJobs = useMemo(() => {
    return getSortedJobs(filteredJobs, jobsSortConfig);
  }, [filteredJobs, jobsSortConfig]);

  /**
   * Paginate sorted jobs based on current page and page size
   * @returns Array of jobs for the current page
   */
  const paginatedJobs = useMemo(() => {
    return getPaginatedJobs(sortedJobs, jobsCurrentPage, pageSize);
  }, [sortedJobs, jobsCurrentPage]);

  const { totalPages, startIndex, endIndex } = getPaginationDetails(filteredJobs.length, jobsCurrentPage, pageSize);
  
  // Use the filtered job count which is fetched from the API when filters are applied
  const totalDisplayCount = jobsFilteredCount;

  /**
   * Handle viewing a job by navigating to the job details page
   * @param jobId - The ID of the job to view
   */
  const handleViewJob = useCallback((jobId: string) => {
    router.push(`/jobs/${jobId}`);
  }, [router]);

  /**
   * Handle copying a job link to the clipboard
   * @param jobId - The ID of the job to copy the link for
   * @returns Promise that resolves when the link is copied
   */
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

  /**
   * Handle navigating to the previous page
   */
  const handlePreviousPage = useCallback(() => {
    setJobsCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Handle navigating to the next page
   */
  const handleNextPage = useCallback(() => {
    setJobsCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  /**
   * Request sorting by a specific column
   * @param column - The column to sort by
   */
  const requestSort = useCallback((column: string) => {
    if (jobsSortConfig && jobsSortConfig.column === column) {
      // If clicking the same column, toggle direction
      if (jobsSortConfig.direction === 'asc') {
        setJobsSortConfig({ column, direction: 'desc' });
      } else {
        setJobsSortConfig(null); // Clear sort if going from desc to asc again
      }
    } else {
      // If clicking a different column, sort ascending by default
      setJobsSortConfig({ column, direction: 'asc' });
    }
  }, [jobsSortConfig]);

  /**
   * Get the sort indicator for a column
   * @param columnName - The name of the column
   * @returns Sort indicator (↑ or ↓) or null if not sorted by this column
   */
  const getSortIndicator = useCallback((columnName: string) => {
    if (jobsSortConfig?.column === columnName) {
      return jobsSortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  }, [jobsSortConfig]);
  
  /**
   * Update job status with optimistic update
   * @param jobId - The ID of the job to update
   * @param newStatus - The new status to set
   * @returns Promise that resolves when the update is complete
   */
  const updateJobStatusOptimistically = useCallback(async (jobId: string, newStatus: string) => {
    try {
      // Optimistically update the UI by modifying the jobs array directly
      // This creates an immediate visual feedback before the API call completes
      const jobIndex = jobs?.findIndex(job => job.id === jobId);
      if (jobIndex === -1 || jobIndex === undefined) {
        throw new Error('Job not found');
      }
      
      // Store previous status for potential undo
      const previousStatus = (jobs || [])[jobIndex].status;
      
      // Create a new jobs array with the updated job status
      const updatedJobs = [...(jobs || [])];
      updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: newStatus };
      
      // Update the jobs prop with the optimistic update
      // In a real implementation with React Query, we would update the cache
      
      // Call the business logic function to update the job status (renamed to avoid conflict)
      await updateJobStatusOptimisticallyLogic(jobId, newStatus, jobs, onRefresh);
      
      toast.success('Job status updated successfully');
      
      // Store the action for potential undo
      setLastAction({ type: 'status-update', jobId, previousStatus, newStatus });
      
      // If the API call was successful, the UI is already updated optimistically
      // If it fails, we would rollback the change (not implemented here for simplicity)
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update job status');
      
      // In a full implementation, we would rollback the optimistic update here
      // by restoring the previous job status in the UI
    }
  }, [jobs, onRefresh]);
  
  // Undo the last action
  const undoLastAction = useCallback(() => {
    if (!lastAction) {
      toast.info('No action to undo');
      return;
    }
    
    const { type, jobId, previousStatus } = lastAction;
    
    if (type === 'status-update') {
      // Revert the status to the previous value
      updateJobStatusOptimistically(jobId, previousStatus);
      toast.success('Action undone');
      setLastAction(null);
    }
  }, [lastAction, updateJobStatusOptimistically]);
  
  // Fetch filtered job count when filters change
  useEffect(() => {
    setJobsFilterLoading(true);
    
    const fetchFilteredCount = async () => {
      // If no filters are applied, use the totalJobsCount prop
      if (!debouncedJobSearchQuery && jobStatusFilter === "ALL") {
        setJobsFilteredCount(totalJobsCount || 0);
        setJobsFilterLoading(false);
        return;
      }
      
      try {
        const count = await fetchFilteredJobCount(
          debouncedJobSearchQuery,
          jobStatusFilter,
          totalJobsCount
        );
        setJobsFilteredCount(count);
        
        // Remove any existing job count partial error
        setJobsPartialErrors(prev => prev.filter(err => err.type !== 'job-count'));
      } catch (err) {
        console.error('Error in fetchFilteredCount:', err);
        
        // Add partial error for failed job count
        setJobsPartialErrors(prev => [
          ...prev,
          {
            type: 'job-count',
            message: 'Failed to load accurate job count. Displaying estimated count.',
            severity: 'warning',
            timestamp: new Date(),
          }
        ]);
        
        // Fallback to filtered jobs length if API fails
        setJobsFilteredCount(filteredJobs.length);
      } finally {
        setJobsFilterLoading(false);
      }
    };
    
    fetchFilteredCount();
  }, [debouncedJobSearchQuery, jobStatusFilter, totalJobsCount, filteredJobs.length]);

  // Reset to first page when filters change
  useEffect(() => {
    setJobsCurrentPage(0);
  }, [debouncedJobSearchQuery, jobStatusFilter, jobsSortConfig]);
  
  // Cleanup effect to cancel any ongoing operations when component unmounts
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      // Cancel any ongoing API requests if needed
      // Clean up any subscriptions
    };
  }, []);

  return {
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
  };
};