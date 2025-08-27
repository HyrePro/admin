"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronRight, Users, RefreshCw, AlertCircle } from "lucide-react";
import { getJobApplications, type JobApplication } from "@/lib/supabase/api/get-job-applications";

interface JobCandidatesProps {
  job_id: string;
}

export function JobCandidates({ job_id }: JobCandidatesProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const fetchApplications = async (search: string = "", page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      
      const { data, error } = await getJobApplications(
        job_id,
        startIndex,
        endIndex,
        search
      );

      if (error) {
        throw new Error(error);
      }

      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch applications when debounced search text or page changes
  useEffect(() => {
    fetchApplications(debouncedSearchText, currentPage);
  }, [job_id, debouncedSearchText, currentPage]);

  // Reset to first page when search text changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [debouncedSearchText]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const formatScore = (score: number, totalQuestions: number) => {
    if (totalQuestions === 0) return "N/A";
    return `${score}/${totalQuestions}`;
  };

  // Error Component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load candidates</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {error || "Something went wrong while fetching candidates. Please try again."}
      </p>
      <Button onClick={() => fetchApplications(debouncedSearchText, currentPage)} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-50 rounded-full p-4 mb-4">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {debouncedSearchText
          ? `No candidates match your search for "${debouncedSearchText}". Try adjusting your search terms.`
          : "No applications have been submitted for this job yet. Check back later as candidates apply."}
      </p>
      {debouncedSearchText && (
        <Button
          variant="outline"
          onClick={() => {
            setSearchText("");
          }}
        >
          Clear Search
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name, email, or qualifications..."
            value={searchText}
            onChange={handleSearchInputChange}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Error State */}
      {error && !loading && <ErrorState />}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Candidates Table */}
          {applications.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Candidate</TableHead>
                      <TableHead className="w-1/4">Subjects</TableHead>
                      <TableHead className="w-1/6">Score</TableHead>
                      <TableHead className="w-1/6">Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.application_id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {application.first_name} {application.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {application.city}, {application.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {application.subjects.map((subject) => (
                              <Badge
                                key={subject}
                                variant="secondary"
                                className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                              >
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatScore(application.overall.score, application.overall.total_questions)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.overall.attempted} attempted
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              application.status === "demo_ready"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : application.status === "demo_creation"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {application.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              router.push(`/jobs/${job_id}/${application.application_id}`);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, applications.length)} of {applications.length} candidates
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={applications.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}