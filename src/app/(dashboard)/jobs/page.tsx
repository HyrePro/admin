"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search, RefreshCw, FileX, AlertCircle, Users } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/api/client";

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

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJobClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc("get_jobs_with_analytics", {
        p_school_id: '2317e986-3ebe-415e-b402-849d80f714a0', // replace with real school_id
        p_start_index: 0,
        p_end_index: 20,
        p_status: status,
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch jobs");
      } else {
        setJobs(data || []);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [status]);

  // Filter jobs locally by title, subjects, or grades
  const filteredJobs = jobs.filter((job) => {
    const query = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.status.toLowerCase().includes(query) ||
      job.grade_levels?.some((g) => g.toLowerCase().includes(query)) ||
      job.subjects?.some((s) => s.toLowerCase().includes(query))
    );
  });

  // Error Component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load jobs</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching jobs. Please try again."}
      </p>
      <Button onClick={fetchJobs} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  // No Results Component
  const NoResultsState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <FileX className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {search ? "No jobs match your search" : "No jobs found"}
      </h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {search 
          ? `We couldn't find any jobs matching "${search}". Try adjusting your search terms or filters.`
          : "There are no jobs available at the moment. Check back later or create a new job posting."
        }
      </p>
      {search && (
        <Button 
          variant="outline" 
          onClick={() => setSearch("")} 
          className="flex items-center gap-2"
        >
          Clear Search
        </Button>
      )}
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Job Management</h1>
        <p className="text-gray-600">Manage and monitor your job postings and applications</p>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar - Takes remaining flex space */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs by title, subject, or grade level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white shadow-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* Status Filter */}
        <Select value={status} onValueChange={(val) => setStatus(val)}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white shadow-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "SUSPENDED", "PAUSED", "APPEALED"].map((opt) => (
              <SelectItem key={opt} value={opt} className="capitalize">
                {opt === "ALL" ? "All" : opt.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
          {search && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Search: "{search}"
            </Badge>
          )}
          {status !== "ALL" && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Status: {status === "ALL" ? "All" : status.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {loading && <LoadingSkeleton />}
      {error && <ErrorState />}
      {!loading && !error && filteredJobs.length === 0 && <NoResultsState />}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
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
              <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-3">
                        {job.title}
                      </CardTitle>
                      
                      {/* Status, Grades and Subjects Badges */}
                      <div className="flex flex-wrap gap-2">
                        {/* Status Badge */}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "capitalize font-medium",
                            statusColors[job.status as keyof typeof statusColors] || "bg-gray-50 text-gray-700 border-gray-200"
                          )}
                        >
                          {job.status === "ALL" ? "All" : job.status.toLowerCase().replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        
                        {/* Grade Levels as Badges */}
                        {job.grade_levels?.length > 0 && (
                          job.grade_levels.slice(0, 2).map((grade) => (
                            <Badge key={grade} variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors">
                              {grade}
                            </Badge>
                          ))
                        )}
                        {job.grade_levels?.length > 2 && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                            +{job.grade_levels.length - 2} grades
                          </Badge>
                        )}
                        
                        {/* Subject Badges */}
                        {job.subjects?.length > 0 && (
                          job.subjects.slice(0, 2).map((subj) => (
                            <Badge key={subj} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors">
                              {subj}
                            </Badge>
                          ))
                        )}
                        {job.subjects?.length > 2 && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            +{job.subjects.length - 2} subjects
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleJobClick(job.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="py-0 my-0">

                  {/* Applications Summary */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Applications</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {job.application_analytics.total_applications || 0}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <TooltipProvider>
                      <div className="space-y-2">
                        <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-200">
                          {STAGES.map(({ key, label, color }) => {
                            const value = job.application_analytics[key as keyof typeof job.application_analytics] || 0;
                            const width = total > 0 ? (value / total) * 100 : 0;
                            // Always show all stages, even if value is 0 (but with minimal width for visibility)
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
                        
                        {/* Stage Summary */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Assessment: {job.application_analytics.assessment || 0}</span>
                          <span>Demo: {job.application_analytics.demo || 0}</span>
                          <span>Interviews: {job.application_analytics.interviews || 0}</span>
                          <span>Offered: {job.application_analytics.offered || 0}</span>
                        </div>
                      </div>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
