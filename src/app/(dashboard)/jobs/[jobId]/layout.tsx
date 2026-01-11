"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { ArrowLeft, Briefcase, Users, AlertCircle, RefreshCw, Share, Copy, Check, Edit, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/api/client";
import dynamic from "next/dynamic";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname, useRouter as useNextRouter } from "next/navigation";

const EditJobDetailsDialog = dynamic(() => import("@/components/edit-job-details-dialog").then(mod => mod.EditJobDetailsDialog), {
  ssr: false
});

interface JobLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    jobId: string;
  }>;
}

type Job = {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
  job_type?: string;
  location?: string;
  mode?: string;
  board?: string;
  openings?: number;
  salary_range?: string;
  job_description?: string;
  responsibilities?: string;
  created_at?: string;
  school_id?: string;
  number_of_questions?: number;
  assessment_difficulty?: {
    interviewFormat?: string;
    includeInterview?: boolean;
    demoVideoDuration?: number;
    interviewDuration?: number;
    includeSubjectTest?: boolean;
    subjectTestDuration?: number;
    interviewQuestions?: Array<{
      id: number;
      question: string;
    }>;
  };
  application_analytics: {
    total_applications: number;
    assessment: number;
    demo: number;
    interviews: number;
    offered: number;
  };
};

// Create a context for the job data
const JobContext = createContext<{ job: Job | null }>({ job: null });

export function useJob() {
  return useContext(JobContext);
}

