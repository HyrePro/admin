import { createClient } from "./client"
import { type SupabaseClient } from '@supabase/supabase-js'

export interface CreateJobInput {
  jobTitle: string
  schoolName: string
  experience: string
  employmentType: string
  salaryMin?: string
  salaryMax?: string
  subjects: string[]
  gradeLevel: string[]
  jobDescription: string
  requirements: string[]
  includeSubjectTest?: boolean
  subjectTestDuration?: number
  demoVideoDuration?: number
  includeInterview?: boolean
  interviewFormat?: string
  interviewDuration?: number
  interviewQuestions: { id: string | number; question: string }[]
  assessmentDifficulty?: string
  numberOfQuestions?: number
  minimumPassingMarks?: number
  numberOfOpenings?: number
  demoVideoPassingScore?: number
}

/**
 * @deprecated Use the server-side API endpoint /api/create-job instead.
 * This function is kept for backward compatibility but should not be used
 * as it doesn't include proper authentication and school_id from user metadata.
 */
export async function createJob(jobData: CreateJobInput) {
  // Create the supabase client instance
  const supabase: SupabaseClient = createClient()

  // Map jobData to DB schema
  const {
    jobTitle,
    experience,
    employmentType,
    salaryMin,
    salaryMax,
    subjects,
    gradeLevel,
    jobDescription,
    includeSubjectTest,
    subjectTestDuration,
    demoVideoDuration,
    includeInterview,
    interviewFormat,
    interviewDuration,
    interviewQuestions,
    assessmentDifficulty,
    numberOfQuestions,
    minimumPassingMarks,
    numberOfOpenings,
    demoVideoPassingScore
  } = jobData;

  // Validate demoVideoDuration if provided
  if (demoVideoDuration !== undefined && (demoVideoDuration < 0 || demoVideoDuration > 10)) {
    throw new Error('demoVideoDuration must be between 0 and 10 minutes');
  }
  
  // Validate numberOfQuestions if provided
  if (numberOfQuestions !== undefined && (numberOfQuestions < 0 || numberOfQuestions > 30)) {
    throw new Error('numberOfQuestions must be between 0 and 30');
  }

  // Compose salary range string
  let salary_range = "";
  if (salaryMin && salaryMax) salary_range = `₹${salaryMin} - ₹${salaryMax}`;
  else if (salaryMin) salary_range = `₹${salaryMin}+`;
  else if (salaryMax) salary_range = `Up to ₹${salaryMax}`;

  // Compose assessment_difficulty JSON
  const assessment_difficulty = {
    subjectScreening: includeSubjectTest || false,
    includeVideoAssessment: !!demoVideoDuration,
    includeInterview: includeInterview || false,
  };

  // Insert into jobs table
  const { data, error } = await supabase.from("jobs").insert([
    {
      title: jobTitle,
      job_type: employmentType,
      mode: experience, // You may want to map this differently if 'mode' is not 'experience'
      grade_levels: gradeLevel,
      subjects,
      salary_range,
      openings: numberOfOpenings || 1, // Default to 1, adjust as needed
      job_description: jobDescription,
      responsibilities: "", // Not provided in jobData
      assessment_difficulty,
      created_at: new Date().toISOString(),
      number_of_questions: includeSubjectTest ? numberOfQuestions : 10,
      minimum_passing_marks: includeSubjectTest ? minimumPassingMarks : 0,
      demo_duration: demoVideoDuration || 0,
      demo_passing_score: demoVideoPassingScore,
      assessment_type: assessmentDifficulty
    },
  ]).select("id").single();

  return { data, error };
}