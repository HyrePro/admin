"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useApplication } from "../layout";

// Dynamically import the MCQAssessment component to reduce initial bundle size
const MCQAssessmentComponent = dynamic(() => import("@/components/mcq-assessment").then(mod => mod.MCQAssessment), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

export default function AssessmentPage() {
  const { applicationStage, loading } = useApplication();

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {applicationStage && <MCQAssessmentComponent applicationStage={applicationStage} />}
    </div>
  );
}