"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  MessageSquare,
  Edit3,
  FileText
} from "lucide-react";
import {
  getJobApplication,
  getAIEvaluation,
  type CandidateInfo,
  type ApplicationStage,
  type AIEvaluation
} from "@/lib/supabase/api/get-job-application";
import { cn } from "@/lib/utils";
import { CandidateInfo as CandidateInfoComponent } from "@/components/candidate-info";
import { MCQAssessment } from "@/components/mcq-assessment";
import { VideoAssessment } from "@/components/video-assessment";
import { PanelistReview } from "@/components/panelist-review";
import { AIRecommendation } from "@/components/ai-recommendation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { createClient } from "@/lib/supabase/api/client";
import { statusColors } from "../../../../../../utils/statusColor";
import { MakeOfferDialog } from "@/components/make-offer-dialog";
import { RejectCandidateDialog } from "@/components/reject-candidate-dialog";
import { toast } from "sonner";

interface ApplicationDetailsPageProps {
  params: Promise<{
    jobId: string;
    applicationId: string;
  }>;
}

export default function ApplicationDetailsPage({ params }: ApplicationDetailsPageProps) {
  const router = useRouter();
  const { jobId, applicationId } = React.use(params);

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [applicationStage, setApplicationStage] = useState<ApplicationStage | null>(null);
  const [aiEvaluation, setAIEvaluation] = useState<AIEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "assessment" | "video-assessment" | "panelist-review" | "ai-recommendation">("info");
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [loadingJobTitle, setLoadingJobTitle] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleMessageCandidate = () => {
    // TODO: Implement message candidate functionality
    console.log("Message candidate:", candidateInfo?.first_name, candidateInfo?.last_name);
  };

  const handleChangeStatus = () => {
    // TODO: Implement change status functionality
    console.log("Change status for application:", applicationId);
  };

  const handleAddNote = () => {
    // TODO: Implement add note functionality
    console.log("Add note for application:", applicationId);
  };

  const handleOffer = () => {
    // Open the offer dialog
    setIsOfferDialogOpen(true);
  };

  const handleReject = () => {
    // Open the reject dialog
    setIsRejectDialogOpen(true);
  };

  const handleHold = async () => {
    try {
      const supabase = createClient();
      
      // Update job application status to "hold"
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'hold'
        })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(`Failed to update application status: ${updateError.message}`);
      }

      toast.success("Candidate put on hold successfully");
      // Refresh the application data to show the updated status
      fetchApplicationData();
    } catch (error: unknown) {
      console.error("Error putting candidate on hold:", error);
      toast.error((error as Error | undefined)?.message || "Failed to put candidate on hold. Please try again.");
    }
  };

  const handleOfferMade = () => {
    // TODO: Implement any post-offer logic
    console.log("Offer made for application:", applicationId);
    // You might want to refresh the application data or update the status
  };

  const handleRejectConfirmed = () => {
    // TODO: Implement any post-reject logic
    console.log("Candidate rejected for application:", applicationId);
    // You might want to refresh the application data or update the status
    // For now, we'll just show a toast and close the dialog
    fetchApplicationData();
  };

  const fetchJobTitle = async () => {
    if (!jobId) {
      setJobTitle(null);
      return;
    }

    setLoadingJobTitle(true);
    try {
      // Create a Supabase client instance
      const supabase = createClient();
      // Query the jobs table directly by ID to get the title
      const { data, error } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error("Error fetching job data:", error);
        setJobTitle("Job Details");
      } else {
        setJobTitle(data?.title || "Job Details");
      }
    } catch (err) {
      console.error("Error fetching job title:", err);
      setJobTitle("Job Details");
    } finally {
      setLoadingJobTitle(false);
    }
  };

  const fetchApplicationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getJobApplication(applicationId);

      if (result.error) {
        throw new Error(result.error);
      }

      setCandidateInfo(result.candidateInfo);
      setApplicationStage(result.applicationStage);
      
      // Fetch AI evaluation if status is ai_recommendation_completed
      if (result.applicationStage?.status === "ai_recommendation_completed") {
        const aiResult = await getAIEvaluation(applicationId);
        if (!aiResult.error) {
          setAIEvaluation(aiResult.aiEvaluation);
        }
      }
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationData();
  }, [applicationId]);

  useEffect(() => {
    fetchJobTitle();
  }, [jobId]);


  // Error Component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load application details</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching application details. Please try again."}
      </p>
      <Button onClick={fetchApplicationData} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        <div className="border rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 px-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Application Details</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 px-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Application Details</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <ErrorState />
        </div>
      </div>
    );
  }

  if (!candidateInfo || !applicationStage) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 px-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-bold tracking-tight">Application Details</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-600">Application not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex pt-4 flex-shrink-0">
        <Breadcrumb className="px-4 mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href="/jobs" scroll={false}>
                <BreadcrumbLink>Jobs</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <Link href={`/jobs/${jobId}`} scroll={false}>
                <BreadcrumbLink>{loadingJobTitle ? "Loading..." : (jobTitle || "Job Details")}</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{candidateInfo?.first_name} {candidateInfo?.last_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Application Title and Basic Info */}
      <div className="space-y-4 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
              {(candidateInfo?.first_name?.[0] || '').toUpperCase()}
              {(candidateInfo?.last_name?.[0] || '').toUpperCase() || 'U'}
            </div>

            {/* Candidate Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {candidateInfo?.first_name} {candidateInfo?.last_name}
                </h2>
                
                {/* Status Badge - Show AI recommendation if available, otherwise show regular status */}
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize font-medium text-sm",
                    aiEvaluation?.final_recommendation
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent"
                      : statusColors[applicationStage?.status as keyof typeof statusColors] 
                        ? `${statusColors[applicationStage?.status as keyof typeof statusColors]} text-white` 
                        : "bg-gray-50 text-gray-700 border-gray-200"
                  )}
                >
                  {aiEvaluation?.final_recommendation 
                    ? aiEvaluation.final_recommendation.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                    : applicationStage?.status?.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-base text-gray-600 mt-1">
                <span>{candidateInfo?.email}</span>
                {(candidateInfo?.city && candidateInfo?.state) && (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <span>{candidateInfo.city}, {candidateInfo.state}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons and Popover */}
          <div className="flex items-center gap-2">
            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-2">
              {applicationStage?.status === "ai_recommendation_completed" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-600 text-red-600 hover:bg-red-50 h-8"
                    onClick={handleReject}
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-8"
                    onClick={handleOffer}
                  >
                    Offer
                  </Button>
                </>
              )}
            </div>

            {/* Quick Actions Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  aria-label="Quick actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-0">
                <div className="space-y-1 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm"
                    onClick={handleMessageCandidate}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Candidate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm"
                    onClick={handleChangeStatus}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Change Status
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm"
                    onClick={handleAddNote}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mobile Action Buttons - Moved above tabs for mobile */}
        <div className="md:hidden flex gap-2 mt-4">
          {applicationStage?.status === "ai_recommendation_completed" && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50 h-8 flex-1"
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-8 flex-1"
                onClick={handleOffer}
              >
                Offer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation and Content - Scrollable Area */}
      <div className="flex-1 flex flex-col mt-4 min-h-0">
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto flex-shrink-0 hide-scrollbar">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
              activeTab === "info"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab("assessment")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
              activeTab === "assessment"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            MCQ Assessment
          </button>
          <button
            onClick={() => setActiveTab("video-assessment")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
              activeTab === "video-assessment"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            Video Assessment
          </button>
          <button
            onClick={() => setActiveTab("panelist-review")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
              activeTab === "panelist-review"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            Panelist Review
          </button>
          {/* Add AI Recommendation tab */}
          <button
            onClick={() => setActiveTab("ai-recommendation")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
              activeTab === "ai-recommendation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            AI Recommendation
          </button>
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div>
            {activeTab === "info" && candidateInfo && (
              <CandidateInfoComponent candidateInfo={candidateInfo} />
            )}
            {activeTab === "assessment" && applicationStage && (
              <MCQAssessment applicationStage={applicationStage} />
            )}
            {activeTab === "video-assessment" && applicationStage && (
              <VideoAssessment applicationStage={applicationStage} />
            )}
            {activeTab === "panelist-review" && (
              <PanelistReview jobApplicationId={applicationId} />
            )}
            {/* Add AI Recommendation tab content */}
            {activeTab === "ai-recommendation" && (
              <AIRecommendation jobApplicationId={applicationId} />
            )}
          </div>
        </div>
      </div>
      
      {/* Make Offer Dialog */}
      {candidateInfo && jobTitle && (
        <MakeOfferDialog
          open={isOfferDialogOpen}
          onOpenChange={setIsOfferDialogOpen}
          candidateInfo={candidateInfo}
          jobInfo={{
            title: jobTitle,
            id: jobId
          }}
          jobApplicationId={applicationId}
          onOfferMade={handleOfferMade}
        />
      )}

      {/* Reject Candidate Dialog */}
      {candidateInfo && jobTitle && (
        <RejectCandidateDialog
          open={isRejectDialogOpen}
          onOpenChange={setIsRejectDialogOpen}
          candidateInfo={candidateInfo}
          jobInfo={{
            title: jobTitle
          }}
          jobApplicationId={applicationId}
          onReject={handleRejectConfirmed}
        />
      )}
    </div>
  );
}