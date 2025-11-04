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
import { Search, ChevronLeft, ChevronRight, Eye, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface JobsTableProps {
  jobs: Job[];
  loading?: boolean;
  onRefresh?: () => void;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PAUSED", label: "Paused" },
  { value: "APPEALED", label: "Appealed" },
];

export function JobsTable({ jobs, loading = false, onRefresh }: JobsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
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

        <div className="rounded-md border flex-grow flex flex-col overflow-hidden">
          <Table className="flex-grow">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Job Title</TableHead>
                <TableHead className="w-1/12 border-l border-border">Applications</TableHead>
                <TableHead className="w-1/12 border-l border-border">Status</TableHead>
                <TableHead className="w-1/12 border-l border-border">Created</TableHead>
                <TableHead className="w-1/4 border-l border-border">Grade Levels</TableHead>
                <TableHead className="w-1/6 border-l border-border">Hiring Manager</TableHead>
                <TableHead className="w-1/12 border-l border-border text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto flex-grow">
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="border-l border-border text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Skeleton - Always shown at bottom */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center space-x-2">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      {/* Results Summary */}
      

      {/* Jobs Table - Takes remaining space */}
      <div className="rounded-md border flex-1 flex-col overflow-y-auto flex-grow">
        {/* <Table >
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Job Title</TableHead>
              <TableHead className="w-1/12 border-l border-border">Applications</TableHead>
              <TableHead className="w-1/12 border-l border-border">Status</TableHead>
              <TableHead className="w-1/12 border-l border-border">Created</TableHead>
              <TableHead className="w-1/4 border-l border-border">Grade Levels</TableHead>
              <TableHead className="w-1/6 border-l border-border">Hiring Manager</TableHead>
              <TableHead className="w-1/12 border-l border-border text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto">
            {paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No jobs found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              paginatedJobs.map((job) => {
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{job.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="border-l border-border">
                      <div className="font-medium">{job.application_analytics.total_applications || 0}</div>
                    </TableCell>
                    <TableCell className="border-l border-border">
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
                    <TableCell className="border-l border-border">
                      {new Date(job.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="border-l border-border">
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
                    </TableCell>
                    <TableCell className="border-l border-border">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${job.id}`} alt="Hiring Manager" />
                          <AvatarFallback>HM</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">John Doe</span>
                      </div>
                    </TableCell>
                    <TableCell className="border-l border-border text-right">
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table> */}
      </div>

      {/* Pagination - Always shown at bottom */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{filteredJobs.length}</span> jobs
          
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
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
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}