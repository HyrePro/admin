'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Briefcase, Clock, Users, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";

interface Candidate {
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  created_at: string;
  job_id: string;
}

interface FilterBadgeProps {
  label: string;
  value: string;
  isActive: boolean;
  sortOrder?: 'asc' | 'desc' | null;
  onClick: () => void;
  onSortToggle?: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({
  label,
  value,
  isActive,
  sortOrder,
  onClick,
  onSortToggle
}) => {
  return (
    <div
      className={`
                group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer
                transition-all duration-200 select-none
                ${isActive
          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }
            `}
      onClick={onClick}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
        {value}
      </span>

      {/* Sort toggle button - only shown when active and onSortToggle is provided */}
      {isActive && onSortToggle && sortOrder && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSortToggle();
          }}
          className="ml-1 p-1 rounded-md hover:bg-blue-100 transition-colors"
          title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ArrowDown className="w-4 h-4 text-blue-600" />
          )}
        </button>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
};

// API fetcher functions
const fetchApplications = async (
  schoolId: string,
  startIndex: number,
  endIndex: number,
  search: string = '',
  assignedToMe: boolean = false,
  urgencyFilterActive: boolean = false,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<Candidate[]> => {
  if (!schoolId) return [];

  const params = new URLSearchParams({
    startIndex: startIndex.toString(),
    endIndex: endIndex.toString(),
    status: 'interview_ready',
    assign_to_me: assignedToMe.toString(),
    hiring_urgency: urgencyFilterActive.toString(),
    hiring_asc: sortOrder === 'asc' ? 'true' : 'false'
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`/api/applications?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.applications || [];
};

const CandidatesList: React.FC = () => {
  const { user } = useAuth();
  const { schoolId: authSchoolId } = useAuthStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastCandidateRef = useRef<HTMLDivElement>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [urgencyFilterActive, setUrgencyFilterActive] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  const handleUrgencyToggle = () => {
    if (urgencyFilterActive) {
      // Deselect if already active
      setUrgencyFilterActive(false);
    } else {
      // Activate and reset to ascending
      setUrgencyFilterActive(true);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const queryClient = useQueryClient();

  // Fetch candidates data using TanStack Query
  const {
    data: candidatesData,
    error: candidatesError,
    isLoading: isLoadingCandidates,
    isFetching: isFetchingCandidates,
    refetch: refetchCandidates
  } = useQuery({
    queryKey: ['interview-candidates', authSchoolId, page, searchTerm, assignedToMe, urgencyFilterActive, sortOrder],
    queryFn: async () => {
      if (!authSchoolId) {
        throw new Error('User school information not found');
      }

      // Add filter parameters to the URL
      const params = new URLSearchParams({
        startIndex: (page * 10).toString(),
        endIndex: ((page + 1) * 10).toString(),
        status: 'interview_ready'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      params.append('assign_to_me', assignedToMe.toString());
      params.append('hiring_urgency', urgencyFilterActive.toString());
      params.append('hiring_asc', sortOrder === 'asc' ? 'true' : 'false');

      const response = await fetch(`/api/applications?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.applications || [];
    },
    enabled: !!authSchoolId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Type guard to ensure candidatesData is an array
  const typedCandidatesData = (candidatesData || []) as Candidate[];

  // Set up real-time listener for job applications
  useEffect(() => {
    if (!authSchoolId) return;

    // Invalidate query when real-time changes occur
    const handleRealTimeUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['interview-candidates'] });
    };

    // We'll trigger refetch manually since we don't have direct Supabase access here
    // In a production app, you might want to set up WebSocket or polling
    const interval = setInterval(handleRealTimeUpdate, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [authSchoolId, queryClient]);

  // Handle loading state
  useEffect(() => {
    if (typedCandidatesData && Array.isArray(typedCandidatesData)) {
      if (typedCandidatesData.length === 0) {
        setHasMore(false);
        setLoading(false);
      } else {
        if (page === 0) {
          setCandidates(typedCandidatesData);
        } else {
          setCandidates(prev => [...prev, ...typedCandidatesData]);
        }
        setHasMore(typedCandidatesData.length === 10);
        setLoading(false);
      }
    }
  }, [typedCandidatesData, page]);

  // Update loading state based on TanStack Query
  useEffect(() => {
    setLoading(isLoadingCandidates || isFetchingCandidates);
  }, [isLoadingCandidates, isFetchingCandidates]);



  // Infinite scrolling implementation
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      setLoading(true);
    }
  }, [hasMore, loading]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (lastCandidateRef.current) {
      observer.current.observe(lastCandidateRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMore, loadMore]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const handleScheduleInterview = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsScheduleDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsScheduleDialogOpen(false);
    setSelectedCandidate(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when search changes
  };

  const handleFilterChange = () => {
    // Reset to first page when filters change
    setPage(0);
    // Refetch with new filters
    refetchCandidates();
  };

  const handleAssignedToggle = () => {
    setAssignedToMe(!assignedToMe);
    setPage(0);
  };
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  // Effect to refetch when filters change
  useEffect(() => {
    handleFilterChange();
  }, [assignedToMe, urgencyFilterActive, sortOrder]);

  // Show empty state when no candidates and not loading
  if (!loading && candidates.length === 0 && !isFetchingCandidates) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No candidates ready for interview
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Candidates will appear here once applications reach interview-ready status.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/jobs')}
          className="h-10"
        >
          View Jobs
        </Button>
      </div>
    );
  }

  // Loading skeleton for initial load
  if (loading && candidates.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Search Skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* List Skeleton */}
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-slate-100 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Filter Badges */}
      {/* <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          <FilterBadge
            label="Assigned to Me"
            value={assignedToMe ? 'Active' : 'All'}
            isActive={assignedToMe}
            onClick={handleAssignedToggle}
          />

          <FilterBadge
            label="Hiring Urgency"
            value="Priority"
            isActive={urgencyFilterActive}
            sortOrder={urgencyFilterActive ? sortOrder : null}
            onClick={handleUrgencyToggle}
            onSortToggle={handleSortToggle}
          />
        </div>

        {(assignedToMe || urgencyFilterActive) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Active filters:</span>
            {assignedToMe && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                Assigned to Me
              </span>
            )}
            {urgencyFilterActive && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                Hiring Urgency {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
            <button
              onClick={() => {
                setAssignedToMe(false);
                setUrgencyFilterActive(false);
                setSortOrder('asc');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div> */}

      {/* Candidates List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.application_id}
            ref={index === candidates.length - 1 ? lastCandidateRef : null}
            className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            {/* Candidate Info */}
            <div className="flex gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {getInitials(candidate.first_name, candidate.last_name)}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-slate-900 truncate">
                  {candidate.first_name} {candidate.last_name}
                </h4>
                <p className="text-sm text-slate-500 truncate mb-1">
                  {candidate.email}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{candidate.job_title}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(candidate.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Button */}
            <Button
              onClick={() => handleScheduleInterview(candidate)}
              variant="outline"
              className="h-9 px-4 text-sm font-medium flex items-center gap-2 flex-shrink-0 hover:bg-slate-50 border-slate-300"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && candidates.length > 0 && (
          <div className="py-8 flex justify-center">
            <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-purple-600 rounded-full" />
          </div>
        )}

        {/* End of List Message */}
        {!hasMore && candidates.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">No more candidates to load</p>
          </div>
        )}
      </div>

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        candidate={selectedCandidate}
        onClose={handleCloseDialog}
      />
    </div>
  );
};

export default CandidatesList;