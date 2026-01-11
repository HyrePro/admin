"use client";

import { ChevronDown, ChevronRight, Edit } from "lucide-react";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Mock job data - replace with actual useJob hook
const mockJob = {
  id: "1",
  title: "Math Teacher",
  status: "OPEN",
  subjects: ["Mathematics"],
  grade_levels: ["9-12"],
  number_of_questions: 15,
  assessment_difficulty: {
    interviewFormat: "structured",
    includeInterview: true,
    demoVideoDuration: 10,
    interviewDuration: 45,
    includeSubjectTest: true,
    subjectTestDuration: 30,
    interviewQuestions: []
  },
  application_analytics: {
    total_applications: 45,
    assessment: 30,
    demo: 15,
    interviews: 8,
    offered: 2
  }
};

export default function JobAssessmentPage() {
  const job = mockJob; // Replace with: const { job } = useJob();
  const [isMcqExpanded, setIsMcqExpanded] = useState(true);
  const [isDemoExpanded, setIsDemoExpanded] = useState(false);
  const [isInterviewExpanded, setIsInterviewExpanded] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(job.number_of_questions || 15);
  const [demoDuration, setDemoDuration] = useState(job.assessment_difficulty.demoVideoDuration || 10);

  if (!job) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-full bg-white">
      <div className="mx-auto px-6 py-6">
        {/* Header Section */}
       

        {/* Assessment Stages */}
        <div className="space-y-4">
          {/* MCQ Assessment */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsMcqExpanded(!isMcqExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">1</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">MCQ Assessment</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Multiple-choice test evaluating subject knowledge and pedagogy
                  </p>
                </div>
              </div>
              {isMcqExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isMcqExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Number of Questions Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Number of Questions</label>
                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded">
                        {numberOfQuestions}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>30</span>
                    </div>
                  </div>

                  {/* Test Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {job.assessment_difficulty.subjectTestDuration} minutes
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Total Questions</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {numberOfQuestions}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo Assessment */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsDemoExpanded(!isDemoExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">2</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">Demo Assessment</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Teaching demonstration video showcasing pedagogical skills
                  </p>
                </div>
              </div>
              {isDemoExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isDemoExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="demo-enabled" 
                      checked={job.assessment_difficulty.includeSubjectTest}
                    />
                    <Label htmlFor="demo-enabled" className="text-sm text-gray-700 cursor-pointer">
                      Enable demo assessment stage
                    </Label>
                  </div>

                  {/* Demo Duration Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Video Duration</label>
                      <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded">
                        {demoDuration} min
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      step="1"
                      value={demoDuration}
                      onChange={(e) => setDemoDuration(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>5 min</span>
                      <span>10 min</span>
                      <span>15 min</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Candidate Instructions</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Record a {demoDuration}-minute teaching demonstration presenting a topic of your choice. 
                      Your video should showcase clear explanation, student engagement techniques, and effective 
                      use of teaching aids. Include a brief lesson plan outline with your submission.
                    </p>
                  </div>

                  {/* Evaluation Criteria */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2.5">Evaluation Criteria</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Subject Knowledge',
                        'Language Fluency',
                        'Grammar & Structure',
                        'Eye Contact',
                        'Body Language',
                        'Confidence',
                        'Voice Modulation',
                        'Pedagogical Approach',
                        'Engagement Skills'
                      ].map((criterion) => (
                        <div key={criterion} className="bg-gray-50 rounded px-2.5 py-1.5">
                          <p className="text-xs text-gray-700">{criterion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interview Rounds */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsInterviewExpanded(!isInterviewExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-xs">3</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">Interview Rounds</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Structured interviews covering teaching philosophy and experience
                  </p>
                </div>
              </div>
              {isInterviewExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isInterviewExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="interview-enabled" 
                      checked={job.assessment_difficulty.includeInterview}
                    />
                    <Label htmlFor="interview-enabled" className="text-sm text-gray-700 cursor-pointer">
                      Enable interview rounds
                    </Label>
                  </div>

                  {/* Interview Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {job.assessment_difficulty.interviewDuration} minutes
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-600">Format</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                        {job.assessment_difficulty.interviewFormat}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}