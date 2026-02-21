"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useRouter as useNextRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit3, FileText, AlertCircle, RefreshCw, MoreVertical, Mail, MapPin, Phone } from "@/components/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MakeOfferDialog } from "@/components/make-offer-dialog";
import { RejectCandidateDialog } from "@/components/reject-candidate-dialog";
import { cn } from "@/lib/utils";
import { getStatusBadgeClasses, getStatusDotColor } from "../../utils/statusColor";
import type { CandidateInfo, ApplicationStage, AIEvaluation } from "@/lib/supabase/api/get-job-application";
import { useWarmRoute } from "@/hooks/use-warm-route";

const ApplicationContext = createContext<{
  candidateInfo: CandidateInfo | null;
  applicationStage: ApplicationStage | null;
  aiEvaluation: AIEvaluation | null;
  jobId: string;
  applicationId: string;
  loading: boolean;
  error: string | null;
  isNotesDialogOpen: boolean;
  setNotesDialogOpen: (open: boolean) => void;
  refreshData: () => void;
}>({
  candidateInfo: null,
  applicationStage: null,
  aiEvaluation: null,
  jobId: "",
  applicationId: "",
  loading: true,
  error: null,
  isNotesDialogOpen: false,
  setNotesDialogOpen: () => {},
  refreshData: () => {},
});

export function useApplication() {
  return useContext(ApplicationContext);
}

interface ApplicationLayoutClientProps {
  children: React.ReactNode;
  jobId: string;
  applicationId: string;
  initialCandidateInfo: CandidateInfo | null;
  initialApplicationStage: ApplicationStage | null;
  initialAIEvaluation: AIEvaluation | null;
  initialJobTitle: string | null;
  initialError: string | null;
}

export default function ApplicationLayoutClient({
  children,
  jobId,
  applicationId,
  initialCandidateInfo,
  initialApplicationStage,
  initialAIEvaluation,
  initialJobTitle,
  initialError,
}: ApplicationLayoutClientProps) {
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(initialCandidateInfo);
  const [applicationStage, setApplicationStage] = useState<ApplicationStage | null>(initialApplicationStage);
  const [aiEvaluation, setAIEvaluation] = useState<AIEvaluation | null>(initialAIEvaluation);
  const [jobTitle, setJobTitle] = useState<string | null>(initialJobTitle);
  const [loading, setLoading] = useState(!initialCandidateInfo && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  useWarmRoute("warm_app_detail", !!candidateInfo && !!applicationStage, 60);

  useEffect(() => {
    setCandidateInfo(initialCandidateInfo);
    setApplicationStage(initialApplicationStage);
    setAIEvaluation(initialAIEvaluation);
    setJobTitle(initialJobTitle);
    setError(initialError);
    setLoading(false);
  }, [initialCandidateInfo, initialApplicationStage, initialAIEvaluation, initialJobTitle, initialError]);

  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    router.refresh();
  }, [router]);

  const handleChangeStatus = () => {};

  const handleAddNote = () => {
    setIsNotesDialogOpen(true);
  };

  const handleOffer = () => {
    setIsOfferDialogOpen(true);
  };

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleOfferMade = () => {
    refreshData();
  };

  const handleRejectConfirmed = () => {
    refreshData();
  };

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

  const applicationContextValue = useMemo(
    () => ({
      candidateInfo: candidateInfo ? JSON.parse(JSON.stringify(candidateInfo)) : null,
      applicationStage: applicationStage ? JSON.parse(JSON.stringify(applicationStage)) : null,
      aiEvaluation: aiEvaluation ? JSON.parse(JSON.stringify(aiEvaluation)) : null,
      jobId,
      applicationId,
      loading,
      error,
      isNotesDialogOpen,
      setNotesDialogOpen: setIsNotesDialogOpen,
      refreshData,
    }),
    [candidateInfo, applicationStage, aiEvaluation, jobId, applicationId, loading, error, isNotesDialogOpen, refreshData]
  );

  return (
    <ApplicationContext.Provider value={applicationContextValue}>
      <div className="flex flex-col h-full bg-white">
        <div className="flex-shrink-0 border-b border-gray-200">
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
                  <BreadcrumbLink>{jobTitle || "Job Details"}</BreadcrumbLink>
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {candidateInfo?.first_name} {candidateInfo?.last_name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                  {(candidateInfo?.first_name?.[0] || "").toUpperCase()}
                  {(candidateInfo?.last_name?.[0] || "").toUpperCase() || "U"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {candidateInfo?.first_name} {candidateInfo?.last_name}
                    </h1>

                    <Badge className={getStatusBadgeClasses(applicationStage?.status)}>
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                        style={{ backgroundColor: getStatusDotColor(applicationStage?.status) }}
                      />
                      {applicationStage?.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>

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
                    {candidateInfo?.city && candidateInfo?.state && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {candidateInfo.city}, {candidateInfo.state}
                          </span>
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
                            {new Date(candidateInfo.created_at).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs px-3" onClick={handleOffer}>
                      Make Offer
                    </Button>
                  </div>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="end">
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 px-3" onClick={handleChangeStatus}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Change Status
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sm font-normal h-9 px-3" onClick={handleAddNote}>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {applicationStage?.status === "ai_recommendation_completed" && (
              <div className="md:hidden flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50 h-8 flex-1" onClick={handleReject}>
                  Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 flex-1" onClick={handleOffer}>
                  Make Offer
                </Button>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto">
            <div className="flex border-b border-gray-200 min-w-max">
              <button
                onClick={() => nextRouter.push(`/jobs/${jobId}/${applicationId}`)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                  pathname === `/jobs/${jobId}/${applicationId}` || pathname === `/jobs/${jobId}/${applicationId}/`
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
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
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
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
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
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
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
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
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-600 hover:text-gray-900 border-b-[0.5px] border-transparent hover:border-gray-300"
                )}
              >
                AI Recommendation
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">{children}</div>

        {candidateInfo && jobTitle && (
          <MakeOfferDialog
            open={isOfferDialogOpen}
            onOpenChange={setIsOfferDialogOpen}
            candidateInfo={candidateInfo}
            jobInfo={{ title: jobTitle, id: jobId }}
            jobApplicationId={applicationId}
            onOfferMade={handleOfferMade}
          />
        )}

        {candidateInfo && jobTitle && (
          <RejectCandidateDialog
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
            candidateInfo={candidateInfo}
            jobInfo={{ title: jobTitle }}
            jobApplicationId={applicationId}
            onReject={handleRejectConfirmed}
          />
        )}
      </div>
    </ApplicationContext.Provider>
  );
}
