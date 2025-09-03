"use client";

import React from "react";

interface JobOverviewProps {
  job: {
    id: string;
    title: string;
    status: string;
    subjects: string[];
    grade_levels: string[];
    job_type?: string;
    location?: string;
    mode?: string;
    board?: string;
    openings?: number;
    salary_range?: string;
    job_description?: string;
    responsibilities?: string;
    requirements?: string;
    created_at?: string;
    school_id?: string;
    number_of_questions?: number;
    assessment_difficulty?: {
      interviewFormat?: string;
      includeInterview?: boolean;
      demoVideoDuration?: number;
      interviewDuration?: number;
      includeSubjectTest?: boolean;
      subjectTestDuration?: number;
      interviewQuestions?: Array<{
        id: number;
        question: string;
      }>;
    };
    application_analytics?: {
      total_applications: number;
      assessment: number;
      demo: number;
      interviews: number;
      offered: number;
    };
  };
}

export function JobOverview({ job }: JobOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Job Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Job Type</div>
          <div className="text-lg font-semibold text-gray-900 capitalize">
            {job.job_type || 'Not specified'}
          </div>
        </div>
       
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Work Experience (yrs)</div>
          <div className="text-lg font-semibold text-gray-900 capitalize">
            {job.mode || 'Not specified'}
          </div>
        </div>
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Openings</div>
          <div className="text-lg font-semibold text-gray-900">
            {job.openings || 0}
          </div>
        </div>
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Created Date</div>
          <div className="text-lg font-semibold text-gray-900">
            {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Not available'}
          </div>
        </div>
        {job.salary_range && (
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Salary Range</div>
          <div className="text-lg font-semibold text-gray-900">{job.salary_range}</div>
        </div>
      )}

      </div>

      {/* Job Description Section */}
      {(job.job_description || job.responsibilities || job.requirements) && (
        <div className="space-y-4">
          {job.job_description && (
            <div className="rounded-lg p-4 border">
              <div className="text-sm font-medium text-gray-700 mb-1">Job Description</div>
              <div className="text-gray-900 whitespace-pre-wrap">{job.job_description}</div>
            </div>
          )}
          
          {job.responsibilities && (
            <div className="rounded-lg p-4 border">
              <div className="text-sm font-medium text-gray-700 mb-1">Responsibilities</div>
              <div className="text-gray-900 whitespace-pre-wrap">{job.responsibilities}</div>
            </div>
          )}
        </div>
      )}

      {/* Salary Range */}
      
      {/* Assessment Configuration */}
      {job.assessment_difficulty && (
        <div className="rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-1">Assessment Configuration</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {job.assessment_difficulty.includeSubjectTest && (
              <div className="rounded-lg p-3 border">
                <div className="text-sm font-medium text-green-700 mb-1">MCQ Assessment</div>
                <div className="text-sm text-gray-600">
                  Duration: {job.assessment_difficulty.subjectTestDuration || 'Not specified'} min
                  {job.number_of_questions && (
                    <div>Questions: {job.number_of_questions}</div>
                  )}
                </div>
              </div>
            )}

            {job.assessment_difficulty.demoVideoDuration && (
              <div className="rounded-lg p-3 border">
                <div className="text-sm font-medium text-purple-700 mb-1">Demo Video</div>
                <div className="text-sm text-gray-600">
                  Duration: {job.assessment_difficulty.demoVideoDuration} min
                </div>
              </div>
            )}
            
            {job.assessment_difficulty.includeInterview && (
              <div className="rounded-lg p-3 border">
                <div className="text-sm font-medium text-blue-700 mb-1">Interview</div>
                <div className="text-sm text-gray-600">
                  Format: {job.assessment_difficulty.interviewFormat || 'Not specified'}
                  <div>Duration: {job.assessment_difficulty.interviewDuration || 'Not specified'} min</div>
                </div>
              </div>
            )}
            
            
          </div>
        </div>
      )}


    </div>
  );
}