export default function JobLayout({ children, params }: JobLayoutProps) {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const { jobId } = React.use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Check if we're on an application details page (e.g., /jobs/jobId/applicationId or /jobs/jobId/applicationId/tab)
  // This checks for paths that have at least 3 segments after /jobs/ where the second segment matches the current jobId
  const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
  const isApplicationDetailsPage = pathname.startsWith('/jobs/') && 
                                 pathSegments.length >= 3 &&
                                 pathSegments[1] === jobId &&  // Second segment matches the jobId
                                 pathSegments[2] !== 'candidates' && 
                                 pathSegments[2] !== 'assessment' && 
                                 pathSegments[2] !== 'analytics';

  const handleGoBack = () => {
    router.back();
  };

  const handleStatusChange = async (newStatus: string) => {
    // If the status is the same, do nothing
    if (selectedStatus === newStatus) {
      return;
    }

    // Set the pending status and open the confirmation dialog
    setPendingStatus(newStatus);
    setIsConfirmDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !jobId) return;

    try {
      // Make API call to update the job status
      const supabase = createClient();
      const { error } = await supabase
        .from('jobs')
        .update({ status: pendingStatus })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job status:', error);
        // TODO: Show error message to user
        return;
      }

      // Update the status in the UI
      setSelectedStatus(pendingStatus);

      // Update the job object if it exists
      if (job) {
        setJob({
          ...job,
          status: pendingStatus
        });
      }

      // Close the dialog
      setIsConfirmDialogOpen(false);

      // Clear the pending status
      setPendingStatus(null);

      // Show success message
      console.log("Job status updated successfully");
    } catch (err) {
      console.error('Error updating job status:', err);
      // TODO: Show error message to user
    }
  };

  const cancelStatusChange = () => {
    setIsConfirmDialogOpen(false);
    setPendingStatus(null);
  };

  const handleCopyLink = async () => {
    const jobLink = `https://www.hyriki.com/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(jobLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a Supabase client instance
      const supabase = createClient();

      const { data, error } = await supabase.rpc("get_job_with_analytics", {
        p_job_id: jobId,
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch job details");
      } else if (data && data.length > 0) {
        const jobData = data[0];
        // Ensure job data is properly serialized to avoid non-serializable object errors
        const serializedJob = JSON.parse(JSON.stringify(jobData));
        setJob(serializedJob);
        setSelectedStatus(serializedJob.status);
      } else {
        throw new Error("Job not found");
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleSaveJobDetails = async (updatedJob: Partial<Job>) => {
    // TODO: Implement the actual save functionality
    console.log("Saving job details:", updatedJob);
    // This is a placeholder for the actual API call
    // When the API is ready, we'll implement the update here

    // For now, just update the local state
    if (job) {
      setJob({
        ...job,
        ...updatedJob
      });
    }
  };

  // Error Component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load job details</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching job details. Please try again."}
      </p>
      <Button onClick={fetchJobDetails} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <ErrorState />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Job not found</p>
        </div>
      </div>
    );
  }

  const total = job.application_analytics.total_applications || 1;
  const statusColors = {
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPEALED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <JobContext.Provider value={{ job }}>
      <div className="h-full flex flex-col bg-white">
        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>
                {pendingStatus === "PAUSED" && selectedStatus === "OPEN" ? (
                  "Changing the status to Paused means new applications will not be received, but the job can be reopened later."
                ) : pendingStatus === "COMPLETED" ? (
                  "Closing the job means it cannot be reopened again. Are you sure you want to close this job?"
                ) : (
                  `Are you sure you want to change the job status from ${selectedStatus?.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} to ${pendingStatus?.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}?`
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelStatusChange}>
                Cancel
              </Button>
              <Button onClick={confirmStatusChange}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add the EditJobDetailsDialog component */}
        <EditJobDetailsDialog
          job={job}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveJobDetails}
        />

        {!isApplicationDetailsPage && (
          <div className="flex-shrink-0 border-b border-gray-200">
            {/* Breadcrumb */}
            <Breadcrumb className="px-6 pt-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link href="/jobs" scroll={false}>
                    <BreadcrumbLink>Jobs</BreadcrumbLink>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{job?.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header with job title and action buttons */}
            <div className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {job?.title}
                    </h1>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize font-medium text-xs px-2 py-0.5 cursor-pointer flex items-center gap-1",
                            statusColors[job?.status as keyof typeof statusColors] || "bg-gray-50 text-gray-700 border-gray-200"
                          )}
                        >
                          {job?.status === "ALL" ? "All" : job?.status?.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                          <ChevronDown className="h-3 w-3" />
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2">
                        <div className="space-y-1">
                          {['OPEN', 'COMPLETED', 'PAUSED'].map((status) => (
                            <Button
                              key={status}
                              variant="ghost"
                              className={`w-full justify-between text-sm ${selectedStatus === status ? 'bg-blue-50 text-blue-700' : ''}`}
                              onClick={() => handleStatusChange(status)}
                              disabled={selectedStatus === status}
                            >
                              {status.toLowerCase().replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {selectedStatus === status && (
                                <span className="ml-2">•</span>
                              )}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Job metadata */}
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium text-gray-900">#{job?.id.slice(0, 6)}</span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">{job?.job_type || 'Full Time'}</span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">{job?.location || 'Riyadh, Saudi Arabia'}</span>
                    </div>
                    <span className="text-gray-300 hidden lg:inline">|</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">Job Available:</span>
                      <span className="font-medium text-gray-900">{job?.openings || 3}/10</span>
                    </div>
                    <span className="text-gray-300 hidden lg:inline">|</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">Added at:</span>
                      <span className="font-medium text-gray-900">{job?.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Apr, 2025'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Share className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm font-normal"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Job Link
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Job
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="w-full">
              <div className="flex border-b border-gray-200 px-6">
                <button
                  onClick={() => nextRouter.push(`/jobs/${jobId}`)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                    pathname === `/jobs/${jobId}` || pathname === `/jobs/${jobId}/`
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => nextRouter.push(`/jobs/${jobId}/assessment`)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                    pathname.endsWith("/assessment")
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                  )}
                >
                  Assessment
                </button>
                <button
                  onClick={() => nextRouter.push(`/jobs/${jobId}/candidates`)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                    pathname.endsWith("/candidates")
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                  )}
                >
                  Candidates
                </button>
                <button
                  onClick={() => nextRouter.push(`/jobs/${jobId}/analytics`)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                    pathname.endsWith("/analytics")
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                  )}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </JobContext.Provider>
  );
}