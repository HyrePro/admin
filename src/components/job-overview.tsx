"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

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
  const [isMcqExpanded, setIsMcqExpanded] = useState(false);
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);
  const [isInterviewExpanded, setIsInterviewExpanded] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Job Basic Information */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      </div> */}

      {/* Job Description Section */}
      <div className="flex flex-row gap-4">

        <div className="rounded-lg p-4 border border-gray-200 bg-white">
          <div className="text-sm font-bold mb-2">Job Description</div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{job.job_description}</div>
        </div>
        <div className="flex flex-col rounded-lg p-4 border border-gray-200 bg-white min-w-[220px]">
          <div className="text-sm font-bold mb-2">Job Details</div>
          <div className="space-y-2">
            <div className="flex flex-row gap-2">
              <div className="text-sm text-gray-900">Job Type: </div>
              <div className="text-sm font-semibold capitalize">
                {job.job_type || 'Not specified'}
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="text-sm text-gray-900">Experience: </div>
              <div className="text-sm font-semibold capitalize">
                {job.mode || 'Not specified'}
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="text-sm text-gray-900">Subjects: </div>
              <div className="text-sm font-semibold capitalize">
                {Array.isArray(job.subjects) && job.subjects.length > 0 
                  ? job.subjects.join(", ") 
                  : 'Not specified'}
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="text-sm text-gray-900">Grades: </div>
              <div className="text-sm font-semibold capitalize">
                {job.grade_levels || 'Not specified'}
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="text-sm text-gray-900">Salary: </div>
              <div className="text-sm font-semibold capitalize">
                {job.salary_range || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Configuration */}
      {job.assessment_difficulty && (
        <div className="rounded-lg p-4 border mt-4 mb-4">
          <div className="text-sm font-bold">Assessment Configuration</div>
          <div className="text-sm text-gray-900">Configure the various assessment stages for this job
          </div>
          <div className="mt-4 space-y-3">
            <div
              className="cursor-pointer pb-3 border-b-1 border-gray-200"
              onClick={() => setIsMcqExpanded(!isMcqExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium ">MCQ Assessment</div>
                <div className="transform transition-transform items-center">
                  {isMcqExpanded ?
                    <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </div>
              </div>
              <div className="text-sm text-gray-900">
                A multiple-choice questionnaire to evaluate subject knowledge, pedagogy and digital literacy.
              </div>
              {isMcqExpanded && (
                <div className="mt-2 text-sm text-gray-900">
                  {/* Expanded content with slider */}
                  <div className="p-3 rounded-md">


                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium">Number of Questions</label>
                        <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded">10</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          defaultValue="10"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-600 [&::-webkit-slider-thumb]:to-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                          <span>15</span>
                          <span>20</span>
                          <span>30</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <strong>Duration:</strong> {job.assessment_difficulty.subjectTestDuration || 'Not specified'} min
                    </div>
                    {job.number_of_questions && (
                      <div className="mt-1">
                        <strong>Questions:</strong> {job.number_of_questions}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div
              className="cursor-pointer pb-3 border-b-1 border-gray-200"
              onClick={() => setIsDemoExpanded(!isDemoExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium ">Demo Assessment</div>
                <div className="transform transition-transform">
                  {isDemoExpanded ?
                    <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </div>
              </div>
              <div className="text-sm text-gray-900">
                Candidates must present a teaching solution for a given classroom scenario, simulating real-world instruction to evaluate pedagogical approach, clarity, and engagement skills.</div>
              {isDemoExpanded && (
                <div className="mt-4 space-y-3 h-full">
                  <div className="flex items-center gap-3">
                    <Checkbox id="interview" checked />
                    <Label htmlFor="interview">Enabled</Label>
                  </div>
                  <div className="flex gap-3 h-full flex-grow">
                    <div className="flex flex-col rounded-lg p-4 border border-gray-200 bg-white">
                      <div className="text-sm font-bold mb-2">Submission Configuration</div>
                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-row gap-2">
                          <div className="text-sm text-gray-900">Submission Type: </div>
                          <div className="text-sm font-semibold capitalize">
                            Recorded Teaching Video
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm text-gray-900">Demo Duration: </div>
                          <div className="text-sm font-semibold capitalize">
                            10 mins
                          </div>
                        </div>
                        <Slider min={2} max={10} step={5} value={[10]} />
                        <div className="text-sm font-semibold pt-4 border-t-1">Instructions for Candidates</div>
                        <div className="text-sm text-gray-900">Candidates are required to present a short teaching demonstration simulating a real classroom scenario. The session should showcase how they deliver a concept, engage learners, and assess understanding within a limited time frame.
                          Deliverables:
                          A recorded video (5–10 minutes) presenting the chosen topic.
                          A brief lesson plan or outline describing objectives, approach, and learning outcomes.
                          (Optional) Supporting materials such as slides, visuals, or props used during the demo.
                          Expectations:
                          Demonstrate clear subject knowledge and structured delivery.
                          Maintain engagement through interaction, clarity, and real-world relevance.
                          Use effective communication, pacing, and classroom-style explanation.
                          Reflect awareness of diverse learners and basic pedagogical principles.</div>
                      </div>
                    </div>
                    <div className="flex flex-col rounded-lg p-4 border border-gray-200 bg-white min-w-[220px]">
                      <div className="text-sm font-bold mb-2">Evaluation Rubric</div>
                      <div className="space-y-2">
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">• Subject Knowledge: </div>
                          <div className="text-sm text-gray-900">
                            Accuracy, relevance, conceptual depth
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">• Language Fluency: </div>
                          <div className="text-sm text-gray-900 capitalize">
                            Clarity, vocabulary, articulation
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">
                            • Grammar & Structure: </div>
                          <div className="text-sm text-gray-900  capitalize">
                            Sentence flow, correctness, readability

                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">• Eye Contact: </div>
                          <div className="text-sm text-gray-900 capitalize">
                            Camera focus, connection, consistency
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold ">•
                            Body Language: </div>
                          <div className="text-sm text-gray-900 capitalize">
                            Posture, gestures, expressions
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold ">•
                            Confidence:  </div>
                          <div className="text-sm  text-gray-900 capitalize">
                            Pace, composure, control
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">•
                            Voice Modulation:  </div>
                          <div className="text-sm text-gray-900">
                            Clarity, pitch, emphasis
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">•
                            Pedagogical Approach:   </div>
                          <div className="text-sm text-gray-900">
                            Structure, clarity of outcome, learner focus
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="text-sm font-semibold">•
                            Engagement Skills:
                          </div>
                          <div className="text-sm text-gray-900">
                            Interaction, attention, participation
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Interview Expanded Content */}
            <div
              className="cursor-pointer pb-3"
              onClick={() => setIsInterviewExpanded(!isInterviewExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Interview Rounds</div>
                <div className="transform transition-transform">
                  {isInterviewExpanded ?
                    <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </div>
              </div>
              <div className="text-sm text-gray-900">
                Structured interviews covering teaching skills, behavioral aspects, and cultural fit. </div>
              {isInterviewExpanded && (
                <div className="mt-2 text-sm text-gray-900 py-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="interview" checked />
                    <Label htmlFor="interview">Enabled</Label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}