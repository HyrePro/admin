"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenericHoverCard } from "@/components/ui/generic-hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, Users, RefreshCw, AlertCircle, Download, ChevronLeft } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { forceDownload } from "@/lib/utils";
import { statusColors } from "../../utils/statusColor";
import "react-toastify/dist/ReactToastify.css";
import '@/styles/candidates.css';

interface JobApplication {
  application_id: string;
  applicant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city: string;
  state: string;
  created_at: string;
  status: string;
  resume_url?: string;
  resume_file_name?: string;
  teaching_experience: Array<{
    city: string;
    school: string;
    endDate: string;
    startDate: string;
    designation: string;
  }>;
  education_qualifications: Array<{
    degree: string;
    endDate: string;
    startDate: string;
    institution: string;
    specialization: string;
  }>;
  subjects: string[];
  submitted_at?: string | null;
  score: number;
  category_scores: Record<string, {
    score: number;
    attempted: number;
    total_questions: number;
  }>;
  overall?: {
    score: number;
    attempted: number;
    total_questions: number;
  } | null;
  video_url?: string | null;
  demo_score?: number | null;
}

interface JobCandidatesProps {
  job_id: string;
}

const STATUS_CONFIG = {
  in_progress: { text: 'In Progress', color: statusColors.in_progress },
  application_submitted: { text: 'Application Submitted', color: statusColors.application_submitted },
  assessment_in_progress: { text: 'Assessment In Progress', color: statusColors.assessment_in_progress },
  assessment_in_evaluation: { text: 'Assessment In Evaluation', color: statusColors.assessment_in_evaluation },
  assessment_evaluated: { text: 'Assessment Evaluated', color: statusColors.assessment_evaluated },
  assessment_questionnaire_creation: { text: 'Assessment Questionnaire Creation', color: statusColors.assessment_questionnaire_creation },
  assessment_ready: { text: 'Assessment Ready', color: statusColors.assessment_ready },
  assessment_failed: { text: 'Assessment Failed', color: statusColors.assessment_failed },
  demo_creation: { text: 'Demo Creation', color: statusColors.demo_creation },
  demo_ready: { text: 'Demo Ready', color: statusColors.demo_ready },
  demo_in_progress: { text: 'Demo In Progress', color: statusColors.demo_in_progress },
  demo_in_evaluation: { text: 'Demo In Evaluation', color: statusColors.demo_in_evaluation },
  demo_evaluated: { text: 'Demo Evaluated', color: statusColors.demo_evaluated },
  demo_failed: { text: 'Demo Failed', color: statusColors.demo_failed },
  interview_in_progress: { text: 'Interview In Progress', color: statusColors.interview_in_progress },
  interview_ready: { text: 'Interview Ready', color: statusColors.interview_ready },
  interview_scheduled: { text: 'Interview Scheduled', color: statusColors.interview_scheduled },
  paused: { text: 'Paused', color: statusColors.paused },
  completed: { text: 'Completed', color: statusColors.completed },
  suspended: { text: 'Suspended', color: statusColors.suspended },
  appealed: { text: 'Appealed', color: statusColors.appealed },
  withdrawn: { text: 'Withdrawn', color: statusColors.withdrawn },
  offered: { text: 'Offered', color: statusColors.offered },
  panelist_review_in_progress: { text: 'Panelist Review In Progress', color: statusColors.panelist_review_in_progress },
} as const

