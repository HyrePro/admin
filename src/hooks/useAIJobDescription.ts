import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/api/client';

interface JobDescriptionPayload {
  job_title: string;
  subjects_to_teach: string[] | string;
  grade: string;
  employment_type: string;
  experience: string;
  board: string;
  school_type: string;
  school_name: string;
  salary_range?: string;
  existing_job_description?: string;
}

interface JobDescription {
  title: string;
  school_overview: string;
  role_summary: string;
  key_responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications: string[];
  experience_requirements: string;
  employment_details: string;
  salary_information: string;
  application_notes: string;
}

interface GenerateResponse {
  success: boolean;
  optimized: boolean;
  job_description: JobDescription;
  quota?: {
    remaining_hour: number;
    remaining_day: number;
  };
}

interface RateLimitError {
  error: string;
  reason: string;
  limit: number;
  reset_at: string;
  message: string;
}

export function useAIJobDescription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null);

  const generateJobDescription = async (
    payload: JobDescriptionPayload
  ): Promise<JobDescription | null> => {
    setLoading(true);
    setError(null);
    setRateLimitInfo(null);

    try {
      const response = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitInfo(data);
          setError(data.message);
        } else if (response.status === 401) {
          setError('Please log in to use AI generation');
        } else {
          setError(data.error || 'Failed to generate job description');
        }
        return null;
      }

      const result = data as GenerateResponse;
      return result.job_description;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateJobDescription,
    loading,
    error,
    rateLimitInfo,
  };
}
