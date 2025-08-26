"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import { ArrowLeft, Briefcase, Users, AlertCircle, RefreshCw, Share, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/api/client";

interface JobDetailsPageProps {
  params: {
    jobId: string;
  };
}

type Job = {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
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
  const { jobId } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleGoBack = () => {
    router.back();
  };

  const handleStatusChange = async (newStatus: string) => {
    setSelectedStatus(newStatus);
    // TODO: Implement status update API call
    console.log("Status changed to:", newStatus);
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
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
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
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
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
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
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
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

      {/* Job Details - Plain Layout */}
      <div className="space-y-6">
        {/* Job Title and Badges */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              {job.title}
            </h2>
            
            {/* Status, Grades and Subjects Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Status Badge */}
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize font-medium text-sm px-3 py-1",
                  statusColors[job.status as keyof typeof statusColors] || "bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {job.status === "ALL" ? "All" : job.status.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              
              {/* Grade Levels as Badges */}
              {job.grade_levels?.length > 0 && (
                job.grade_levels.map((grade) => (
                  <Badge key={grade} variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors text-sm px-3 py-1">
                    {grade}
                  </Badge>
                ))
              )}
              
              {/* Subject Badges */}
              {job.subjects?.length > 0 && (
                job.subjects.map((subj) => (
                  <Badge key={subj} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors text-sm px-3 py-1">
                    {subj}
                  </Badge>
                ))
              )}
            </div>
          </div>
          
          {/* Status Dropdown and Share Button */}
          <div className="flex items-center gap-3 mt-2">
            {/* Status Dropdown */}
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] h-10 bg-white shadow-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                {["OPEN", "IN_PROGRESS", "COMPLETED", "SUSPENDED", "PAUSED", "APPEALED"].map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status === "ALL" ? "All" : status.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Share Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Share this job</h4>
                    <p className="text-sm text-gray-600">Copy the link below to share this job with others</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 border">
                      <code className="text-sm font-mono text-gray-800 break-all">
                        {typeof window !== 'undefined' ? window.location.href : ''}
                      </code>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Custom Tab Navigation */}
        <div className="w-full">
          {/* Tab Buttons */}
          <div className="flex border-b border-gray-200">
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

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Job ID */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Job ID:</span>
                  </div>
                  <code className="text-sm font-mono text-gray-900 bg-white px-3 py-2 rounded border block break-all">
                    {job.id}
                  </code>
                </div>

                {/* Applications Analytics */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-700">Application Analytics</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {job.application_analytics.total_applications || 0}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <TooltipProvider>
                    <div className="space-y-3">
                      <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-200">
                        {STAGES.map(({ key, label, color }) => {
                          const value = job.application_analytics[key as keyof typeof job.application_analytics] || 0;
                          const width = total > 0 ? (value / total) * 100 : 0;
                          const displayWidth = value > 0 ? width : 0;
                          return (
                            <Tooltip key={key}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(color, "h-full transition-all duration-300", value === 0 && "opacity-30")}
                                  style={{ width: `${Math.max(displayWidth, value === 0 && total > 0 ? 2 : 0)}%` }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-medium">{label}: {value}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                      
                      {/* Stage Summary - Grid Layout */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white rounded-lg p-3 text-center border">
                          <div className="font-semibold text-gray-900">{job.application_analytics.assessment || 0}</div>
                          <div className="text-gray-600">Assessment</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border">
                          <div className="font-semibold text-gray-900">{job.application_analytics.demo || 0}</div>
                          <div className="text-gray-600">Demo</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border">
                          <div className="font-semibold text-gray-900">{job.application_analytics.interviews || 0}</div>
                          <div className="text-gray-600">Interviews</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border">
                          <div className="font-semibold text-gray-900">{job.application_analytics.offered || 0}</div>
                          <div className="text-gray-600">Offered</div>
                        </div>
                      </div>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {activeTab === "candidates" && (
              <div>
                {/* Candidates Content */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Candidate Management</h3>
                  <p className="text-gray-600 mb-4">
                    Detailed candidate tracking, application reviews, and interview scheduling will be available here
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-2xl font-bold text-blue-600">{job.application_analytics.total_applications || 0}</div>
                      <div className="text-sm text-gray-600">Total Applications</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-2xl font-bold text-green-600">{job.application_analytics.interviews || 0}</div>
                      <div className="text-sm text-gray-600">Interviews Scheduled</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-2xl font-bold text-purple-600">{job.application_analytics.offered || 0}</div>
                      <div className="text-sm text-gray-600">Offers Extended</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                {/* Analytics Content */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="h-6 w-6 bg-blue-600 rounded"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Detailed analytics, conversion rates, and performance metrics will be displayed here
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-xl font-bold text-blue-600">{job.application_analytics.assessment || 0}</div>
                      <div className="text-sm text-gray-600">Assessment Stage</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-xl font-bold text-yellow-600">{job.application_analytics.demo || 0}</div>
                      <div className="text-sm text-gray-600">Demo Stage</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-xl font-bold text-purple-600">{job.application_analytics.interviews || 0}</div>
                      <div className="text-sm text-gray-600">Interview Stage</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-xl font-bold text-green-600">{job.application_analytics.offered || 0}</div>
                      <div className="text-sm text-gray-600">Offers Made</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}