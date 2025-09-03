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
  const [activeTab, setActiveTab] = useState("info");

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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


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
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
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
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
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
        <ErrorState />
      </div>
    );
  }

  if (!candidateInfo || !applicationStage) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
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
        <div className="text-center py-12">
          <p className="text-gray-600">Application not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Application Title and Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
              {(candidateInfo?.first_name?.[0] || '').toUpperCase()}
              {(candidateInfo?.last_name?.[0] || '').toUpperCase() || 'U'}
            </div>
            
            {/* Candidate Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {candidateInfo?.first_name} {candidateInfo?.last_name}
              </h2>
              <div className="flex items-center gap-4 text-base text-gray-600">
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
          
          {/* Status Badge and Quick Actions */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                applicationStage?.status === "demo_ready"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : applicationStage?.status === "demo_creation"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              {applicationStage?.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
            
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

      </div>

      {/* Tab Navigation */}
      <div className="w-full">
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
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
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "info" && candidateInfo && (
            <CandidateInfoComponent candidateInfo={candidateInfo} />
          )}
          {activeTab === "assessment" && applicationStage && (
            <MCQAssessment applicationStage={applicationStage} />
          )}
        </div>
      </div>
    </div>
  );
}