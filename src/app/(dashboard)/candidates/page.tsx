'use client';
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAuthStore } from "@/store/auth-store";
import { CandidatesTable } from "@/components/candidates-table";
import ErrorBoundary from "@/components/error-boundary";
import { useQuery } from '@tanstack/react-query';
import { InviteCandidateDialog } from '@/components/invite-candidate-dialog';
import { toast } from "sonner";

// Types
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

export default function CandidatesPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { schoolId } = useAuthStore();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Fetch total application count (updates when filters change)
  const { data: totalApplicationsCount = 0, isLoading: countLoading, refetch: refetchCount } = useQuery<number>({
    queryKey: ['application-count', statusFilter, searchQuery, schoolId],
    queryFn: async () => {
      console.log('Fetching application count with filters:', { statusFilter, searchQuery, schoolId });
      
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
      });
      
      const response = await fetch(`/api/get-applications-count?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch application count: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Application count:', data.count);
      return data.count || 0;
    },
    enabled: !!user && !!session && !!schoolId,
    retry: 2,
  });

  // Fetch applications data (updates when any parameter changes)
  const { 
    data: applicationsData, 
    isLoading: loading, 
    error, 
    refetch: refetchApplications, 
    isFetching: isFetchingApplications 
  } = useQuery<Application[]>({
    queryKey: ['applications', statusFilter, searchQuery, currentPage, pageSize, schoolId, sortColumn, sortDirection],
    queryFn: async () => {
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      
      console.log('Fetching applications with params:', {
        status: statusFilter,
        search: searchQuery,
        startIndex,
        endIndex,
        schoolId,
        sortColumn,
        sortDirection
      });
      
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        startIndex: startIndex.toString(),
        endIndex: endIndex.toString(),
        sort: sortColumn,
        asc: (sortDirection === 'asc').toString()
      });
      
      const response = await fetch(`/api/applications-sorted?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      console.log('Fetched applications:', data.applications?.length || 0);
      return data.applications || [];
    },
    enabled: !!user && !!session && !!schoolId,
    retry: 2,
    placeholderData: (previousData) => previousData, // Prevent flicker while loading (React Query v5)
  });

  // Handle undefined case
  const applications = applicationsData ?? [];

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
    
    // Refetch both count and applications
    await Promise.all([refetchCount(), refetchApplications()]);
  }, [refetchCount, refetchApplications]);

  // Calculate pagination flags
  const hasNextPage = totalApplicationsCount > (currentPage + 1) * pageSize;
  const hasPreviousPage = currentPage > 0;

  // Determine loading states
  const isInitialLoading = loading && currentPage === 0;

  console.log('CandidatesPage render:', {
    currentPage,
    pageSize,
    applicationsLength: applications.length,
    totalApplicationsCount,
    hasNextPage,
    hasPreviousPage,
    isInitialLoading,
    isFetchingApplications,
    searchQuery,
    statusFilter,
    schoolId,
    sortColumn,
    sortDirection,
  });

  // Invite candidates function
  const handleInviteCandidates = async (emails: string[], jobId: string) => {
    try {
      const response = await fetch("/api/job-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails, jobId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${emails.length} candidate(s) invited successfully`, {
          description: "Invitations have been sent!",
        });
      } else {
        // Handle the specific case of existing invitations
        if (response.status === 409 && result.existingEmails) {
          toast.error("Some invitations already exist", {
            description: `Invitations already exist for: ${result.existingEmails.join(', ')}`,
          });
        } else {
          toast.error("Failed to invite candidates", {
            description: result.error || "Please try again later",
          });
        }
        // Re-throw the error so the dialog knows there was an issue
        throw new Error(result.error || "Failed to invite candidates");
      }
    } catch (error) {
      console.error("Error inviting candidates:", error);
      toast.error("Failed to invite candidates", {
        description: "Please check your connection and try again",
      });
      // Re-throw the error so the dialog knows there was an issue
      throw error;
    }
  };

  return (
    <div className="candidates-container">
      <div className="candidates-header">
        <h1 className="candidates-title">Candidates</h1>
        <Button
          variant="outline"
          onClick={() => setIsInviteDialogOpen(true)}
          className='btn-invite'
        >
          <Plus className="btn-icon" />
          Invite Candidate
        </Button>
      </div>
      <main className="flex-1 min-h-0 h-full overflow-hidden">
        <ErrorBoundary>
          <CandidatesTable 
            applications={applications} 
            originalApplications={applications}
            totalApplicationsCount={totalApplicationsCount}
            loading={isInitialLoading} 
            onRefresh={handleRefresh}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isFetchingNextPage={isFetchingApplications && !isInitialLoading}
            serverSidePagination={true}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            currentPage={currentPage}
            pageSize={pageSize}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSearchChange={handleSearchChange}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
          />
        </ErrorBoundary>
      </main>
      
      <InviteCandidateDialog 
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteCandidates}
      />
    </div>
  );
}