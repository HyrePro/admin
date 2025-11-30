"use client";

import React, { useEffect, useState } from "react";
import { getRawQuestionnaireAnswers } from "@/lib/supabase/api/get-mcq-details";
import { getMCQDetailsByApplicationId, type MCQQuestion } from "@/lib/supabase/api/get-mcq-details";
import { getJobIdByApplicationId } from "@/lib/supabase/api/get-mcq-details";
import { createClient } from "@/lib/supabase/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface DataComparisonDisplayProps {
  applicationId: string;
}

export function DataComparisonDisplay({ applicationId }: DataComparisonDisplayProps) {
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
        
        // Fetch raw data from questionnaire_answers (with fallback to application_questionnaires)
        const { data: rawDataResult, error: rawError } = await getRawQuestionnaireAnswers(applicationId);
        
        if (!active) return;
        
        if (rawError) {
          setError(rawError);
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
          setError(processedError);
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
        <span className="ml-2 text-gray-600">Loading data comparison...</span>
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

  // Extract data for comparison
  const rawDataQuestions = rawData?.questions_json || [];
  const rawDataAnswers = rawData?.answers_json || rawData?.answer_json || [];
  const jobQuestions = jobQuestionnaireData?.questions_json || [];
  const jobAnswers = jobQuestionnaireData?.answer_json || [];
  
  // Helper function to safely stringify objects
  const safeStringify = (obj: any): string => {
    if (typeof obj === 'string') {
      return obj;
    }
    if (obj === null || obj === undefined) {
      return '';
    }
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return '[Circular or unserializable object]';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Raw Data Section (Questionnaire Answers) */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Raw Data from Questionnaire Answers</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-3">
                  <span className="font-medium">Job ID:</span> {jobId || 'Not found'}
                </div>
                <h4 className="font-medium mb-2">Questions JSON ({rawDataQuestions.length} items):</h4>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {safeStringify(rawDataQuestions)}
                </pre>
                
                <h4 className="font-medium mb-2 mt-4">Answers JSON ({Array.isArray(rawDataAnswers) ? rawDataAnswers.length : 'Object'} items):</h4>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {safeStringify(rawDataAnswers)}
                </pre>
              </div>
            </div>
            
            {/* Job Questionnaires Data Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Questionnaires Data</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Questions JSON ({jobQuestions.length} items):</h4>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {safeStringify(jobQuestions)}
                </pre>
                
                <h4 className="font-medium mb-2 mt-4">Answer JSON ({Array.isArray(jobAnswers) ? jobAnswers.length : 'Object'} items):</h4>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {safeStringify(jobAnswers)}
                </pre>
              </div>
            </div>
          </div>
          
          {/* Processed Data Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Processed Data for UI</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Processed Questions ({processedData.length} items):</h4>
              <pre className="bg-white p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {safeStringify(processedData)}
              </pre>
            </div>
          </div>
          
          {/* Analysis Section */}
          <div className="mt-6 border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">Analysis</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p><strong>Job ID:</strong> {jobId || 'Not found'}</p>
              </div>
              
              <div>
                <p><strong>User Answers Source:</strong> questionnaire_answers (with fallback to application_questionnaires)</p>
                <p><strong>Correct Answers Source:</strong> job_questionnaires</p>
              </div>
              
              <div>
                <p><strong>Raw Questions Count:</strong> {rawDataQuestions.length}</p>
                <p><strong>Raw Answers Count:</strong> {Array.isArray(rawDataAnswers) ? rawDataAnswers.length : 'Object'}</p>
                <p><strong>Job Questions Count:</strong> {jobQuestions.length}</p>
                <p><strong>Job Answers Count:</strong> {Array.isArray(jobAnswers) ? jobAnswers.length : 'Object'}</p>
                <p><strong>Processed Questions Count:</strong> {processedData.length}</p>
              </div>
              
              <div>
                <p><strong>Data Consistency Check:</strong> {
                  rawDataQuestions.length === jobQuestions.length && rawDataQuestions.length === processedData.length
                    ? "✓ All question counts match"
                    : "⚠ Question count mismatch detected"
                }</p>
              </div>
              
              {rawDataQuestions.length > 0 && processedData.length > 0 && (
                <div className="mt-3">
                  <p><strong>Sample Comparison:</strong></p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium">Raw Question Sample:</p>
                      <pre className="text-xs mt-1">
                        {safeStringify(rawDataQuestions[0])}
                      </pre>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium">Job Question Sample:</p>
                      <pre className="text-xs mt-1">
                        {jobQuestions.length > 0 ? safeStringify(jobQuestions[0]) : 'No data'}
                      </pre>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="font-medium">Processed Question Sample:</p>
                      <pre className="text-xs mt-1">
                        {safeStringify(processedData[0])}
                      </pre>
                    </div>
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