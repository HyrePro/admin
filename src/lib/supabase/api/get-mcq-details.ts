import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface MCQQuestionReport {
  id: string;
  user_id: string | null;
  job_id: string | null;
  application_id: string;
  applicant_id: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  question_index: number;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface MCQDetail {
  id: string;
  job_id: string;
  question_index: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  subject: string;
  difficulty_level: string;
  created_at: string;
  reports: MCQQuestionReport[];
  report_count: number;
  source_questionnaire_id?: string;
}

export async function getMCQDetailsByJobId(jobId: string) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()
  
  try {
    const { data: questionnaireRow, error: questionnaireError } = await supabase
      .from("job_questionnaires")
      .select("id, job_id, questions_json, answer_json, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (questionnaireError) {
      throw new Error(questionnaireError.message || "Failed to fetch MCQ questionnaire");
    }

    if (!questionnaireRow) {
      return { data: [] as MCQDetail[], error: null };
    }

    const { data: reportRows, error: reportsError } = await supabase
      .from("mcq_question_reports")
      .select("id, user_id, job_id, application_id, applicant_id, question_index, reason, details, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (reportsError) {
      throw new Error(reportsError.message || "Failed to fetch MCQ question reports");
    }

    const applicantIds = Array.from(
      new Set(
        (reportRows ?? [])
          .map((row) => (row.applicant_id ? String(row.applicant_id) : null))
          .filter((id): id is string => Boolean(id))
      )
    );

    const applicantMap = new Map<string, { first_name: string | null; last_name: string | null; email: string | null }>();
    if (applicantIds.length > 0) {
      const { data: applicantRows, error: applicantError } = await supabase
        .from("applicant_info")
        .select("id, first_name, last_name, email")
        .in("id", applicantIds);

      if (applicantError) {
        throw new Error(applicantError.message || "Failed to fetch applicant details");
      }

      (applicantRows ?? []).forEach((row) => {
        applicantMap.set(String(row.id), {
          first_name: row.first_name == null ? null : String(row.first_name),
          last_name: row.last_name == null ? null : String(row.last_name),
          email: row.email == null ? null : String(row.email),
        });
      });
    }

    const questions = parseQuestionList(questionnaireRow.questions_json);
    const answers = parseAnswerList(questionnaireRow.answer_json);
    const answerMap = new Map<string, number | string>();
    answers.forEach((answer, idx) => {
      const key = answer?.id != null ? String(answer.id) : String(idx);
      if (answer?.answer != null) {
        answerMap.set(key, answer.answer);
      }
    });

    const reportsByQuestionIndex = new Map<number, MCQQuestionReport[]>();
    (reportRows ?? []).forEach((row) => {
      const questionIndex =
        typeof row.question_index === "number"
          ? row.question_index
          : Number.parseInt(String(row.question_index), 10);
      if (!Number.isFinite(questionIndex)) return;
      const report: MCQQuestionReport = {
        applicant_name: null,
        applicant_email: null,
        id: String(row.id),
        user_id: row.user_id ? String(row.user_id) : null,
        job_id: row.job_id ? String(row.job_id) : null,
        application_id: String(row.application_id),
        applicant_id: row.applicant_id ? String(row.applicant_id) : null,
        question_index: questionIndex,
        reason: String(row.reason ?? ""),
        details: row.details == null ? null : String(row.details),
        created_at: String(row.created_at ?? ""),
      };
      if (report.applicant_id) {
        const applicant = applicantMap.get(report.applicant_id);
        if (applicant) {
          const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ").trim();
          report.applicant_name = name || null;
          report.applicant_email = applicant.email ?? null;
        }
      }
      const existing = reportsByQuestionIndex.get(questionIndex) ?? [];
      existing.push(report);
      reportsByQuestionIndex.set(questionIndex, existing);
    });

    const normalized: MCQDetail[] = questions.map((question, index) => {
      const idKey = question?.id != null ? String(question.id) : String(index);
      const rawCorrectAnswer = answerMap.get(idKey) ?? answerMap.get(String(index)) ?? "";
      const reports = reportsByQuestionIndex.get(index) ?? [];

      return {
        id: idKey,
        job_id: String(questionnaireRow.job_id ?? jobId),
        question_index: index,
        question_text: String(question.question ?? question.question_text ?? ""),
        options: normalizeStringArray(question.options),
        correct_answer: String(rawCorrectAnswer),
        subject: String(question.category ?? question.subject ?? "General"),
        difficulty_level: String(question.difficulty ?? question.difficulty_level ?? "n/a"),
        created_at: String(questionnaireRow.created_at ?? ""),
        reports,
        report_count: reports.length,
        source_questionnaire_id: String(questionnaireRow.id),
      };
    });

    return { data: normalized, error: null };
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
    // First, get the job_id from job_applications table
    const { data: applicationData, error: appError } = await supabase
      .from("job_applications")
      .select("job_id, detailed_results")
      .eq("id", applicationId)
      .single();

    if (appError) {
      throw new Error(appError.message || "Failed to fetch application details");
    }

    const jobId = applicationData.job_id;
    
    // Fetch questions from job_questionnaires using the job_id
    // Expected questions_json structure: [{ id: 0, options: [...], category: "...", question: "..." }]
    const { data: questionnaireData, error: questionError } = await supabase
      .from("job_questionnaires")
      .select("questions_json")
      .eq("job_id", jobId)
      .single();

    if (questionError) {
      console.warn("Could not fetch questions:", questionError.message);
    }

    if (!applicationData.detailed_results) {
      return { 
        questions: [], 
        error: null 
      };
    }

    const detailedResults = applicationData.detailed_results as MCQQuestion[];
    const questionsJson = parseQuestionList(questionnaireData?.questions_json);
    
    // Merge detailed results with question options (build a lookup to avoid O(n^2))
    const defaultOptions = ["Option A", "Option B", "Option C", "Option D"] as const;
    const qMap = new Map<string, ParsedQuestion>();
    questionsJson?.forEach((q) => qMap.set(String(q.id), q));
    const questions = detailedResults.map((result) => {
      const questionData = qMap.get(String(result.question_id));
      const normalizedOptions = normalizeStringArray(questionData?.options);
      const options = normalizedOptions.length > 0 ? normalizedOptions : [...defaultOptions];
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

type ParsedQuestion = {
  id?: number | string;
  options?: unknown;
  category?: string;
  subject?: string;
  question?: string;
  question_text?: string;
  difficulty?: string;
  difficulty_level?: string;
  [key: string]: unknown;
};

type ParsedAnswer = {
  id?: number | string;
  answer?: number | string;
  [key: string]: unknown;
};

function parseQuestionList(value: unknown): ParsedQuestion[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord) as ParsedQuestion[];
  }
  return [];
}

function parseAnswerList(value: unknown): ParsedAnswer[] {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord) as ParsedAnswer[];
  }
  return [];
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  return value;
}

function normalizeStringArray(value: unknown): string[] {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => String(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
