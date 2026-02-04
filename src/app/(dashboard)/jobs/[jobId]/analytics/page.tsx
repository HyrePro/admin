"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useJob } from "@/app/(dashboard)/jobs/[jobId]/layout";

// Dynamically import heavy components to reduce initial bundle size
const JobOverviewAnalytics = dynamic(() => import("@/components/job-overview-analytics").then(mod => mod.JobOverviewAnalytics), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
});

interface JobAnalyticsPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default function JobAnalyticsPage({ params }: JobAnalyticsPageProps) {
  const { job } = useJob();
  const { jobId } = React.use(params);
  
  return (
    <div className="p-4 h-full">
      <div className="h-full border rounded-lg bg-white overflow-hidden">
        {jobId && <JobOverviewAnalytics jobId={jobId} />}
      </div>
    </div>
  );
}
