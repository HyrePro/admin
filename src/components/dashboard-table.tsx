"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Copy, Edit, Eye, Check } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/api/client";

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  application_analytics: {
    total_applications: number;
  };
}

interface DashboardTableProps {
  schoolId: string;
}

export function DashboardTable({ schoolId }: DashboardTableProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const pageSize = 10;

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPEALED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const fetchJobs = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Calculate start and end indexes for pagination
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;

      // Fetch jobs with pagination
      const { data, error } = await supabase.rpc("get_jobs_with_analytics", {
        p_school_id: schoolId,
        p_start_index: startIndex,
        p_end_index: endIndex,
        p_status: "ALL",
      });

      if (error) throw error;

      setJobs(data || []);

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId);

      if (countError) throw countError;

      setTotalJobs(count || 0);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchJobs(currentPage);
    }
  }, [schoolId, currentPage]);

  const handleViewJob = (jobId: string) => {
    const jobLink = `https://www.hyriki.com/apply/${jobId}`;
    window.open(jobLink, '_blank');
  };

  const handleEditJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleCopyLink = async (jobId: string) => {
    const jobLink = `https://www.hyriki.com/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(jobLink);
      setCopiedJobId(jobId);
      toast.success("Job Link copied to clipboard");
      setTimeout(() => setCopiedJobId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy job link");
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const maxPage = Math.ceil(totalJobs / pageSize) - 1;
      return Math.min(maxPage, prev + 1);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="rounded-md border flex-grow flex flex-col">
          <Table className="flex-grow">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-2/7">Job Title</TableHead>
                <TableHead className="w-1/7">Applications</TableHead>
                <TableHead className="w-1/7">Status</TableHead>
                <TableHead className="w-1/7">Created</TableHead>
                <TableHead className="w-2/7 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="flex-grow">
              {[...Array(3)].map((_, i) => (
                <TableRow key={i} className="border-b">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between pt-4">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="rounded-md border p-8 text-center flex-grow flex items-center justify-center">
          <div>
            <div className="text-red-500 mb-2">Error loading jobs</div>
            <Button onClick={() => fetchJobs(currentPage)}>Retry</Button>
          </div>
        </div>
        
        {/* Empty pagination space */}
        <div className="pt-4"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="rounded-md border p-8 text-center flex-grow flex items-center justify-center">
          <div className="text-gray-500">No jobs found</div>
        </div>
        
        {/* Empty pagination space */}
        <div className="pt-4"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="rounded-md border flex-grow flex flex-col overflow-hidden">
        <Table className="flex-grow">
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-2/7 font-normal">Job Title</TableHead>
              <TableHead className="w-1.5/7 font-normal">Applications</TableHead>
              <TableHead className="w-1/7 font-normal">Status</TableHead>
              <TableHead className="w-1/7 font-normal">Created</TableHead>
              <TableHead className="w-1.5/7 font-normal">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto flex-grow">
            {jobs.map((job) => (
              <TableRow key={job.id} className="border-b">
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.application_analytics.total_applications || 0}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize font-medium",
                      statusColors[job.status] || "bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    {job.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(job.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(job.id)}
                    >
                     
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewJob(job.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditJob(job.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalJobs)} of {totalJobs} jobs
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={(currentPage + 1) * pageSize >= totalJobs}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
