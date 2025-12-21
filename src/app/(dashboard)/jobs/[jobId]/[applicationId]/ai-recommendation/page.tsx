"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useApplication } from "../layout";

// Dynamically import the AIRecommendation component to reduce initial bundle size
const AIRecommendationComponent = dynamic(() => import("@/components/ai-recommendation").then(mod => mod.AIRecommendation), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="h-56 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
});

export default function AIRecommendationPage() {
  const { applicationId, loading } = useApplication();

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-56 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <AIRecommendationComponent jobApplicationId={applicationId} />
    </div>
  );
}