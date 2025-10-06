import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface MCQDetail {
  id: string;
  job_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  subject: string;
  difficulty_level: string;
  created_at: string;
}

export async function getMCQDetailsByJobId(jobId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    const { data, error } = await supabase
      .from("mcq_questions")
      .select("*")
      .eq("job_id", jobId);

    if (error) {
      throw new Error(error.message || "Failed to fetch MCQ details");
    }

    return { data: data as MCQDetail[], error: null };
  } catch (err) {
    console.error("Error fetching MCQ details:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export interface MCQQuestion {
  category: string;
  question: string;
  attempted: boolean;
  is_correct: boolean;
  question_id: string;
  user_answer: string;
  correct_answer: string;
  options?: string[]; // Array of answer options
  actualQuestion?: string; // Actual question text from questions_json
  actualCategory?: string; // Actual category from questions_json
}

export async function getMCQDetailsByApplicationId(applicationId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    // Fetch detailed results from job_applications
    const { data: applicationData, error: appError } = await supabase
      .from("job_applications")
      .select("detailed_results")
      .eq("id", applicationId)
      .single();

    if (appError) {
      throw new Error(appError.message || "Failed to fetch application details");
    }

    // Fetch questions from application_questionnaires
    // Expected questions_json structure: [{ id: 0, options: [...], category: "...", question: "..." }]
    const { data: questionnaireData, error: questionError } = await supabase
      .from("application_questionnaires")
      .select("questions_json")
      .eq("application_id", applicationId)
      .single();

    if (questionError) {
      console.warn("Could not fetch questions:", questionError.message);
    }

    if (!applicationData || !applicationData.detailed_results) {
      return { 
        questions: [], 
        error: null 
      };
    }

    const detailedResults = applicationData.detailed_results as MCQQuestion[];
    const questionsJson = questionnaireData?.questions_json as Array<{
      id: number;
      options: string[];
      category: string;
      question: string;
    }>;
    
    // Merge detailed results with question options (build a lookup to avoid O(n^2))
    const defaultOptions = ["Option A", "Option B", "Option C", "Option D"] as const;
    const qMap = new Map<string, { id: number; options: string[]; category: string; question: string }>();
    questionsJson?.forEach((q) => qMap.set(String(q.id), q));
    const questions = detailedResults.map((result) => {
      const questionData = qMap.get(String(result.question_id));
      const options =
        (questionData?.options && questionData.options.length > 0)
          ? questionData.options
          : [...defaultOptions];
      return {
        ...result,
        options,
        actualQuestion: questionData?.question ?? result.question,
        actualCategory: questionData?.category ?? result.category,
      };
    });
    
    return { 
      questions, 
      error: null 
    };
  } catch (err) {
    console.error("Error fetching MCQ details:", err);
    return {
      questions: [],
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}