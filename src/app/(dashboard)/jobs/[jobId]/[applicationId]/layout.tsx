"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  User,
  MessageSquare,
  Edit3,
  FileText,
  AlertCircle,
  RefreshCw,
  MoreVertical
} from "@/components/icons";
import { createClient } from "@/lib/supabase/api/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { statusColors } from "../../../../../../utils/statusColor";
import { MakeOfferDialog } from "@/components/make-offer-dialog";
import { RejectCandidateDialog } from "@/components/reject-candidate-dialog";
import { toast } from "sonner";
import { usePathname, useRouter as useNextRouter } from "next/navigation";

// Types
type CandidateInfo = {
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  resume_url?: string;
  resume_file_name?: string;
  cover_letter?: string;
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
  grade_levels?: string[];
  created_at: string;
};

type ApplicationStage = {
  application_id: string;
  status: string;
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
  created_at?: string;
  updated_at?: string;
  demo_score?: number;
};

type AIEvaluation = {
  id: string;
  application_id: string;
  final_recommendation: string;
  strengths: Text[];
  areas_for_improvement: Text[];
  raw_payload: Text[];
  created_at: string;
};

// Context for sharing application data
const ApplicationContext = createContext<{
  candidateInfo: CandidateInfo | null;
  applicationStage: ApplicationStage | null;
  aiEvaluation: AIEvaluation | null;
  jobId: string;
  applicationId: string;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}>({
  candidateInfo: null,
  applicationStage: null,
  aiEvaluation: null,
  jobId: "",
  applicationId: "",
  loading: true,
  error: null,
  refreshData: () => {}
});

export function useApplication() {
  return useContext(ApplicationContext);
}

// Props
interface ApplicationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    jobId: string;
    applicationId: string;
  }>;
}

// Helper function to fetch application data
async function getJobApplication(applicationId: string) {
  try {
    const supabase = createClient();
    
    // Fetch job application data using the RPC function
    const { data, error } = await supabase.rpc("get_job_application", {
      p_application_id: applicationId,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch job application");
    }

    const applicationData = data?.[0];
    
    if (!applicationData) {
      throw new Error("Application not found");
    }

    // Split data into candidate info and application stage
    const candidateInfo = {
      application_id: applicationData.application_id,
      first_name: applicationData.first_name,
      last_name: applicationData.last_name,
      email: applicationData.email,
      phone: applicationData.phone,
      city: applicationData.city,
      state: applicationData.state,
      resume_url: applicationData.resume_url,
      resume_file_name: applicationData.resume_file_name,
      cover_letter: applicationData.cover_letter,
      teaching_experience: applicationData.teaching_experience,
      education_qualifications: applicationData.education_qualifications,
      subjects: applicationData.subjects,
      grade_levels: applicationData.grade_levels,
      created_at: applicationData.created_at,
    };

    const applicationStage = {
      application_id: applicationData.application_id,
      status: applicationData.status,
      submitted_at: applicationData.submitted_at,
      score: applicationData.score,
      category_scores: applicationData.category_scores,
      overall: applicationData.overall,
      video_url: applicationData.video_url,
      created_at: applicationData.created_at,
      updated_at: applicationData.updated_at,
      demo_score: applicationData.demo_score,
    };

    return {
      candidateInfo,
      applicationStage,
      error: null
    };
  } catch (error) {
    return {
      candidateInfo: null,
      applicationStage: null,
      error: (error as Error).message
    };
  }
}

// Helper function to fetch AI evaluation
async function getAIEvaluation(applicationId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('application_ai_evaluations')
      .select('*')
      .eq('application_id', applicationId)
      .single();

    if (error) {
      return { aiEvaluation: null, error: error.message };
    }

    return { aiEvaluation: data, error: null };
  } catch (error) {
    return { aiEvaluation: null, error: (error as Error).message };
  }
}

export default function ApplicationLayout({ children, params }: ApplicationLayoutProps) {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const { jobId, applicationId } = React.use(params);

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [applicationStage, setApplicationStage] = useState<ApplicationStage | null>(null);
  const [aiEvaluation, setAIEvaluation] = useState<AIEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [loadingJobTitle, setLoadingJobTitle] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleMessageCandidate = () => {
    console.log("Message candidate:", candidateInfo?.first_name, candidateInfo?.last_name);
  };

  const handleChangeStatus = () => {
    console.log("Change status for application:", applicationId);
  };

  const handleAddNote = () => {
    console.log("Add note for application:", applicationId);
  };

  const handleOffer = () => {
    setIsOfferDialogOpen(true);
  };

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleOfferMade = () => {
    console.log("Offer made for application:", applicationId);
    refreshData();
  };

  const handleRejectConfirmed = () => {
    console.log("Candidate rejected for application:", applicationId);
    refreshData();
  };

  const fetchJobTitle = async () => {
    if (!jobId) {
      setJobTitle(null);
      return;
    }

    setLoadingJobTitle(true);
    try {
      const supabase = createClient();
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

  const refreshData = async () => {
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
    refreshData();
  }, [applicationId]);

  useEffect(() => {
    fetchJobTitle();
  }, [jobId]);

  // Loading state
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
        </div>
      </div>
    );
  }

  // Error state
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
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load application details</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {error || "Something went wrong while fetching application details. Please try again."}
            </p>
            <Button onClick={refreshData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
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
    <ApplicationContext.Provider value={{ 
      candidateInfo, 
      applicationStage, 
      aiEvaluation,
      jobId,
      applicationId,
      loading,
      error,
      refreshData
    }}>
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

        {/* Tab navigation */}
        <div className="w-full px-4 mt-4 flex-shrink-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}`)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                pathname === `/jobs/${jobId}/${applicationId}` || pathname === `/jobs/${jobId}/${applicationId}/`
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
              )}
            >
              Info
            </button>
            <button
              onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}/assessment`)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                pathname.endsWith("/assessment")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
              )}
            >
              MCQ Assessment
            </button>
            <button
              onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}/video-assessment`)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                pathname.endsWith("/video-assessment")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
              )}
            >
              Video Assessment
            </button>
            <button
              onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}/panelist-review`)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                pathname.endsWith("/panelist-review")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
              )}
            >
              Panelist Review
            </button>
            <button
              onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}/ai-recommendation`)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                pathname.endsWith("/ai-recommendation")
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
              )}
            >
              AI Recommendation
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto">
          {children}
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
    </ApplicationContext.Provider>
  );
}