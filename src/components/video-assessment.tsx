"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getVideoAssessmentByApplicationId, type VideoAssessmentData, type RubricsData } from "@/lib/supabase/api/get-video-assessment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Video, FileText, AlertCircle } from "lucide-react";

interface VideoAssessmentProps {
  applicationStage: ApplicationStage;
}

export function VideoAssessment({ applicationStage }: VideoAssessmentProps) {
  const [videoAssessment, setVideoAssessment] = useState<VideoAssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if candidate has completed the video assessment
  const isAssessmentCompleted = applicationStage.demo_score !== null && applicationStage.demo_score !== undefined;

  useEffect(() => {
    // Early return if assessment is not completed
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
      <div className="text-center py-12">
        <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Video Assessment Not Completed</h3>
        <p className="text-gray-500">Candidate hasn&apos;t completed the video assessment.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Loading video assessment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading video assessment: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!videoAssessment) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Video Assessment Data</h3>
        <p className="text-gray-500">Video assessment has not been completed or is not available for this application.</p>
      </div>
    );
  }

  // Parse rubrics if it's a JSON string
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

  // Check if we have any content to display
  const hasContent = videoAssessment.video_url || rubricsData;

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Video Assessment Data</h3>
        <p className="text-gray-500">Video assessment has not been completed or is not available for this application.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Two-column layout when we have video or rubrics data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Section - only show if we have a video URL */}
          {videoAssessment.video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Teaching Demo Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <video 
                      src={videoAssessment.video_url} 
                      controls 
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Status: {videoAssessment.status || 'N/A'}
                    </Badge>
                    {videoAssessment.score !== null && (
                      <Badge variant="outline">
                        Score: {videoAssessment.score}/10
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Submitted: {new Date(videoAssessment.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actionable Feedback */}
          {rubricsData && rubricsData.actionable_feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rubricsData.actionable_feedback.strengths && 
                   rubricsData.actionable_feedback.strengths.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {rubricsData.actionable_feedback.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-sm text-green-600">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {rubricsData.actionable_feedback.areas_for_improvement && 
                   rubricsData.actionable_feedback.areas_for_improvement.length > 0 && (
                    <div>
                      <h5 className="font-medium text-amber-700 mb-2">Areas for Improvement</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {rubricsData.actionable_feedback.areas_for_improvement.map((area: string, index: number) => (
                          <li key={index} className="text-sm text-amber-600">{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {rubricsData.actionable_feedback.red_flags && 
                   rubricsData.actionable_feedback.red_flags.length > 0 && (
                    <div className="md:col-span-2">
                      <h5 className="font-medium text-red-700 mb-2">Red Flags</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {rubricsData.actionable_feedback.red_flags.map((flag: string, index: number) => (
                          <li key={index} className="text-sm text-red-600">{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Section - 1/3 width */}
        <div className="space-y-6">
          {/* Overall Score */}
          {rubricsData && rubricsData.overall && (
            <Card>
              <CardHeader>
                <CardTitle className="font-medium text-gray-900">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Badge className="text-lg bg-blue-600 mb-2">
                    {rubricsData.overall.overall_score_out_of_10?.toFixed(1) || 'N/A'}/10
                  </Badge>
                  <p className="text-blue-800 text-sm mt-2">
                    {rubricsData.overall.summary || 'No summary available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scores by Category */}
          {rubricsData && rubricsData.scores && (
            <Card>
              <CardHeader>
                <CardTitle className="font-medium text-gray-900">Category Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(rubricsData.scores).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="secondary">{(value as number).toFixed(1)}/10</Badge>
                      </div>
                      {rubricsData.evidence && rubricsData.evidence[key] && (
                        <p className="text-xs text-gray-600 mt-2">
                          {rubricsData.evidence[key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}