"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getVideoAssessmentByApplicationId, type VideoAssessmentData, type RubricsData } from "@/lib/supabase/api/get-video-assessment";
import { Loader2, Video, AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Play } from "lucide-react";

interface VideoAssessmentProps {
  applicationStage: ApplicationStage;
}

export function VideoAssessment({ applicationStage }: VideoAssessmentProps) {
  const [videoAssessment, setVideoAssessment] = useState<VideoAssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAssessmentCompleted = applicationStage.demo_score !== null && applicationStage.demo_score !== undefined;

  useEffect(() => {
    if (!isAssessmentCompleted) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const fetchVideoAssessmentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getVideoAssessmentByApplicationId(applicationStage.application_id);
        
        if (cancelled) return;
        
        if (result.error) {
          setError(result.error);
        } else {
          setVideoAssessment(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load video assessment data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchVideoAssessmentData();

    return () => {
      cancelled = true;
    };
  }, [applicationStage.application_id, isAssessmentCompleted]);

  if (!isAssessmentCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Video Assessment Not Completed</h3>
          <p className="text-sm text-gray-500">Candidate hasn't completed the video assessment yet.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading video assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Loading Assessment</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!videoAssessment) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No Assessment Data</h3>
          <p className="text-sm text-gray-500">Video assessment data is not available for this application.</p>
        </div>
      </div>
    );
  }

  // Parse rubrics
  let rubricsData: RubricsData | null = null;
  if (videoAssessment.rubrics) {
    try {
      rubricsData = typeof videoAssessment.rubrics === 'string' 
        ? JSON.parse(videoAssessment.rubrics) 
        : videoAssessment.rubrics;
    } catch (e) {
      console.error("Error parsing rubrics:", e);
    }
  }

  const hasContent = videoAssessment.video_url || rubricsData;

  if (!hasContent) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No Assessment Data</h3>
          <p className="text-sm text-gray-500">Video assessment data is not available for this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Overall Score - Top Priority */}
      {rubricsData && rubricsData.overall && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Assessment Score</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">
                {rubricsData.overall.summary || 'No summary available'}
              </p>
            </div>
            <div className="text-center ml-6">
              <div className="text-5xl font-bold text-blue-600">
                {rubricsData.overall.overall_score_out_of_10?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">out of 10</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Scores - Quick Overview */}
      {rubricsData && rubricsData.scores && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Performance Breakdown</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(rubricsData.scores).map(([key, value]) => {
                const score = value as number;
                const percentage = (score / 10) * 100;
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {score.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 8 ? 'bg-green-500' :
                          score >= 6 ? 'bg-blue-500' :
                          score >= 4 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {rubricsData.evidence && rubricsData.evidence[key] && (
                      <p className="text-xs text-gray-600 leading-relaxed mt-2">
                        {rubricsData.evidence[key]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Feedback */}
      {rubricsData && rubricsData.actionable_feedback && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Detailed Feedback</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {rubricsData.actionable_feedback.strengths && 
               rubricsData.actionable_feedback.strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Strengths</h4>
                  </div>
                  <div className="space-y-2">
                    {rubricsData.actionable_feedback.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <p className="text-sm text-gray-700 flex-1">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Areas for Improvement */}
              {rubricsData.actionable_feedback.areas_for_improvement && 
               rubricsData.actionable_feedback.areas_for_improvement.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Areas for Improvement</h4>
                  </div>
                  <div className="space-y-2">
                    {rubricsData.actionable_feedback.areas_for_improvement.map((area: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <p className="text-sm text-gray-700 flex-1">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Red Flags */}
              {rubricsData.actionable_feedback.red_flags && 
               rubricsData.actionable_feedback.red_flags.length > 0 && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Red Flags</h4>
                  </div>
                  <div className="space-y-2">
                    {rubricsData.actionable_feedback.red_flags.map((flag: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 bg-red-50 rounded-lg p-3 border border-red-100">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-900 flex-1 font-medium">{flag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player - For Verification */}
      {videoAssessment.video_url && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Teaching Demo Video</h3>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900 capitalize">{videoAssessment.status || 'N/A'}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(videoAssessment.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Watch to verify</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video 
                src={videoAssessment.video_url} 
                controls 
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}