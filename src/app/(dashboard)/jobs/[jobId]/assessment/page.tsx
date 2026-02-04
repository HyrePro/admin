"use client";

import { ChevronDown, ChevronRight, Edit, AlertCircle, RefreshCw } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { useJob } from "../layout";

export default function JobAssessmentPage() {
  const { job } = useJob();
  const jobId = job?.id;
  
  const [isMcqExpanded, setIsMcqExpanded] = useState(true);
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);
  const [isInterviewExpanded, setIsInterviewExpanded] = useState(false);
  
  // Fetch assessment config using TanStack Query
  const {
    data: assessmentConfig,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['job-assessment-config', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');
      const response = await fetch(`/api/jobs/${jobId}/assessment-config`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assessment configuration');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!jobId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const assessmentConfigRecord = Array.isArray(assessmentConfig) ? assessmentConfig[0] : assessmentConfig;

  // Use assessment config data or fallback to job data
  const jobData = assessmentConfigRecord || job;
  
  const [numberOfQuestions, setNumberOfQuestions] = useState(15);
  const [demoDuration, setDemoDuration] = useState(2);
  const [hasUserEdits, setHasUserEdits] = useState(false);

  // Sync state from fetched config when user hasn't edited locally.
  useEffect(() => {
    if (hasUserEdits) {
      return;
    }

    const source = assessmentConfigRecord ?? job;
    if (!source) {
      return;
    }

    if (source.number_of_questions !== undefined) {
      setNumberOfQuestions(source.number_of_questions as number);
    }
    if (source.assessment_difficulty?.demoVideoDuration !== undefined) {
      setDemoDuration(source.assessment_difficulty.demoVideoDuration as number);
    } else if ((source as { demo_duration?: number }).demo_duration !== undefined) {
      setDemoDuration((source as { demo_duration?: number }).demo_duration as number);
    }
  }, [assessmentConfigRecord, job, hasUserEdits]);
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full bg-white">
        <div className="mx-auto px-6 py-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-white">
        <div className="mx-auto px-6 py-6">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load assessment configuration</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {error instanceof Error ? error.message : "Something went wrong while fetching assessment details. Please try again."}
            </p>
            <Button onClick={() => refetch()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!jobData) {
    return (
      <div className="h-full bg-white">
        <div className="mx-auto px-6 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600">No assessment configuration found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="mx-auto px-6 py-6">
        {/* Header Section */}
       

        {/* Assessment Stages */}
        <div className="space-y-4">
          {/* MCQ Assessment */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsMcqExpanded(!isMcqExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">1</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">MCQ Assessment</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Multiple-choice test evaluating subject knowledge and pedagogy
                  </p>
                </div>
              </div>
              {isMcqExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isMcqExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Number of Questions Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Number of Questions</label>
                      <span className="text-sm font-semibold text-black bg-gray-100 px-2.5 py-0.5 rounded">
                        {numberOfQuestions}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                        style={{ width: `${((numberOfQuestions - 5) / 25) * 100}%` }}
                      ></div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="5"
                        value={numberOfQuestions}
                        onChange={(e) => {
                          setNumberOfQuestions(Number(e.target.value));
                          setHasUserEdits(true);
                        }}
                        className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>30</span>
                    </div>
                  </div>

                  {/* Test Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Difficulty</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                        {jobData.assessment_difficulty?.assessment_type || 'medium'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Total Questions</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {numberOfQuestions}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {numberOfQuestions * 0.5} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo Assessment */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsDemoExpanded(!isDemoExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">2</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">Demo Assessment</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Teaching demonstration video showcasing pedagogical skills
                  </p>
                </div>
              </div>
              {isDemoExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isDemoExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="demo-enabled" 
                      checked={jobData.assessment_difficulty?.includeSubjectTest ?? true}
                    />
                    <Label htmlFor="demo-enabled" className="text-sm text-gray-700 cursor-pointer">
                      Enable demo assessment stage
                    </Label>
                  </div>

                  {/* Demo Duration Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Video Duration</label>
                      <span className="text-sm font-semibold text-black bg-gray-100 px-2.5 py-0.5 rounded">
                        {demoDuration} min
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                        style={{ width: `${((demoDuration - 2) / 8) * 100}%` }}
                      ></div>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        step="1"
                        value={demoDuration}
                        onChange={(e) => {
                          setDemoDuration(Number(e.target.value));
                          setHasUserEdits(true);
                        }}
                        className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>2 min</span>
                      <span>6 min</span>
                      <span>10 min</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Candidate Instructions</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Record a {demoDuration}-minute teaching demonstration presenting a topic of your choice. 
                      Your video should showcase clear explanation, student engagement techniques, and effective 
                      use of teaching aids. Include a brief lesson plan outline with your submission.
                    </p>
                  </div>

                  {/* Evaluation Criteria */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2.5">Evaluation Criteria</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Subject Knowledge',
                        'Language Fluency',
                        'Grammar & Structure',
                        'Eye Contact',
                        'Body Language',
                        'Confidence',
                        'Voice Modulation',
                        'Pedagogical Approach',
                        'Engagement Skills'
                      ].map((criterion) => (
                        <div key={criterion} className="bg-gray-50 rounded px-2.5 py-1.5">
                          <p className="text-xs text-gray-700">{criterion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interview Rounds */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsInterviewExpanded(!isInterviewExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">3</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">Interview Rounds</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Structured interviews covering teaching philosophy and experience
                  </p>
                </div>
              </div>
              {isInterviewExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isInterviewExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="interview-enabled" 
                      checked={jobData.assessment_difficulty?.includeInterview ?? true}
                    />
                    <Label htmlFor="interview-enabled" className="text-sm text-gray-700 cursor-pointer">
                      Enable interview rounds
                    </Label>
                  </div>

                  {/* Interview Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {jobData.assessment_difficulty?.interviewDuration || 45} minutes
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Format</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                        {jobData.assessment_difficulty?.interviewFormat || 'structured'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
