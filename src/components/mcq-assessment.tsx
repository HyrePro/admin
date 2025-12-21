"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import sub-components to reduce initial bundle size
const MCQOverview = dynamic(() => import("@/components/mcq-overview").then(mod => mod.MCQOverview), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
});

const MCQQuestions = dynamic(() => import("@/components/mcq-questions").then(mod => mod.MCQQuestions), {
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

const MCQIncidents = dynamic(() => import("@/components/mcq-incidents").then(mod => mod.MCQIncidents), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4 mb-6"></div>
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

interface MCQAssessmentProps {
  applicationStage: ApplicationStage;
}

export function MCQAssessment({ applicationStage }: MCQAssessmentProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "incidents">("overview");

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex gap-2 px-4 pt-4 flex-shrink-0 ">
        <Badge
          variant={activeTab === "overview" ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "overview"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Badge>
        <Badge
          variant={activeTab === "questions" ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "questions"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
          onClick={() => setActiveTab("questions")}
        >
          Questions
        </Badge>
        <Badge
          variant={activeTab === "incidents" ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "incidents"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
          onClick={() => setActiveTab("incidents")}
        >
          Incidents
        </Badge>
      </div>

      {/* Tab Content - Scrollable Area */}
      <div className="flex-grow overflow-y-auto min-h-0 pb-4">
        {activeTab === "overview" && (
          <MCQOverview applicationStage={applicationStage} />
        )}
        
        {activeTab === "questions" && (
          <MCQQuestions applicationStage={applicationStage} />
        )}
        
        {activeTab === "incidents" && (
          <MCQIncidents applicationStage={applicationStage} />
        )}
      </div>
    </div>
  );
}