"use client";

import React, { useEffect, useState } from "react";
import { getRawQuestionnaireAnswers } from "@/lib/supabase/api/get-mcq-details";
import { getMCQDetailsByApplicationId, type MCQQuestion } from "@/lib/supabase/api/get-mcq-details";
import { getJobIdByApplicationId } from "@/lib/supabase/api/get-mcq-details";
import { createClient } from "@/lib/supabase/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface DetailedDataAnalysisProps {
  applicationId: string;
}

export function DetailedDataAnalysis({ applicationId }: DetailedDataAnalysisProps) {
  const [rawData, setRawData] = useState<any>(null);
  const [jobQuestionnaireData, setJobQuestionnaireData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<MCQQuestion[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get job ID
        const { jobId: fetchedJobId, error: jobIdError } = await getJobIdByApplicationId(applicationId);
        
        if (!active) return;
        
        if (jobIdError) {
          setError(`Job ID Error: ${jobIdError}`);
          return;
        }
        
        setJobId(fetchedJobId);
        
        // Fetch raw questionnaire answers data (with fallback logic)
        const { data: rawDataResult, error: rawError } = await getRawQuestionnaireAnswers(applicationId);
        
        if (!active) return;
        
        if (rawError) {
          setError(`Raw Data Error: ${rawError}`);
          return;
        }
        
        setRawData(rawDataResult);
        
        // Fetch job questionnaire data (questions and correct answers)
        if (fetchedJobId) {
          const supabase = createClient();
          const { data: jobQuestionnaireResult, error: jobQuestionnaireError } = await supabase
            .from("job_questionnaires")
            .select("questions_json, answer_json")
            .eq("job_id", fetchedJobId)
            .single();
          
          if (!active) return;
          
          if (jobQuestionnaireError) {
            setError(`Job Questionnaire Error: ${jobQuestionnaireError.message}`);
          } else {
            setJobQuestionnaireData(jobQuestionnaireResult);
          }
        }
        
        // Fetch processed data (combined view)
        const { questions: processedQuestions, error: processedError } = await getMCQDetailsByApplicationId(applicationId);
        
        if (!active) return;
        
        if (processedError) {
          setError(`Processed Data Error: ${processedError}`);
        } else {
          setProcessedData(processedQuestions ?? []);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      active = false;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading detailed data analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Extract data for analysis
  const applicationQuestions = rawData?.questions_json || [];
  const applicationAnswers = rawData?.answers_json || rawData?.answer_json || [];
  const jobQuestions = jobQuestionnaireData?.questions_json || [];
  const jobAnswers = jobQuestionnaireData?.answer_json || [];
  
  // Create mappings for easier comparison
  const applicationAnswerMap = new Map();
  if (Array.isArray(applicationAnswers)) {
    applicationAnswers.forEach((answer: any) => {
      applicationAnswerMap.set(answer.id, answer);
    });
  } else if (typeof applicationAnswers === 'object' && applicationAnswers !== null) {
    // Handle object format
    Object.entries(applicationAnswers).forEach(([id, answer]) => {
      applicationAnswerMap.set(id, answer);
    });
  }
  
  const jobAnswerMap = new Map();
  if (Array.isArray(jobAnswers)) {
    jobAnswers.forEach((answer: any) => {
      jobAnswerMap.set(answer.id, answer);
    });
  } else if (typeof jobAnswers === 'object' && jobAnswers !== null) {
    // Handle object format
    Object.entries(jobAnswers).forEach(([id, answer]) => {
      jobAnswerMap.set(id, answer);
    });
  }
  
  // Analyze mismatches
  const mismatches: string[] = [];
  
  // Check if question IDs match between application and job questionnaires
  const applicationQuestionIds = applicationQuestions.map((q: any) => q.id);
  const jobQuestionIds = jobQuestions.map((q: any) => q.id);
  
  const missingInApplication = jobQuestionIds.filter((id: number) => !applicationQuestionIds.includes(id));
  const extraInApplication = applicationQuestionIds.filter((id: number) => !jobQuestionIds.includes(id));
  
  if (missingInApplication.length > 0) {
    // Ensure all items are converted to strings
    const missingItems = missingInApplication.map((item: any) => 
      typeof item === 'object' ? JSON.stringify(item) : String(item)
    );
    mismatches.push(`Missing questions in application: ${missingItems.join(', ')}`);
  }
  
  if (extraInApplication.length > 0) {
    // Ensure all items are converted to strings
    const extraItems = extraInApplication.map((item: any) => 
      typeof item === 'object' ? JSON.stringify(item) : String(item)
    );
    mismatches.push(`Extra questions in application: ${extraItems.join(', ')}`);
  }
  
  // Check answer mappings
  const processedAnswerMap = new Map();
  processedData.forEach(question => {
    processedAnswerMap.set(parseInt(question.question_id), {
      user_answer: question.user_answer,
      correct_answer: question.correct_answer,
      attempted: question.attempted,
      is_correct: question.is_correct
    });
  });
  
  // Helper function to safely stringify objects for display
  const safeStringify = (obj: any): string => {
    if (typeof obj === 'string') {
      return obj;
    }
    if (obj === null || obj === undefined) {
      return '';
    }
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '[Circular or unserializable object]';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detailed Data Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Questionnaire Answers Data */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Questionnaire Answers Data (User Responses)</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <p><strong>Data Source:</strong> questionnaire_answers (with fallback to application_questionnaires)</p>
                </div>
                <p className="mb-2"><strong>Questions:</strong> {applicationQuestions.length} items</p>
                <p className="mb-2"><strong>Answers:</strong> {Array.isArray(applicationAnswers) ? applicationAnswers.length : 'Object format'} items</p>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </div>
            
            {/* Job Questionnaires Data */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Questionnaires Data (Questions & Correct Answers)</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-2">
                  <p><strong>Data Source:</strong> job_questionnaires</p>
                </div>
                <p className="mb-2"><strong>Questions:</strong> {jobQuestions.length} items</p>
                <p className="mb-2"><strong>Answers:</strong> {Array.isArray(jobAnswers) ? jobAnswers.length : 'Object format'} items</p>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(jobQuestionnaireData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          {/* Processed Data */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Processed Data for UI ({processedData.length} items)</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-2">
                <p><strong>Data Source:</strong> Combined from questionnaire_answers and job_questionnaires</p>
              </div>
              <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(processedData, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Analysis */}
          <div className="mt-6 border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">Data Analysis</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p><strong>Job ID:</strong> {jobId || 'Not found'}</p>
              </div>
              
              <div>
                <p><strong>Data Sources:</strong></p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>User Answers:</strong> questionnaire_answers (with fallback to application_questionnaires)</li>
                  <li><strong>Questions & Correct Answers:</strong> job_questionnaires</li>
                  <li><strong>Processed Data:</strong> Combination of both sources</li>
                </ul>
              </div>
              
              <div>
                <p><strong>Counts:</strong></p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>User Questions: {applicationQuestions.length}</li>
                  <li>User Answers: {Array.isArray(applicationAnswers) ? applicationAnswers.length : 'Object format'}</li>
                  <li>Job Questions: {jobQuestions.length}</li>
                  <li>Job Answers: {Array.isArray(jobAnswers) ? jobAnswers.length : 'Object format'}</li>
                  <li>Processed Questions: {processedData.length}</li>
                </ul>
              </div>
              
              <div>
                <p><strong>Consistency Check:</strong> {
                  applicationQuestions.length === jobQuestions.length && applicationQuestions.length === processedData.length
                    ? "✓ All question counts match"
                    : "⚠ Question count mismatch detected"
                }</p>
              </div>
              
              {mismatches.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-100 rounded">
                  <p className="font-medium">Mismatches Found:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {mismatches.map((mismatch, index) => (
                      <li key={index}>{mismatch}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Check specific question mappings */}
              {processedData.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium">Question Mapping Analysis (First 5 items):</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-xs">Question ID</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-xs">User Answer</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-xs">Correct Answer</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium text-xs">Status</p>
                    </div>
                    
                    {processedData.slice(0, 5).map((question, index) => {
                      const questionId = parseInt(question.question_id);
                      
                      return (
                        <React.Fragment key={questionId}>
                          <div className="bg-white p-3 rounded">
                            <p className="text-xs">{questionId}</p>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <p className="text-xs">{safeStringify(question.user_answer) || 'Not attempted'}</p>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <p className="text-xs">{safeStringify(question.correct_answer) || 'Not found'}</p>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <p className="text-xs">
                              {question.attempted ? (question.is_correct ? '✓ Correct' : '✗ Incorrect') : 'Not attempted'}
                            </p>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}