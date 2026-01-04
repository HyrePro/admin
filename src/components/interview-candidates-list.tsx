'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Briefcase, Clock, Users } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/api/client';
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyContent, 
  EmptyMedia 
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// Import the new component with a relative path
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

// Fetcher functions
const fetchSchoolInfo = async (userId: string): Promise<string | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', userId)
        .single();

    if (error) throw error;
    // Ensure the returned data is serializable
    return data?.school_id || null;
};

const fetchApplications = async (
    schoolId: string,
    startIndex: number,
    endIndex: number
): Promise<Candidate[]> => {
    if (!schoolId) return [];

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_applications_by_school', {
        p_school_id: schoolId,
        p_start_index: startIndex,
        p_end_index: endIndex,
        p_search: '',
        p_status: 'interview_ready'
    });

    if (error) throw error;
    // Ensure the returned data is serializable
    const applications = data || [];
    return JSON.parse(JSON.stringify(applications));
};

const CandidatesList: React.FC = () => {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastCandidateRef = useRef<HTMLDivElement>(null);
    // State for controlling the schedule dialog
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    // State for tracking which candidate is being scheduled
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    // Fetch user's school ID
    const { data: schoolId, error: schoolError } = useSWR(
        user?.id ? ['school-info', user.id] : null,
        ([_, userId]) => fetchSchoolInfo(userId)
    );

    // Fetch candidates data
    const { data: newCandidates, error: candidatesError, isValidating, mutate } = useSWR(
        schoolId ? ['applications', schoolId, page] : null,
        ([_, schoolId]) => fetchApplications(schoolId, page * 10, (page + 1) * 10)
    );

    // Handle loading state
    useEffect(() => {
        if (newCandidates) {
            if (newCandidates.length === 0) {
                setHasMore(false);
                setLoading(false);
            } else {
                if (page === 0) {
                    setCandidates(newCandidates);
                } else {
                    setCandidates(prev => [...prev, ...newCandidates]);
                }
                setHasMore(newCandidates.length === 10);
                setLoading(false);
            }
        }
    }, [newCandidates, page]);

    // Set up real-time listener for job applications
    useEffect(() => {
        if (!schoolId) return;

        const supabase = createClient();
        
        const channel = supabase
            .channel('interview_candidates_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'job_applications',
                },
                () => {
                    // Refetch the candidates when there are changes
                    mutate();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [schoolId, mutate]);

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

    // Function to handle opening the schedule dialog
    const handleScheduleInterview = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsScheduleDialogOpen(true);
    };

    // Function to handle closing the dialog
    const handleCloseDialog = () => {
        setIsScheduleDialogOpen(false);
        setSelectedCandidate(null);
    };

    // Show empty state when no candidates and not loading
    if (!loading && candidates.length === 0 && !isValidating) {
        return (
            <div className="h-full flex flex-col overflow-y-auto">
                <div className="flex-shrink-0">
                    <div className="mb-4">
                        <h1 className="text-lg font-bold text-slate-800 mb-1">Candidates to Schedule</h1>
                    </div>
                </div>
                <div className="flex-grow">
                    <Empty className="border border-dashed">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Users className="h-6 w-6" />
                            </EmptyMedia>
                            <EmptyTitle>No Candidates to Schedule</EmptyTitle>
                            <EmptyDescription>
                                There are currently no candidates pending interview scheduling. 
                                When candidates apply to your jobs, they will appear here.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button 
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                onClick={() => window.location.href = '/jobs'}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                View All Jobs
                            </Button>
                        </EmptyContent>
                    </Empty>
                </div>
            </div>
        );
    }

    // Loading skeleton for initial load
    if (loading && candidates.length === 0) {
        return (
            <div className="h-full flex flex-col overflow-y-auto">
                <div className="flex-shrink-0">
                    <div className="mb-4">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto min-h-0">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-y-auto">
            <div className="flex-shrink-0">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-lg font-bold text-slate-800 mb-1">Candidates to Schedule</h1>
                    <p className="text-slate-600">
                        {candidates.length} candidates pending interview scheduling
                    </p>
                </div>
            </div>

            {/* Scrollable Cards Grid */}
            <div className="flex-grow overflow-y-auto min-h-0">
                {candidates.map((candidate, index) => (
                    <div
                        key={candidate.application_id}
                        ref={index === candidates.length - 1 ? lastCandidateRef : null}
                        className="bg-white rounded-xl p-4 border border-slate-200 mb-4"
                    >
                        {/* Avatar and Name */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {getInitials(candidate.first_name, candidate.last_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 truncate">
                                    {candidate.first_name} {candidate.last_name}
                                </h3>
                                <p className="text-slate-600 truncate">
                                    {candidate.email}
                                </p>
                            </div>
                        </div>

                        {/* Position */}
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <p className="text-slate-800 font-medium">
                                {candidate.job_title}
                            </p>
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center gap-2 text-slate-600 mb-4">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <p className="text-slate-800">
                                {formatDate(candidate.created_at)}
                            </p>
                        </div>

                        {/* Schedule Button */}
                        <button 
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                            onClick={() => handleScheduleInterview(candidate)}
                        >
                            <Calendar className="w-5 h-5" />
                            Schedule Interview
                        </button>
                    </div>
                ))}

                {/* Loading indicator for more items */}
                {loading && candidates.length > 0 && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* End of list indicator */}
                {!hasMore && candidates.length > 0 && (
                    <div className="text-center py-4 text-slate-500">
                        No more candidates to load
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