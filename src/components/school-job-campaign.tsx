import React, { useState, useEffect } from 'react';
import { Rocket, MessageSquare, Users, Users2, UsersIcon, TvMinimalIcon, BookText, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/api/client';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

// Type Definitions
interface Applicant {
    firstName: string;
    lastName: string;
    avatar: string | null;
}

interface JobData {
    id: string;
    title: string;
    description: string;
    plan: string;
    max_applications: number;
    recent_applicants: Applicant[];
    candidates_evaluated: number;
    demo_completed: number;
    interview_ready: number;
    offered: number;
    created_at: string;
}

interface JobCardProps {
    data: JobData;
}

interface SchoolJobsContainerProps {
    schoolId: string;
}

// JobCard Component - Pure presentation component
const JobCard: React.FC<JobCardProps> = ({ data }) => {
    const router = useRouter();
    
    if (!data) return null;

    const {
        id: jobId,
        title,
        description,
        plan,
        max_applications: maxApplications,
        recent_applicants: recentApplicants = [],
        candidates_evaluated: candidatesEvaluated = 0,
        interview_ready: interviewReady = 0,
        offered = 0
    } = data;

    // Calculate progress percentage
    const progressPercentage = maxApplications > 0
        ? Math.round((candidatesEvaluated / maxApplications) * 100)
        : 0;

    const handleCardClick = (e: React.MouseEvent) => {
        // Check if the click was on the menu button
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        router.push(`/jobs/${jobId}`);
    };

    return (
        <Card className={`hover:shadow-lg transition-shadow duration-300 gap-0 py-4 px-4 flex flex-col border-1 border-gray-200 shadow-none cursor-pointer`} onClick={handleCardClick}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="text-orange-500 font-semibold text-sm ">
                    {plan}
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Title and Description */}
            <CardTitle className='p-0 m-0'>
                {title}
            </CardTitle>
            <CardDescription className='text-gray-600 mb-4 mt-1'>
                {description || 'No description available'}
            </CardDescription>

            {/* Applicants and Stats */}
            <div className="flex items-center justify-between mb-2">
                {/* Applicant Avatars */}
                <div className="flex -space-x-2">
                    {recentApplicants.slice(0, 3).map((applicant, index) => (
                        <div
                            key={index}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-white font-semibold text-sm"
                            title={`${applicant.firstName} ${applicant.lastName}`}
                        >
                            {applicant.avatar ? (
                                <img
                                    src={applicant.avatar}
                                    alt={`${applicant.firstName} ${applicant.lastName}`}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                `${applicant.firstName?.[0] || ''}${applicant.lastName?.[0] || ''}`
                            )}
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-gray-700">
                    <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span className="font-semibold">{candidatesEvaluated}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TvMinimalIcon className="w-4 h-4" />
                        <span className="font-semibold">{interviewReady}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookText className="w-4 h-4" />
                        <span className="font-semibold">{offered}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                </div>
                <div className="text-sm text-gray-600 font-semibold whitespace-nowrap">
                    {progressPercentage}%
                </div>
            </div>
        </Card>
    );
};

// SchoolJobsContainer Component - Handles data fetching for school
const SchoolJobsContainer: React.FC<SchoolJobsContainerProps> = ({
    schoolId,
}) => {
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchoolJobs = async (): Promise<void> => {
            try {
                setLoading(true);
                setError(null);
                const supabaseClient = createClient();
                // Call the Supabase function that returns a table
                const { data: result, error: rpcError } = await supabaseClient
                    .rpc('get_school_jobs_data', { p_school_id: schoolId });

                if (rpcError) {
                    throw rpcError;
                }

                setJobs(result || []);
            } catch (err) {
                console.error('Error fetching school jobs:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (schoolId) {
            fetchSchoolJobs();
        }
    }, [schoolId]);

    if (loading) {
        return (
            <div className="mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                                <div className="flex gap-2 mb-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="h-2 bg-gray-200 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-600">Error loading jobs: {error}</p>
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <p className="text-gray-600 text-lg">No jobs found for this school.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
                <JobCard key={job.id} data={job} />
            ))}
        </div>
    );
};

// Export components
export { JobCard, SchoolJobsContainer };
export type { JobData, Applicant, JobCardProps, SchoolJobsContainerProps };