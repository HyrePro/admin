"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useJob } from "@/app/(dashboard)/jobs/[jobId]/layout";

// Dynamically import heavy components to reduce initial bundle size
const JobOverview = dynamic(() => import("@/components/job-overview").then(mod => mod.JobOverview), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

export default function JobDetailsPage() {
  const { job } = useJob();
  
  return (
    <div className="h-full">
      {job && <JobOverview job={job} />}
    </div>
  );
}