export const JobCandidates = React.memo(({ job_id }: JobCandidatesProps) => {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  
  // Debug logging
  useEffect(() => {
    console.log('JobCandidates mounted with job_id:', job_id);
  }, [job_id]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [downloadingResumes, setDownloadingResumes] = useState<Set<string>>(new Set());
  const pageSize = 10;

  // Define the type for the API response
  interface ApiResponse {
    applications: JobApplication[];
    total: number;
    message?: string;
  }

  // Use TanStack Query to fetch applications data
  const { data: queryData, isLoading: queryLoading, isError: queryError, refetch } = useQuery<ApiResponse>({
    queryKey: ['job-applications', job_id, debouncedSearchText, currentPage],
    queryFn: async () => {
      console.log('Fetching job applications with params:', { job_id, debouncedSearchText, currentPage, pageSize });
      
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      
      const params = new URLSearchParams({
        jobId: job_id,
        startIndex: startIndex.toString(),
        endIndex: endIndex.toString(),
        search: debouncedSearchText,
      });
      
      console.log('API Request URL:', `/api/job-applications?${params.toString()}`);
      
      const response = await fetch(`/api/job-applications?${params.toString()}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Success response:', result);
      return result;
    },
    enabled: !!job_id,
    staleTime: 30000, // 30 seconds
  });

  // Update local state when query data changes
  useEffect(() => {
    if (queryData?.applications) {
      // Validate and clean the data
      const validApplications = (queryData.applications || []).filter((app: JobApplication) => {
        // Basic validation to ensure we have essential fields
        return app && 
               typeof app.application_id === 'string' && 
               app.application_id.length > 0;
      });
      
      setApplications(validApplications);
      setTotalApplications(queryData.total || 0);
    }
  }, [queryData]);

  // Use TanStack Query loading state
  const loading = queryLoading;
  
  // Handle error from query
  useEffect(() => {
    if (queryError) {
      setError("Failed to fetch applications");
    } else {
      setError(null);
    }
  }, [queryError]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Refetch when search text or page changes
  useEffect(() => {
    refetch();
  }, [debouncedSearchText, currentPage, refetch]);

  // Reset to first page when search text changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [debouncedSearchText]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  const formatScore = useCallback((score: number | null | undefined, totalQuestions: number | null | undefined) => {
    // Handle null, undefined, or zero total questions
    if (!totalQuestions || totalQuestions === 0) return "N/A";
    
    // Handle null or undefined score
    const validScore = score ?? 0;
    
    return `${validScore}/${totalQuestions}`;
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || 
      { text: status, color: 'bg-gray-100 text-gray-800' };
  }, []);

  const handleResumeDownload = useCallback(async (resumeUrl: string, applicationId: string, fileName?: string) => {
    if (downloadingResumes.has(applicationId)) return;
    
    setDownloadingResumes(prev => new Set(prev).add(applicationId));
    try {
      // Use forceDownload for better reliability
      forceDownload(resumeUrl, fileName || 'resume.pdf');
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => {
        setDownloadingResumes(prev => {
          const newSet = new Set(prev);
          newSet.delete(applicationId);
          return newSet;
        });
      }, 1000);
    }
  }, [downloadingResumes]);

  const handleNextPage = useCallback(() => {
    const maxPage = Math.ceil(totalApplications / pageSize) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [totalApplications, pageSize, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Memoize the applications data to avoid unnecessary re-renders
  const memoizedApplications = useMemo(() => applications, [applications]);

  // Error Component
  const ErrorState = useCallback(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load candidates</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching candidates. Please try again."}
      </p>
      <Button onClick={() => refetch()} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  ), [error, refetch, debouncedSearchText, currentPage]);

  // Loading Skeleton
  const LoadingSkeleton = useCallback(() => (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  ), []);

  // Empty State
  const EmptyState = useCallback(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {debouncedSearchText
          ? `No candidates match your search for "${debouncedSearchText}". Try adjusting your search terms.`
          : "No applications have been submitted for this job yet. Check back later as candidates apply."}
      </p>
      {debouncedSearchText && (
        <Button
          variant="outline"
          onClick={() => {
            setSearchText("");
          }}
        >
          Clear Search
        </Button>
      )}
    </div>
  ), [debouncedSearchText]);

  // Safe rendering function for application rows
  const renderApplicationRow = useCallback((application: JobApplication) => {
    try {
      return (
        <TableRow key={application.application_id} className="hover:bg-gray-50">
          <TableCell>
            <div className="space-y-1">
              <div className="font-medium text-gray-900">
                {application.first_name || "Unknown"} {application.last_name || ""}
              </div>
              <div className="text-sm text-gray-500">
                {application.email || "No email provided"}
              </div>
              <div className="text-xs text-gray-400">
                {application.city && application.state ? 
                  `${application.city}, ${application.state}` : 
                  "Location not provided"
                }
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(application.subjects) && application.subjects.length > 0 ? (
                application.subjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                  >
                    {subject}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No subjects</span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="font-medium">
                {application.overall ? 
                  formatScore(application.overall.score ?? 0, application.overall.total_questions ?? 0) : 
                  "N/A"
                }
              </div>
              <div className="text-xs text-gray-500">
                {application.overall ? 
                  `${application.overall.attempted ?? 0} attempted` : 
                  "Not assessed"
                }
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="font-medium">
                {application.demo_score ?? "N/A"}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div className="font-medium">
                N/A
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="cell-content flex items-start">
              <GenericHoverCard entity="application-stage" entityId={application.status}>
                <Badge className={getStatusBadge(application.status).color}>
                  <div className="badge-text">{getStatusBadge(application.status).text}</div>
                </Badge>
              </GenericHoverCard>
            </div>
          </TableCell>
          <TableCell>
            {application.resume_url ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResumeDownload(application.resume_url!, application.application_id, application.resume_file_name)}
                disabled={downloadingResumes.has(application.application_id)}
                className="h-8 w-8 p-0"
                title={downloadingResumes.has(application.application_id) ? "Downloading..." : "Download Resume"}
              >
                <Download className="h-4 w-4" />
              </Button>
            ) : (
              <span className="text-xs text-gray-400">No resume</span>
            )}
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                router.push(`/jobs/${job_id}/${application.application_id}`);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
      );
    } catch (renderError) {
      console.error('Error rendering application row:', renderError, application);
      return (
        <TableRow key={application.application_id || Math.random()} className="hover:bg-gray-50">
          <TableCell colSpan={8} className="text-center py-4">
            <div className="text-gray-500">Error displaying candidate data</div>
          </TableCell>
        </TableRow>
      );
    }
  }, [formatScore, handleResumeDownload, downloadingResumes, job_id, router]);

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name, email, or qualifications..."
            value={searchText}
            onChange={handleSearchInputChange}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Error State */}
      {error && !loading && <ErrorState />}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Candidates Table */}
          {memoizedApplications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="rounded-md border flex-grow flex flex-col overflow-hidden">
                <div className="overflow-x-auto flex-grow">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-1/5 font-normal">Candidate</TableHead>
                        <TableHead className="w-1/6 font-normal">Subjects</TableHead>
                        <TableHead className="w-1/6 font-normal">Score</TableHead>
                        <TableHead className="w-1/6 font-normal">AI Demo Score</TableHead>
                        <TableHead className="w-1/6 font-normal">Interview Score</TableHead>
                        <TableHead className="w-1/6 font-normal">Status</TableHead>
                        <TableHead className="w-1/12 font-normal">Resume</TableHead>
                        <TableHead className="w-12 font-normal"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="overflow-y-auto">
                      {memoizedApplications.map(renderApplicationRow)}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalApplications)} of {totalApplications} candidates
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= Math.ceil(totalApplications / pageSize) - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});