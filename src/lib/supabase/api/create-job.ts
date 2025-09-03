import { supabase } from "./client"

export interface CreateJobInput {
  jobTitle: string
  schoolName: string
  location: string
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
}

/**
 * @deprecated Use the server-side API endpoint /api/create-job instead.
 * This function is kept for backward compatibility but should not be used
 * as it doesn't include proper authentication and school_id from user metadata.
 */
export async function createJob(jobData: CreateJobInput) {
  // Map jobData to DB schema
  const {
    jobTitle,
    location,
    experience,
    employmentType,
    salaryMin,
    salaryMax,
    subjects,
    gradeLevel,
    jobDescription,
    requirements,
    includeSubjectTest,
    subjectTestDuration,
    demoVideoDuration,
    includeInterview,
    interviewFormat,
    interviewDuration,
    interviewQuestions,
    assessmentDifficulty,
    numberOfQuestions,
  } = jobData;

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
    includeSubjectTest,
    subjectTestDuration,
    demoVideoDuration,
    interviewFormat,
    interviewDuration,
    interviewQuestions,
    assessmentDifficulty: includeSubjectTest ? assessmentDifficulty : undefined,
    numberOfQuestions: includeSubjectTest ? numberOfQuestions : undefined,
  };

  // Insert into jobs table
  const { data, error } = await supabase.from("jobs").insert([
    {
      title: jobTitle,
      job_type: employmentType,
      location,
      mode: experience, // You may want to map this differently if 'mode' is not 'experience'
      grade_levels: gradeLevel,
      subjects,
      salary_range,
      openings: 1, // Default to 1, adjust as needed
      job_description: jobDescription,
      responsibilities: "", // Not provided in jobData
      requirements: requirements.join("\n"),
      assessment_difficulty,
      created_at: new Date().toISOString(),
      number_of_questions: includeSubjectTest ? numberOfQuestions : 10,
    },
  ]).select("id").single();

  return { data, error };
} 