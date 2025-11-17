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
  type CandidateInfo,
  type ApplicationStage
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "assessment" | "video-assessment" | "panelist-review" | "ai-recommendation">("info");
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [loadingJobTitle, setLoadingJobTitle] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);

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
    // TODO: Implement reject functionality
    console.log("Reject candidate:", applicationId);
  };

  const handleHold = () => {
    // TODO: Implement hold functionality
    console.log("Hold candidate:", applicationId);
  };

  const handleOfferMade = () => {
    // TODO: Implement any post-offer logic
    console.log("Offer made for application:", applicationId);
    // You might want to refresh the application data or update the status
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
    <div className="h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="flex pt-4">
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
      <div className="space-y-4 px-4">
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
                
                {/* Status Badge moved here */}
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize font-medium text-sm",
                    statusColors[applicationStage?.status as keyof typeof statusColors] 
                      ? `${statusColors[applicationStage?.status as keyof typeof statusColors]} text-white` 
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  )}
                >
                  {applicationStage?.status.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                
                {/* Decision Buttons - Visible when status is ai_recommendation_completed */}
                {applicationStage?.status === "ai_recommendation_completed" && (
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8"
                      onClick={handleHold}
                    >
                      Hold
                    </Button>
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
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-base text-gray-600 mt-1">
                <span>{candidateInfo?.email}</span>
                {candidateInfo?.city && candidateInfo?.state && (
                  <>
                    <span>|</span>
                    <span>{candidateInfo.city}, {candidateInfo.state}</span>
                  </>
                )}
                {candidateInfo?.phone && (
                  <>
                    <span>•</span>
                    <span>{candidateInfo.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Popover (moved here but keeping same functionality) */}
          <div className="flex items-center gap-2">
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

      </div>

      {/* Removing the previous decision bar since it's now integrated above */}
      
      {/* Tab Navigation */}
      <div className="w-full flex-1 flex flex-col min-h-0 mt-4">
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
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
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
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
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
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
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
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
              "px-4 py-3 text-sm font-medium transition-all duration-200 relative",
              activeTab === "ai-recommendation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
            )}
          >
            AI Recommendation
          </button>
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-grow overflow-y-auto min-h-0">
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
    </div>
  );
}