"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { JobsTable } from "@/components/jobs-table";
import '@/styles/jobs.css'

type Job = {
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
};

export default function JobsPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (signal?: AbortSignal) => {
    if (!user || !session) {
      setError("Please log in to view jobs");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        status: "ALL",
        startIndex: '0',
        endIndex: '20'
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if we have an access token
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/jobs?${queryParams}`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for server-side auth
        signal, // Add abort signal for cancellation
      });

      // Check if request was aborted
      if (signal?.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch jobs');
      }

      const data = await response.json();

      // Only update state if component is still mounted (signal not aborted)
      if (!signal?.aborted) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      // Don't update state if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      console.error("Error fetching jobs:", err);
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      // Only update loading state if component is still mounted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    if (!authLoading && user && session) {
      fetchJobs(abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [user, session, authLoading]);

  return (
    <div className="p-4 space-y-6 ">
      <div className="jobs-header">
        <h1 className="jobs-title">Jobs</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/jobs/create-job-post')}
          className='btn-create'
        >
          <Plus className="btn-icon" />
          Create New Job Post
        </Button>
      </div>
      
      {/* Jobs Table */}
      <JobsTable 
        jobs={jobs} 
        loading={loading} 
        onRefresh={fetchJobs} 
      />
    </div>
  );
}
