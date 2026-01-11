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
  MoreVertical,
  Mail,
  MapPin,
  Phone
} from "@/components/icons";
import { createClient } from "@/lib/supabase/api/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

import { MakeOfferDialog } from "@/components/make-offer-dialog";
import { RejectCandidateDialog } from "@/components/reject-candidate-dialog";
import { toast } from "sonner";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { getStatusBadgeClasses, getStatusDotColor } from "../../../../../../utils/statusColor";

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

      setCandidateInfo(result.candidateInfo ? JSON.parse(JSON.stringify(result.candidateInfo)) : null);
      setApplicationStage(result.applicationStage ? JSON.parse(JSON.stringify(result.applicationStage)) : null);
      
      if (result.applicationStage?.status === "ai_recommendation_completed") {
        const aiResult = await getAIEvaluation(applicationId);
        if (!aiResult.error) {
          setAIEvaluation(aiResult.aiEvaluation ? JSON.parse(JSON.stringify(aiResult.aiEvaluation)) : null);
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
      <div className="h-full flex flex-col bg-white">
        <div className="px-6 pt-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-6 pt-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link href="/jobs" scroll={false}>
                  <BreadcrumbLink>Jobs</BreadcrumbLink>
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Error</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
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
      <div className="h-full flex flex-col bg-white">
        <div className="px-6 pt-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Application not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ApplicationContext.Provider value={{ 
      candidateInfo: candidateInfo ? JSON.parse(JSON.stringify(candidateInfo)) : null, 
      applicationStage: applicationStage ? JSON.parse(JSON.stringify(applicationStage)) : null, 
      aiEvaluation: aiEvaluation ? JSON.parse(JSON.stringify(aiEvaluation)) : null,
      jobId,
      applicationId,
      loading,
      error,
      refreshData
    }}>
      <div className="flex flex-col h-full bg-white">
        {/* Header Section */}
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

          {/* Candidate Header */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                  {(candidateInfo?.first_name?.[0] || '').toUpperCase()}
                  {(candidateInfo?.last_name?.[0] || '').toUpperCase() || 'U'}
                </div>

                {/* Candidate Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {candidateInfo?.first_name} {candidateInfo?.last_name}
                    </h1>
                    
                    {/* Status Badge */}
                    <Badge className={getStatusBadgeClasses(applicationStage?.status)}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                        style={{ backgroundColor: getStatusDotColor(applicationStage?.status) }}
                      />
                      {applicationStage?.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{candidateInfo?.email}</span>
                    </div>
                    {candidateInfo?.phone && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{candidateInfo.phone}</span>
                        </div>
                      </>
                    )}
                    {(candidateInfo?.city && candidateInfo?.state) && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{candidateInfo.city}, {candidateInfo.state}</span>
                        </div>
                      </>
                    )}
                    {candidateInfo?.created_at && (
                      <>
                        <span className="text-gray-300 hidden lg:inline">|</span>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">Applied:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(candidateInfo.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Offer/Reject Buttons - Desktop */}
                {applicationStage?.status === "ai_recommendation_completed" && (
                  <div className="hidden md:flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50 h-8 text-xs px-3"
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-3"
                      onClick={handleOffer}
                    >
                      Make Offer
                    </Button>
                  </div>
                )}

                {/* More Options */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm font-normal h-9 px-3"
                        onClick={handleMessageCandidate}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Candidate
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm font-normal h-9 px-3"
                        onClick={handleChangeStatus}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Change Status
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm font-normal h-9 px-3"
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

            {/* Mobile Action Buttons */}
            {applicationStage?.status === "ai_recommendation_completed" && (
              <div className="md:hidden flex gap-2 mt-4">
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
                  Make Offer
                </Button>
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <div className="w-full">
            <div className="flex border-b border-gray-200 px-6">
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