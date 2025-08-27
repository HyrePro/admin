"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText } from "lucide-react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";

interface MCQAssessmentProps {
  applicationStage: ApplicationStage;
}

export function MCQAssessment({ applicationStage }: MCQAssessmentProps) {
  const formatScore = (score: number, totalQuestions: number) => {
    if (totalQuestions === 0) return "N/A";
    return `${score}/${totalQuestions}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Status and Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Current Status</div>
              <Badge
                variant="outline"
                className={
                  applicationStage.status === "demo_ready"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : applicationStage.status === "demo_creation"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {applicationStage.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-600">Submitted</div>
                <div className="text-sm text-gray-900">{formatDate(applicationStage.submitted_at)}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            {applicationStage.created_at && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(applicationStage.created_at)}</span>
              </div>
            )}
            {applicationStage.updated_at && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">{formatDate(applicationStage.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Overall Assessment Score */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Score</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatScore(applicationStage.overall.score || 0, applicationStage.overall.total_questions || 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-xl font-semibold text-gray-900">
                {applicationStage.overall.total_questions && applicationStage.overall.total_questions > 0
                  ? `${Math.round((applicationStage.overall.score / applicationStage.overall.total_questions) * 100)}%`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Attempted</div>
              <div className="text-lg font-semibold text-gray-900">{applicationStage.overall.attempted || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Questions</div>
              <div className="text-lg font-semibold text-gray-900">{applicationStage.overall.total_questions || 0}</div>
            </div>
          </div>
          
          {applicationStage.overall.total_questions && applicationStage.overall.total_questions > 0 && (
            <div className="w-full bg-white rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(applicationStage.overall.score / applicationStage.overall.total_questions) * 100}%` 
                }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Category-wise Performance */}
      {applicationStage.category_scores && Object.keys(applicationStage.category_scores).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(applicationStage.category_scores).map(([category, scores]) => (
              <div key={category} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
                  <Badge variant="outline" className="bg-gray-50">
                    {formatScore(scores.score, scores.total_questions)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attempted:</span>
                    <span className="font-medium">{scores.attempted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-medium">
                      {scores.total_questions > 0 
                        ? `${Math.round((scores.score / scores.total_questions) * 100)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                
                {scores.total_questions > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(scores.score / scores.total_questions) * 100}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Assessment */}
      {applicationStage.video_url && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Assessment</h3>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Demo Video Submission</div>
                <div className="text-sm text-gray-600">Click to view the candidate's video response</div>
              </div>
              <a 
                href={applicationStage.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Video
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}