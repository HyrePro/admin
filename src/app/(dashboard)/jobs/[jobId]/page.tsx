"use client";

import dynamic from "next/dynamic";
import { useJob } from "@/app/(dashboard)/jobs/[jobId]/layout";

// Dynamically import heavy components to reduce initial bundle size
const JobOverview = dynamic(() => import("@/components/job-overview").then(mod => mod.JobOverview), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-white">
      <div className="mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content - Left Side Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side Skeleton */}
          <div className="min-w-72 flex-shrink-0 h-fit border-l border-gray-200 pl-6">
            <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
            
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-3 flex-1 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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