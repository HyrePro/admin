"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useApplication } from "./layout";
import type { CandidateInfo } from "@/lib/supabase/api/get-job-application";

// Dynamically import the CandidateInfo component to reduce initial bundle size
const CandidateInfoComponent = dynamic(() => import("@/components/candidate-info").then(mod => mod.CandidateInfo), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-6">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

export default function ApplicationInfoPage() {
  const { candidateInfo, loading } = useApplication();

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {candidateInfo && <CandidateInfoComponent candidateInfo={candidateInfo as CandidateInfo} />}
    </div>
  );
}