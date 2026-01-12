"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getMCQDetailsByApplicationId, type MCQQuestion } from "@/lib/supabase/api/get-mcq-details";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface MCQQuestionsProps {
  applicationStage: ApplicationStage;
}

export function MCQQuestions({ applicationStage }: MCQQuestionsProps) {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchMCQDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const { questions: mcqQuestions, error: mcqError } = await getMCQDetailsByApplicationId(
          applicationStage.application_id
        );
        if (!active) return;
        if (mcqError) {
          setError(mcqError);
          setQuestions([]);
        } else {
          setQuestions(mcqQuestions ?? []);
          setError(null);
        }
      } catch {
        if (!active) return;
        setError("Failed to fetch assessment details");
        setQuestions([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMCQDetails();
    return () => {
      active = false;
    };
  }, [applicationStage.application_id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-6 py-12">
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

  if (questions.length === 0) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Questions Found</h3>
          <p className="text-sm text-gray-500">No assessment questions found for this application.</p>
        </div>
      </div>
    );
  }

  const correctCount = questions.filter(q => q.is_correct).length;
  const attemptedCount = questions.filter(q => q.attempted).length;

  return (
    <div className="mx-auto p-2 space-y-4">
      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-600">Total Questions:</span>
              <span className="ml-2 font-semibold text-gray-900">{questions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Correct:</span>
              <span className="ml-2 font-semibold text-green-600">{correctCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Attempted:</span>
              <span className="ml-2 font-semibold text-blue-600">{attemptedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.question_id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {question.attempted ? (
                  question.is_correct ? (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                  )
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
              </div>
              
              {/* Question Content */}
              <div className="flex-1 min-w-0">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Question {index + 1}
                  </h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    question.attempted 
                      ? (question.is_correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")
                      : "bg-gray-50 text-gray-700"
                  }`}>
                    {question.attempted 
                      ? (question.is_correct ? "Correct" : "Incorrect") 
                      : "Not Attempted"
                    }
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {question.actualQuestion || question.question}
                </p>
                
                {/* Answer Options */}
                {Array.isArray(question.options) && question.options.length > 0 ? (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = optionIndex.toString() === question.correct_answer;
                      const isUserAnswer = question.attempted && optionIndex.toString() === question.user_answer;
                      const isWrongSelection = isUserAnswer && !isCorrect;
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border text-sm transition-all ${
                            isCorrect
                              ? 'bg-green-50 border-green-200'
                              : isWrongSelection
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className={`flex-1 ${
                              isCorrect ? 'text-green-900' :
                              isWrongSelection ? 'text-red-900' :
                              'text-gray-700'
                            }`}>
                              <span className="font-semibold mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isCorrect && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-xs font-medium text-green-700">
                                    {isUserAnswer ? "Your Answer" : "Correct"}
                                  </span>
                                </div>
                              )}
                              {isWrongSelection && (
                                <div className="flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  <span className="text-xs font-medium text-red-700">Your Answer</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Fallback if no options available */
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs space-y-1">
                      {question.attempted ? (
                        <>
                          <div>
                            <span className="text-gray-600">Your Answer:</span>
                            <span className={`ml-1 font-semibold ${
                              question.is_correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Option {parseInt(question.user_answer) + 1}
                            </span>
                          </div>
                          {!question.is_correct && (
                            <div>
                              <span className="text-gray-600">Correct Answer:</span>
                              <span className="ml-1 font-semibold text-green-600">
                                Option {parseInt(question.correct_answer) + 1}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-600">Not Attempted</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}