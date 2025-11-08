"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

import { ArrowLeft, Briefcase, Users, AlertCircle, RefreshCw, Share, Copy, Check, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/api/client";
import { JobOverview } from "@/components/job-overview";
import { JobCandidates } from "@/components/job-candidates";
import { JobAnalytics } from "@/components/job-analytics";
import { EditJobDetailsDialog } from "@/components/edit-job-details-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface JobDetailsPageProps {
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

const STAGES = [
  { key: "assessment", label: "Assessment", color: "bg-blue-500" },
  { key: "demo", label: "Demo", color: "bg-yellow-500" },
  { key: "interviews", label: "Interviews", color: "bg-purple-500" },
  { key: "offered", label: "Offered", color: "bg-green-500" },
];

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const router = useRouter();
  const { jobId } = React.use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

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
    const jobLink = `https://www.hyrepro.in/apply/${jobId}`;
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
        setJob(jobData);
        setSelectedStatus(jobData.status);
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
    <div className="h-full flex flex-col">
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

      <div className="flex-shrink-0 mt-4">
        {/* Header with job title and action buttons */}
        {/* add breadcrumb here */}
        <Breadcrumb className="px-4">
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
        <div className="mt-2">
          <div className="flex items-start justify-between gap-6 px-4">
            <div className="flex flex-row gap-2">
              <h2 className="text-2xl font-bold leading-tight">
                {job?.title}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize font-medium text-sm",
                  statusColors[job?.status as keyof typeof statusColors] || "bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {job?.status === "ALL" ? "All" : job?.status?.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Details
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Change Status
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="space-y-1">
                    {["OPEN", "COMPLETED", "PAUSED"].map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        className={`w-full justify-between ${selectedStatus === status ? 'bg-blue-50 text-blue-700' : ''}`}
                        onClick={() => handleStatusChange(status)}
                        disabled={selectedStatus === status}
                      >
                        {status.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        {selectedStatus === status && (
                          <span className="ml-2">•</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Share Job Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="w-full">
            <div className="flex border-b border-gray-200 px-4 mt-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                  activeTab === "overview"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("candidates")}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                  activeTab === "candidates"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                )}
              >
                Candidates
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                  activeTab === "analytics"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                )}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-grow overflow-hidden">
        {activeTab === "overview" && (
          <JobOverview job={job} />
        )}

        {activeTab === "candidates" && (
          <JobCandidates job_id={jobId} />
        )}

        {activeTab === "analytics" && (
          <JobAnalytics jobId={jobId} />
        )}
      </div>
    </div>
  );
}
