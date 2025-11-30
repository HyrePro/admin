"use client";

import React, { useEffect, useState } from "react";
import { getRawQuestionnaireAnswers } from "@/lib/supabase/api/get-mcq-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ApplicationQuestionnairesDisplayProps {
  applicationId: string;
}

export function ApplicationQuestionnairesDisplay({ applicationId }: ApplicationQuestionnairesDisplayProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    const fetchQuestionnaireAnswers = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: rawData, error: fetchError } = await getRawQuestionnaireAnswers(applicationId);
        
        if (!active) return;
        
        if (fetchError) {
          setError(fetchError);
        } else {
          setData(rawData);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to fetch questionnaire answers");
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchQuestionnaireAnswers();
    
    return () => {
      active = false;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading questionnaire answers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading questionnaire answers: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No questionnaire answers data found.
        </p>
      </div>
    );
  }

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Questionnaire Answers Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
            {safeStringify(data)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}