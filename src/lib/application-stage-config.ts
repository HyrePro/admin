/**
 * Application Stage Configuration
 * HyrePro-aligned, AI-first hiring pipeline
 */

export interface ApplicationStageConfig {
  [stageName: string]: {
    name: string
    description: string
  }
}

export const APPLICATION_STAGE_CONFIG: ApplicationStageConfig = {
  in_progress: {
    name: 'In Progress',
    description: 'The candidate is actively filling out the initial application form and has not yet submitted it.'
  },

  application_submitted: {
    name: 'Application Submitted',
    description: 'The candidate has submitted the application and it is queued for automated processing.'
  },

  assessment_questionnaire_creation: {
    name: 'Assessment Questionnaire Creation',
    description: 'The system is using AI to generate a role-specific MCQ assessment based on job requirements.'
  },

  assessment_ready: {
    name: 'Assessment Ready',
    description: 'The AI-generated MCQ assessment is ready and available for the candidate to attempt.'
  },

  assessment_in_progress: {
    name: 'Assessment In Progress',
    description: 'The candidate is currently attempting the AI-generated MCQ assessment.'
  },

  assessment_in_evaluation: {
    name: 'Assessment In Evaluation',
    description: 'The candidate has completed the MCQ assessment and the system is automatically evaluating the responses.'
  },

  assessment_evaluated: {
    name: 'Assessment Evaluated',
    description: 'The MCQ assessment has been fully evaluated by the system and results are available.'
  },

  assessment_failed: {
    name: 'Assessment Failed',
    description: 'The candidate did not meet the minimum required score in the MCQ assessment.'
  },

  demo_creation: {
    name: 'Demo Creation',
    description: 'The system is using AI to generate a teaching demonstration topic or prompt for the candidate.'
  },

  demo_ready: {
    name: 'Demo Ready',
    description: 'The AI-generated teaching demonstration task is ready for the candidate to record.'
  },

  demo_in_progress: {
    name: 'Demo In Progress',
    description: 'The candidate is recording or uploading the teaching demonstration video.'
  },

  demo_in_evaluation: {
    name: 'Demo In Evaluation',
    description: 'The submitted teaching demonstration video is being analyzed using AI-based evaluation.'
  },

  demo_evaluated: {
    name: 'Demo Evaluated',
    description: 'The teaching demonstration video has been fully evaluated by the AI system.'
  },

  demo_failed: {
    name: 'Demo Failed',
    description: 'The candidate did not meet the required evaluation thresholds in the teaching demonstration.'
  },

  interview_ready: {
    name: 'Interview Ready',
    description: 'The candidate has cleared all automated rounds and the hiring manager must assign panelists and schedule the interview.'
  },

  interview_scheduled: {
    name: 'Interview Scheduled',
    description: 'The interview has been scheduled with assigned panelists at a fixed date and time.'
  },

  interview_in_progress: {
    name: 'Interview In Progress',
    description: 'The candidate interview has started, either online or offline. This is an intermediate tracking state.'
  },

  panelist_review_in_progress: {
    name: 'Panelist Review In Progress',
    description: 'A human recruiter or panelist is conducting the interview and submitting structured feedback and ratings.'
  },

  offered: {
    name: 'Offered',
    description: 'A formal offer has been extended to the candidate.'
  },

  completed: {
    name: 'Completed',
    description: 'The hiring process has concluded for this candidate with a final outcome.'
  },

  paused: {
    name: 'Paused',
    description: 'The application has been temporarily paused by the system or hiring team without penalization.'
  },

  suspended: {
    name: 'Suspended',
    description: 'The candidate has been suspended due to confirmed violations such as cheating, tab switching, or disabling the camera.'
  },

  appealed: {
    name: 'Appealed',
    description: 'The candidate has raised an appeal due to assessment violations such as camera or proctoring issues.'
  },

  withdrawn: {
    name: 'Withdrawn',
    description: 'The candidate has voluntarily exited the hiring process.'
  }
}

/**
 * Get application stage details by stage key
 */
export const getApplicationStageDetails = (stageKey: string) => {
  return (
    APPLICATION_STAGE_CONFIG[stageKey] || {
      name: stageKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase()),
      description: `Application stage: ${stageKey}`
    }
  )
}
