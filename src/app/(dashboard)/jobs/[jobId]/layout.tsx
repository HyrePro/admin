"use client";

import React, { createContext, useContext, useState } from "react";
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

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/api/client";
import dynamic from "next/dynamic";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import "@/styles/progress-bar.css";
import { ArrowLeft, Briefcase, Users, AlertCircle, RefreshCw, Share, Copy, Check, Edit, ChevronDown, MoreVertical, Share2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

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
  created_by?: string; // UUID of the user who created the job
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
  
  const { user } = useAuth();

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

  const {
    data: jobData,
    isLoading: jobLoading,
    error: jobQueryError,
    refetch
  } = useQuery({
    queryKey: ['job-with-analytics', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/job-with-analytics`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch job details');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!jobId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local state when query data changes
  React.useEffect(() => {
    if (jobData) {
      setJob(jobData);
      setSelectedStatus(jobData.status);
    }
  }, [jobData]);

  // Update loading and error states from query
  React.useEffect(() => {
    setLoading(jobLoading);
  }, [jobLoading]);

  React.useEffect(() => {
    setError(jobQueryError ? jobQueryError.message : null);
  }, [jobQueryError]);

  const fetchJobDetails = () => refetch();

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
    <div className="h-full bg-white">
      <div className="mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content - Left Side Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side Skeleton */}
          <div className="min-w-72 flex-shrink-0 h-fit border-l border-gray-200 pl-6">
            <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
            
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-3 flex-1 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  {/* Title and badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                      {job?.title}
                    </h1>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize font-medium text-xs px-2 py-0.5 cursor-pointer flex items-center gap-1 flex-shrink-0",
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
                              {selectedStatus === status && <span className="ml-2">•</span>}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {job?.created_by && user?.id && job.created_by === user.id && (
                      <Badge variant="secondary" className="text-xs px-2 py-1 flex-shrink-0">
                        Created by You
                      </Badge>
                    )}
                  </div>
                  
                  {/* Job metadata - stacked on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm mt-2 sm:flex-wrap min-w-0">
                    {/* Job Type */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900 capitalize whitespace-nowrap">{job?.job_type || 'Full Time'}</span>
                    </div>

                    <span className="text-gray-300 hidden sm:inline">|</span>

                    {/* Applications */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600 whitespace-nowrap">Applications:</span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">{job?.application_analytics?.total_applications || 0} of 50</span>
                      <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2 flex-shrink-0">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${job?.application_analytics?.total_applications ? Math.min(100, (job.application_analytics.total_applications / 50) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <span className="text-gray-300 hidden sm:inline">|</span>

                    {/* Date and Urgency */}
                    <div className="flex flex-wrap sm:items-center gap-2 ">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600 whitespace-nowrap">Added:</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">
                          {job?.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Apr, 2025'}
                        </span>
                      </div>
                      
                      {/* Urgency indicator */}
                      {job?.created_at && (() => {
                        const createdDate = new Date(job.created_at);
                        const dueDate = new Date(createdDate);
                        dueDate.setDate(dueDate.getDate() + 30); // 1 month from added date
                        
                        const today = new Date();
                        const timeDiff = dueDate.getTime() - today.getTime();
                        const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        
                        let urgencyLabel = '';
                        let urgencyColor = '';
                        
                        if (daysUntilDue <= 3) {
                          urgencyLabel = 'CRITICAL';
                          urgencyColor = 'bg-red-100 text-red-800 border-red-200';
                        } else if (daysUntilDue <= 7) {
                          urgencyLabel = 'URGENT';
                          urgencyColor = 'bg-orange-100 text-orange-800 border-orange-200';
                        } else if (daysUntilDue <= 15) {
                          urgencyLabel = 'MODERATE';
                          urgencyColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        } else {
                          urgencyLabel = 'NORMAL';
                          urgencyColor = 'bg-green-100 text-green-800 border-green-200';
                        }
                        
                        return (
                          <span className={`whitespace-nowrap px-2 py-1 rounded-md text-xs font-semibold border ${urgencyColor} inline-block`}>
                            {urgencyLabel}: Due in {daysUntilDue} days
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Show Edit and Share buttons on medium screens and up */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 hidden md:flex"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2 text-gray-600" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 hidden md:flex"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 text-gray-600" />
                        
                      </>
                    )}
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="end">
                      <div className="space-y-1">
                        {/* Show Edit and Share options on small screens only */}
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm font-normal md:hidden"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm font-normal md:hidden"
                          onClick={handleCopyLink}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        {/* Show Copy Job Link on all screens */}
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