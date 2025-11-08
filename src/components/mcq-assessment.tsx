"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { cn } from "@/lib/utils";
import { MCQOverview } from "@/components/mcq-overview";
import { MCQQuestions } from "@/components/mcq-questions";
import { MCQIncidents } from "@/components/mcq-incidents";

interface MCQAssessmentProps {
  applicationStage: ApplicationStage;
}

export function MCQAssessment({ applicationStage }: MCQAssessmentProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "incidents">("overview");

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex gap-2 px-4 pt-4 flex-shrink-0">
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
      <div className="flex-grow overflow-y-auto min-h-0 px-4 pb-4">
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