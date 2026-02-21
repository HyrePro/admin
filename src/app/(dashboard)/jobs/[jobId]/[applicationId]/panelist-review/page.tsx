"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useApplication } from "@/components/application-layout-client";
import { useWarmRoute } from "@/hooks/use-warm-route";

// Dynamically import the PanelistReview component to reduce initial bundle size
const PanelistReviewComponent = dynamic(() => import("@/components/panelist-review").then(mod => mod.PanelistReview), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
});

export default function PanelistReviewPage() {
  const { applicationId, loading } = useApplication();
  useWarmRoute("warm_app_panelist", !loading, 60);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PanelistReviewComponent jobApplicationId={applicationId} />
    </div>
  );
}
