'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Briefcase, Clock, Users, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/api/client';
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

// Fetcher functions
const fetchSchoolInfo = async (userId: string): Promise<string | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', userId)
        .single();

    if (error) throw error;
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
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
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

    const handleScheduleInterview = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsScheduleDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsScheduleDialogOpen(false);
        setSelectedCandidate(null);
    };

    // Show empty state when no candidates and not loading
    if (!loading && candidates.length === 0 && !isValidating) {
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
                        className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white"
                    />
                </div>
            </div>

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