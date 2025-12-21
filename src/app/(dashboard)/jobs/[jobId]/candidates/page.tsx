"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useJob } from "@/app/(dashboard)/jobs/[jobId]/layout";

// Dynamically import heavy components to reduce initial bundle size
const JobCandidates = dynamic(() => import("@/components/job-candidates").then(mod => mod.JobCandidates), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

interface JobCandidatesPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default function JobCandidatesPage({ params }: JobCandidatesPageProps) {
  const { job } = useJob();
  const { jobId } = React.use(params);
  
  return (
    <div className="h-full">
      {jobId && <JobCandidates job_id={jobId} />}
    </div>
  );
}