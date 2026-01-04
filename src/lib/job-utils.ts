/**
 * Utility functions for job data processing
 */

import { Job } from '@/types/jobs-table';

/**
 * Filter jobs based on search query and status filter
 * @param jobs - Array of jobs to filter
 * @param searchQuery - Search query to match against job titles and grade levels
 * @param statusFilter - Status filter to apply
 * @returns Filtered array of jobs
 */
export function filterJobs(jobs: Job[], searchQuery: string, statusFilter: string): Job[] {
  if (!jobs) return [];

  // Pre-process search query to lowercase once
  const lowerSearchQuery = searchQuery.toLowerCase();

  return jobs.filter(job => {
    // Check if job matches search criteria
    let matchesSearch = false;
    if (lowerSearchQuery) {
      matchesSearch =
        job.title.toLowerCase().includes(lowerSearchQuery) ||
        job.grade_levels?.some(grade => grade.toLowerCase().includes(lowerSearchQuery));
    } else {
      // If no search query, consider it a match
      matchesSearch = true;
    }

    // Check if job matches status filter
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Sort jobs based on sort configuration
 * @param jobs - Array of jobs to sort
 * @param sortConfig - Sort configuration specifying column and direction
 * @returns Sorted array of jobs
 */
export function sortJobs(jobs: Job[], sortConfig: { column: string; direction: 'asc' | 'desc' } | null): Job[] {
  if (!sortConfig) return jobs;

  return [...jobs].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortConfig.column) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'total_applications':
        aValue = a.application_analytics.total_applications || 0;
        bValue = b.application_analytics.total_applications || 0;
        break;
      case 'grade_levels':
        aValue = a.grade_levels?.join(' ') || '';
        bValue = b.grade_levels?.join(' ') || '';
        break;
      case 'hiring_name':
        aValue = (a.hiring?.first_name || '') + (a.hiring?.last_name || '');
        bValue = (b.hiring?.first_name || '') + (b.hiring?.last_name || '');
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Paginate jobs based on current page and page size
 * @param jobs - Array of jobs to paginate
 * @param currentPage - Current page number (0-indexed)
 * @param pageSize - Number of jobs per page
 * @returns Array of jobs for the current page
 */
export function paginateJobs(jobs: Job[], currentPage: number, pageSize: number = 10): Job[] {
  const startIndex = currentPage * pageSize;
  return jobs.slice(startIndex, startIndex + pageSize);
}

/**
 * Calculate pagination details
 * @param totalJobsCount - Total number of jobs
 * @param pageSize - Number of jobs per page
 * @param currentPage - Current page number (0-indexed)
 * @returns Object containing pagination details
 */
export function calculatePaginationDetails(totalJobsCount: number, pageSize: number = 10, currentPage: number): {
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.ceil(totalJobsCount / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalJobsCount);

  return {
    totalPages,
    startIndex,
    endIndex
  };
}