import { Job, SortConfig } from '@/types/jobs-table';
import { filterJobs, sortJobs, paginateJobs, calculatePaginationDetails } from '@/lib/job-utils';
import { requestDeduplicator, generateRequestKey } from '@/lib/request-deduplicator';
import { updateJobStatus } from '@/lib/supabase/api/update-job-status';

// Define the interface for persisted state
interface PersistedState {
  jobSearchQuery: string;
  jobStatusFilter: string;
  jobsCurrentPage: number;
  jobsSortConfig: SortConfig | null;
  pageSize?: number;
}

const PERSISTENCE_KEY = 'jobsTablePreferences';

// Function to save state to localStorage
export const saveStateToStorage = (state: PersistedState) => {
  try {
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// Function to load state from localStorage
export const loadStateFromStorage = (): PersistedState | null => {
  try {
    const stored = localStorage.getItem(PERSISTENCE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

/**
 * Filter and search jobs based on search query and status filter
 * @returns Array of jobs that match the current search and filter criteria
 */
export const getFilteredJobs = (jobs: Job[], searchQuery: string, statusFilter: string) => {
  return filterJobs(jobs, searchQuery, statusFilter);
};

/**
 * Sort jobs based on the current sort configuration
 * @returns Array of jobs sorted according to the current sort settings
 */
export const getSortedJobs = (filteredJobs: Job[], sortConfig: SortConfig | null) => {
  return sortJobs(filteredJobs, sortConfig);
};

/**
 * Paginate sorted jobs based on current page and page size
 * @returns Array of jobs for the current page
 */
export const getPaginatedJobs = (sortedJobs: Job[], currentPage: number, pageSize: number) => {
  return paginateJobs(sortedJobs, currentPage, pageSize);
};

/**
 * Get pagination details (total pages, start index, end index)
 */
export const getPaginationDetails = (filteredJobsLength: number, currentPage: number, pageSize: number) => {
  // Note: calculatePaginationDetails expects (totalJobsCount, pageSize, currentPage)
  return calculatePaginationDetails(filteredJobsLength, pageSize, currentPage);
};

/**
 * Update job status with optimistic update
 * @param jobId - The ID of the job to update
 * @param newStatus - The new status to set
 * @param jobs - The current jobs array
 * @param onRefresh - Function to refresh job data after update
 * @returns Promise that resolves when the update is complete
 */
export const updateJobStatusOptimistically = async (
  jobId: string, 
  newStatus: string, 
  jobs: Job[] | null, 
  onRefresh?: () => void
) => {
  if (!jobs) {
    throw new Error('Jobs data is not available');
  }

  // Optimistically update the UI by modifying the jobs array directly
  // This creates an immediate visual feedback before the API call completes
  const jobIndex = jobs.findIndex(job => job.id === jobId);
  if (jobIndex === -1) {
    throw new Error('Job not found');
  }
  
  // Generate a request key for deduplication and throttling
  const requestKey = generateRequestKey('/api/jobs/status', {
    jobId,
    status: newStatus
  }, 'PUT');
  
  // Perform the API call with deduplication and throttling
  const result = await requestDeduplicator.execute(requestKey, async () => {
    return await updateJobStatus(jobId, newStatus);
  }, 'anonymous', '/api/jobs/status', 'PUT');
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update job status');
  }
  
  // Refresh the job data if needed
  onRefresh?.();
  
  return result;
};

/**
 * Fetch filtered job count based on search query and status filter
 * @param searchQuery - The search query to filter by
 * @param statusFilter - The status filter to apply
 * @param totalJobsCount - The total count of jobs (when no filters applied)
 * @returns The count of filtered jobs
 */
export const fetchFilteredJobCount = async (
  searchQuery: string,
  statusFilter: string,
  totalJobsCount: number | null
) => {
  // If no filters are applied, use the totalJobsCount prop
  if (!searchQuery && statusFilter === "ALL") {
    return totalJobsCount || 0;
  }
  
  // Generate a unique request key based on the filter parameters
  const requestKey = generateRequestKey('/api/get-job-count', {
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: searchQuery
  }, 'GET');
  
  console.log('fetchFilteredJobCount called with params:', { searchQuery, statusFilter, totalJobsCount });
  // Execute the request with deduplication and throttling
  const result = await requestDeduplicator.execute(requestKey, async () => {
    console.log('Making getJobCount call with params:', {
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      search: searchQuery
    });
    // Build query parameters
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);

    const queryParams = params.toString();
    const url = queryParams ? `/api/get-job-count?${queryParams}` : `/api/get-job-count`;

    console.log('Making job count API request to:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Job count API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Job count API error response:', errorText);
      throw new Error(errorText || 'Failed to fetch job count');
    }

    const data = await response.json();
    console.log('getJobCount API response:', data);
    return { data, error: null };
  }, 'anonymous', '/api/jobs/count', 'GET');
  
  const { data, error } = result;
  console.log('fetchFilteredJobCount result:', { data, error });
  
  if (error) {
    console.error('Error fetching filtered job count:', error);
    throw new Error(error);
  }
  
  const count = data?.count || 0;
  console.log('Returning count:', count);
  return count;
};