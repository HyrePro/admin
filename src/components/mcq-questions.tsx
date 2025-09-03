"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getMCQDetails, type MCQQuestion } from "@/lib/supabase/api/get-mcq-details";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        const { questions: mcqQuestions, error: mcqError } = await getMCQDetails(
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading assessment details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-4">
        <AlertDescription>
          Error loading assessment details: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No assessment questions found for this application.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h3 className="text-lg font-semibold text-gray-900">Assessment Questions</h3>
        <p className="text-sm text-gray-600 mt-1">
          Total Questions: {questions.length} | 
          Correct Answers: {questions.filter(q => q.is_correct).length} | 
          Attempted: {questions.filter(q => q.attempted).length}
        </p>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)] px-4 py-4 space-y-3">
        {questions.map((question, index) => (
          <Card key={question.question_id} className="hover:shadow-md ">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {question.attempted ? (
                    question.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Question {index + 1}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {question.actualQuestion || question.question}
                    </p>
                    
                    {/* Answer Options */}
                    {Array.isArray(question.options) && question.options.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optionIndex) => {
                          const isCorrect = optionIndex.toString() === question.correct_answer;
                          const isUserAnswer = question.attempted && optionIndex.toString() === question.user_answer;
                          const isWrongSelection = isUserAnswer && !isCorrect;
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-md border text-sm transition-all ${
                                isCorrect
                                  ? 'bg-green-50 border-green-600 text-green-800'
                                  : isWrongSelection
                                  ? 'bg-red-50 border-red-600 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex-1">
                                  <span className="font-medium mr-2">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  {option}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isCorrect && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-xs font-medium text-green-600">Correct</span>
                                    </div>
                                  )}
                                  {isWrongSelection && (
                                    <div className="flex items-center gap-1">
                                      <XCircle className="w-4 h-4 text-red-600" />
                                      <span className="text-xs font-medium text-red-600">Your Answer</span>
                                    </div>
                                  )}
                                  {isUserAnswer && isCorrect && (
                                    <span className="text-xs font-medium text-green-600">Your Answer</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Fallback if no options available */}
                    {!(Array.isArray(question.options) && question.options.length > 0) && (
                      <div className="flex flex-col gap-2 text-xs mb-4">
                        {question.attempted && (
                          <>
                            <div>
                              <span className="text-gray-500">Your Answer:</span>
                              <span className={`ml-1 font-medium ${
                                question.is_correct ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Option {parseInt(question.user_answer) + 1}
                              </span>
                            </div>
                            {!question.is_correct && (
                              <div>
                                <span className="text-gray-500">Correct Answer:</span>
                                <span className="ml-1 font-medium text-green-600">
                                  Option {parseInt(question.correct_answer) + 1}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {!question.attempted && (
                          <div>
                            <span className="text-gray-500">Not Attempted</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Badge 
                      variant={question.is_correct ? "default" : question.attempted ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {question.attempted 
                        ? (question.is_correct ? "Correct" : "Incorrect") 
                        : "Not Attempted"
                      }
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}