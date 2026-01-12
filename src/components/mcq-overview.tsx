"use client";

import React from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { BookOpen } from "lucide-react";

interface MCQOverviewProps {
  applicationStage: ApplicationStage;
}

export function MCQOverview({ applicationStage }: MCQOverviewProps) {
  const formatScore = (score: number, totalQuestions: number) => {
    if (totalQuestions === 0) return "N/A";
    return `${score}/${totalQuestions}`;
  };

  const isAssessmentInProgress = !applicationStage.overall;

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Assessment in Progress Message */}
      {isAssessmentInProgress && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Assessment in Progress</h3>
              <p className="text-sm text-amber-700 mt-0.5">
                The candidate is currently taking the assessment. Results will be available once completed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Cards */}
      {!isAssessmentInProgress && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Overall Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatScore(applicationStage.overall?.score ?? 0, applicationStage.overall?.total_questions ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Correct answers out of total</p>
            </div>

            {/* Questions Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Questions</p>
              <p className="text-2xl font-bold text-green-600">
                {applicationStage.overall?.total_questions ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total questions in assessment</p>
            </div>

            {/* Attempted Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Attempted</p>
              <p className="text-2xl font-bold text-amber-600">
                {applicationStage.overall?.attempted ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Questions attempted by candidate</p>
            </div>

            {/* Accuracy Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">
                {applicationStage.overall?.total_questions && applicationStage.overall?.total_questions > 0
                  ? `${Math.round(((applicationStage.overall?.score ?? 0) / (applicationStage.overall?.total_questions ?? 1)) * 100)}%`
                  : 'N/A'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Percentage of correct answers</p>
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Performance Chart */}
      {applicationStage.category_scores && Object.keys(applicationStage.category_scores).length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex flex-col lg:flex-row gap-6">
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
                className="h-[300px] lg:w-2/3"
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
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
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
                    <Bar 
                      dataKey="correctAnswers" 
                      name="Correct Answers"
                      fill="#3b82f6"
                      stackId="performance"
                      radius={[0, 0, 0, 0]}
                    />
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
              <div className="lg:w-1/3">
                <div className="space-y-3">
                  {Object.entries(applicationStage.category_scores).map(([category, scores]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">{category}</h4>
                        <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                          {formatScore(scores.score, scores.total_questions)}
                        </span>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}