"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Eye, Copy, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import '@/styles/jobs.css';

interface Job {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
  created_at: string;
  application_analytics: {
    total_applications: number;
    assessment: number;
    demo: number;
    interviews: number;
    offered: number;
  };
  hiring:{
    first_name: string;
    last_name: string;
    avatar: string;
  };
}

interface JobsTableProps {
  jobs: Job[];
  loading?: boolean;
  onRefresh?: () => void;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
];

export function JobsTable({ jobs, loading = false, onRefresh }: JobsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-50 text-green-700 border-green-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPEALED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.grade_levels?.some(grade => grade.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  // Paginate filtered jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredJobs.slice(startIndex, startIndex + pageSize);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredJobs.length);

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleCopyLink = async (jobId: string) => {
    const jobLink = `https://www.hyrepro.in/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(jobLink);
      toast.success("Job link copied to clipboard");
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy job link");
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              disabled
            />
          </div>
          <Select disabled>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="table-container">
          <div className="table-scroll">
            <Table>
              <TableHeader className="table-header">
                <TableRow>
                  <TableHead className="table-head table-head-border">Job Title</TableHead>
                  <TableHead className="table-head table-head-border">Applications</TableHead>
                  <TableHead className="table-head table-head-border">Status</TableHead>
                  <TableHead className="table-head table-head-border">Created</TableHead>
                  <TableHead className="table-head table-head-border">Grade Levels</TableHead>
                  <TableHead className="table-head table-head-border">Hiring Manager</TableHead>
                  <TableHead className="table-head table-head-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="table-body">
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-border">
                      <div className="cell-content">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                    <TableCell className="table-cell-actions">
                      <div className="cell-content">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Skeleton - Always shown at bottom */}
        <div className="pagination-container">
          <div className="pagination-info">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="pagination-controls">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title or grade level..."
            value={searchQuery ?? ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-grow sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Container - Using the same structure as candidates page */}
      <div className="table-container">
        <div className="table-scroll">
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead className="table-head table-head-border">Job Title</TableHead>
                <TableHead className="table-head table-head-border">Applications</TableHead>
                <TableHead className="table-head table-head-border">Status</TableHead>
                <TableHead className="table-head table-head-border">Created</TableHead>
                <TableHead className="table-head table-head-border">Grade Levels</TableHead>
                <TableHead className="table-head table-head-border">Hiring Manager</TableHead>
                <TableHead className="table-head table-head-actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="table-body">
              {paginatedJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No jobs found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedJobs.map((job) => {
                  return (
                    <TableRow key={job.id} className="table-row-hover">
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          <div className="flex flex-col">
                            <span>{job.title}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          <div className="font-medium">{job.application_analytics.total_applications || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          <Badge
                            className={cn(
                              "capitalize font-medium",
                              statusColors[job.status] || "bg-gray-50 text-gray-700 border-gray-200"
                            )}
                          >
                            {job.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          {new Date(job.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          <div className="flex flex-wrap gap-1">
                            {job.grade_levels?.slice(0, 2).map((grade) => (
                              <Badge key={grade} variant="secondary" className="text-xs">
                                {grade}
                              </Badge>
                            ))}
                            {job.grade_levels && job.grade_levels.length > 2 && (
                              <div className="w-full flex flex-wrap gap-1 mt-1">
                                {job.grade_levels.slice(2).map((grade) => (
                                  <Badge key={grade} variant="secondary" className="text-xs">
                                    {grade}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-border">
                        <div className="cell-content">
                          {(job.hiring && job.hiring.first_name && job.hiring.last_name)  ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={job.hiring.avatar || ''} alt="Hiring Manager" />
                                <AvatarFallback>{job.hiring.first_name[0]} {job.hiring.last_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{job.hiring.first_name} {job.hiring.last_name}</span>
                            </div>
                          ): <div>-</div>}
                        </div>
                      </TableCell>
                      <TableCell className="table-cell-actions">
                        <div className="cell-content">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(job.id)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy job link</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewJob(job.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View job details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - Always shown at bottom to maintain consistent layout */}
      <div className="pagination-container" style={{ zIndex: 20, marginTop:8 }}>
        <div className="pagination-info">
          Showing <span className="pagination-value">{startIndex + 1}</span> to{' '}
          <span className="pagination-value">{endIndex || 0}</span> of{' '}
          <span className="pagination-value">{filteredJobs.length}</span> jobs
        </div>
        <div className="pagination-controls">
          <span className="pagination-page">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="pagination-btn"
          >
            <ChevronLeft className="btn-icon" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= (totalPages - 1 || 0)}
            className="pagination-btn"
          >
            Next
            <ChevronRight className="btn-icon" />
          </Button>
        </div>
      </div>
    </div>
  );
}