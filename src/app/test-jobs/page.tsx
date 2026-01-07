"use client";

import React, { useState, useMemo } from "react";
import { JobsTable } from "@/components/jobs-table";
import { I18nProvider } from "@/contexts/i18n-context";

// Use the Job type from the types file
import { Job } from '@/types/jobs-table';

// Generate dummy data for testing
const generateDummyJobs = (count: number): Job[] => {
  const statuses = ['OPEN', 'PAUSED', 'COMPLETED', 'IN_PROGRESS'];
  const gradeLevels = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const subjects = ['Math', 'Science', 'English', 'History', 'Art', 'Music', 'PE'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `job-${index + 1}`,
    title: `Sample Job Position ${index + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    subjects: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
      () => subjects[Math.floor(Math.random() * subjects.length)]
    ),
    created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    grade_levels: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
      () => gradeLevels[Math.floor(Math.random() * gradeLevels.length)]
    ),
    application_analytics: {
      total_applications: Math.floor(Math.random() * 100),
      assessment: Math.floor(Math.random() * 20),
      demo: Math.floor(Math.random() * 15),
      interviews: Math.floor(Math.random() * 25),
      offered: Math.floor(Math.random() * 10),
    },
    hiring: {
      first_name: `Hiring Manager ${index + 1}`,
      last_name: `Test`,
      avatar: `https://api.dicebear.com/6.x/initials/svg?seed=HM${index + 1}`
    },
    min_salary: Math.floor(Math.random() * 50000) + 30000,
    max_salary: Math.floor(Math.random() * 70000) + 80000,
    currency: 'USD'
  }));
};

export default function TestJobsPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Generate a large dataset for testing
  const allJobs = useMemo(() => generateDummyJobs(100), []);

  // Apply filters
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.grade_levels.some(level => level.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [allJobs, searchQuery, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const startIndex = currentPage * pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  // Calculate pagination flags
  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when page size changes
  };

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page on search
  };

  // Handle status filter changes
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page on filter
  };

  // Handle sort changes (for testing, we'll just log it)
  const handleSortChange = (column: string, direction: 'asc' | 'desc') => {
    console.log('Sort changed:', { column, direction });
    setCurrentPage(0); // Reset to first page on sort
  };

  // Handle refresh
  const handleRefresh = () => {
    setCurrentPage(0);
    setSearchQuery('');
    setStatusFilter('ALL');
    console.log('Refreshed data');
  };

  return (
    <I18nProvider>
      <div className="jobs-container" style={{ height: '100vh', padding: '1rem' }}>
        <div className="jobs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 className="jobs-title">Test Jobs Table</h1>
          <div>
            <input
              type="text"
              placeholder="Search test..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ padding: '0.5rem', marginRight: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              style={{ padding: '0.5rem', marginRight: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
            <button 
              onClick={handleRefresh}
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f5f5f5' }}
            >
              Refresh
            </button>
          </div>
        </div>

        <JobsTable
          jobs={paginatedJobs}
          originalJobs={allJobs}
          totalJobsCount={filteredJobs.length}
          loading={false}
          onRefresh={handleRefresh}
          hasNextPage={hasNextPage}
          onLoadMore={() => handlePageChange(currentPage + 1)}
          hasPreviousPage={hasPreviousPage}
          onLoadPrevious={() => handlePageChange(currentPage - 1)}
          isFetchingNextPage={false}
          serverSidePagination={true}
          // Controlled state
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          currentPage={currentPage}
          pageSize={pageSize}
          sortColumn="created_at"
          sortDirection="desc"
          // Callbacks
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
        />

        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <p>Dummy Data Info: Showing {paginatedJobs.length} of {filteredJobs.length} jobs. Current page: {currentPage + 1}/{totalPages || 1}. Page size: {pageSize}</p>
          <p>Generated {allJobs.length} total jobs for testing.</p>
        </div>
      </div>
    </I18nProvider>
  );
}