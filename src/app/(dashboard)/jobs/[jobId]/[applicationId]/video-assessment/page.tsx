"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useApplication } from "@/components/application-layout-client";
import { useWarmRoute } from "@/hooks/use-warm-route";

// Dynamically import the VideoAssessment component to reduce initial bundle size
const VideoAssessmentComponent = dynamic(() => import("@/components/video-assessment").then(mod => mod.VideoAssessment), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
});

export default function VideoAssessmentPage() {
  const { applicationStage, loading } = useApplication();
  useWarmRoute("warm_app_video", !loading, 60);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {applicationStage && <VideoAssessmentComponent applicationStage={applicationStage} />}
    </div>
  );
}
