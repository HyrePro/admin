"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, Users, RefreshCw, AlertCircle, Download, ChevronLeft } from "lucide-react";
import { getJobApplications, type JobApplication } from "@/lib/supabase/api/get-job-applications";
import { createClient } from '@/lib/supabase/api/client';
import { forceDownload } from "@/lib/utils";
import { ToastContainer } from "react-toastify";
import { statusColors } from "../../utils/statusColor";
import "react-toastify/dist/ReactToastify.css";

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
  paused: { text: 'Paused', color: statusColors.paused },
  completed: { text: 'Completed', color: statusColors.completed },
  suspended: { text: 'Suspended', color: statusColors.suspended },
  appealed: { text: 'Appealed', color: statusColors.appealed },
  withdrawn: { text: 'Withdrawn', color: statusColors.withdrawn },
  offered: { text: 'Offered', color: statusColors.offered },
} as const

export function JobCandidates({ job_id }: JobCandidatesProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [downloadingResumes, setDownloadingResumes] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const fetchTotalApplications = async (search: string = "") => {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job_id);
      
      if (search) {
        // This is a simplified search - you might need to adjust based on your actual search logic
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      return count || 0;
    } catch (err) {
      console.error("Error fetching total applications count:", err);
      return 0;
    }
  };

  const fetchApplications = async (search: string = "", page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      
      const { data, error } = await getJobApplications(
        job_id,
        startIndex,
        endIndex,
        search
      );

      if (error) {
        throw new Error(error);
      }

      // Validate and clean the data
      const validApplications = (data || []).filter((app) => {
        // Basic validation to ensure we have essential fields
        return app && 
               typeof app.application_id === 'string' && 
               app.application_id.length > 0;
      });

      setApplications(validApplications);
      
      // Fetch total count
      const totalCount = await fetchTotalApplications(search);
      setTotalApplications(totalCount);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch applications");
      // Set empty array on error to prevent rendering issues
      setApplications([]);
      setTotalApplications(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch applications when debounced search text or page changes
  useEffect(() => {
    fetchApplications(debouncedSearchText, currentPage);
  }, [job_id, debouncedSearchText, currentPage]);

  // Reset to first page when search text changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [debouncedSearchText]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const formatScore = (score: number | null | undefined, totalQuestions: number | null | undefined) => {
    // Handle null, undefined, or zero total questions
    if (!totalQuestions || totalQuestions === 0) return "N/A";
    
    // Handle null or undefined score
    const validScore = score ?? 0;
    
    return `${validScore}/${totalQuestions}`;
  };

  const handleResumeDownload = async (resumeUrl: string, applicationId: string, fileName?: string) => {
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
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(totalApplications / pageSize) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Error Component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load candidates</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching candidates. Please try again."}
      </p>
      <Button onClick={() => fetchApplications(debouncedSearchText, currentPage)} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
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
  );

  // Safe rendering function for application rows
  const renderApplicationRow = (application: JobApplication) => {
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
            <Badge
              variant="outline"
              className={`${statusColors[application.status] || "bg-gray-50 text-gray-700 border-gray-200"} text-xs text-white capitalize`}
            >
              {application.status ? 
                STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.text ||
                application.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) :
                "Unknown"
              }
            </Badge>
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
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <ToastContainer position="top-right" autoClose={3000} />
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
          {applications.length === 0 ? (
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
                      {applications.map(renderApplicationRow)}
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
}