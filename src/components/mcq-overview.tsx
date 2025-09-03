"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Target, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MCQOverviewProps {
  applicationStage: ApplicationStage;
}

export function MCQOverview({ applicationStage }: MCQOverviewProps) {
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

  // Check if assessment is in progress (no overall data available)
  const isAssessmentInProgress = !applicationStage.overall;

  return (
    <div className="space-y-4">
      {/* Assessment in Progress Message */}
      {isAssessmentInProgress && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Assessment in Progress</h3>
              <p className="text-sm text-amber-700">
                The candidate is currently taking the assessment. Results will be available once completed.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Performance Cards - Only show when assessment is completed */}
      {!isAssessmentInProgress && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Score Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatScore(applicationStage.overall?.score ?? 0, applicationStage.overall?.total_questions ?? 0)}
              </div>
              <p className="text-xs text-gray-500">
                Correct answers out of total
              </p>
            </CardContent>
          </Card>

          {/* Questions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applicationStage.overall?.total_questions ?? 0}
              </div>
              <p className="text-xs text-gray-500">
                Total questions in assessment
              </p>
            </CardContent>
          </Card>

          {/* Attempted Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Attempted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {applicationStage.overall?.attempted ?? 0}
              </div>
              <p className="text-xs text-gray-500">
                Questions attempted by candidate
              </p>
            </CardContent>
          </Card>

          {/* Accuracy Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applicationStage.overall?.total_questions && applicationStage.overall?.total_questions > 0
                  ? `${Math.round(((applicationStage.overall?.score ?? 0) / (applicationStage.overall?.total_questions ?? 1)) * 100)}%`
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-gray-500">
                Percentage of correct answers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Subject-wise Performance Chart */}
      {applicationStage.category_scores && Object.keys(applicationStage.category_scores).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  correctAnswers: {
                    label: "Correct Answers",
                    color: "#3b82f6"
                  },
                  incorrectAnswers: {
                    label: "Incorrect Answers", 
                    color: "#9ca3af"
                  }
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(applicationStage.category_scores).map(([category, scores]) => {
                      const accuracy = scores.total_questions > 0 ? (scores.score / scores.total_questions) : 0;
                      const incorrectAnswers = scores.total_questions - scores.score;
                      return {
                        subject: category.charAt(0).toUpperCase() + category.slice(1),
                        totalQuestions: scores.total_questions,
                        correctAnswers: scores.score,
                        incorrectAnswers: incorrectAnswers,
                        accuracy: Math.round(accuracy * 100)
                      };
                    })}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="subject" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm text-blue-600">Correct: {data.correctAnswers}</p>
                              <p className="text-sm text-gray-600">Incorrect: {data.incorrectAnswers}</p>
                              <p className="text-sm text-gray-900">Total: {data.totalQuestions}</p>
                              <p className="text-sm text-green-600">Accuracy: {data.accuracy}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {/* Blue bar for correct answers (bottom) */}
                    <Bar 
                      dataKey="correctAnswers" 
                      name="Correct Answers"
                      fill="#3b82f6"
                      stackId="performance"
                      radius={[0, 0, 0, 0]}
                    />
                    {/* Gray bar for incorrect answers (stacked on top) */}
                    <Bar 
                      dataKey="incorrectAnswers" 
                      name="Incorrect Answers"
                      fill="#9ca3af"
                      stackId="performance"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              {/* Subject Performance Summary */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(applicationStage.category_scores).map(([category, scores]) => (
                  <div key={category} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 capitalize text-sm">{category}</h4>
                      <Badge variant="outline" className="bg-white text-xs">
                        {formatScore(scores.score, scores.total_questions)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {scores.total_questions > 0 
                        ? `${Math.round((scores.score / scores.total_questions) * 100)}% accuracy`
                        : 'N/A'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <div className="text-sm text-gray-600">Click to view the candidate&apos;s video response</div>
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