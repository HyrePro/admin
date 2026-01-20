"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useApplication } from "./layout";
import type { CandidateInfo } from "@/lib/supabase/api/get-job-application";

// Dynamically import the CandidateInfo component
const CandidateInfoComponent = dynamic(() => import("@/components/candidate-info").then(mod => mod.CandidateInfo), {
  ssr: false,
  loading: () => <LoadingSkeleton />
});

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Personal Information Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-5">
          <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationInfoPage() {
  const { candidateInfo, loading } = useApplication();
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!candidateInfo) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No candidate information available</h3>
          <p className="text-sm text-gray-500">Unable to load candidate details at this time.</p>
        </div>
      </div>
    );
  }

  // Dummy activity data
  const activities = [
    {
      id: 1,
      type: "status_change",
      title: "Status Changed",
      description: "Application status changed to AI Recommendation Completed",
      user: "System",
      timestamp: "2 hours ago",
      icon: "check"
    },
    {
      id: 2,
      type: "note",
      title: "Note Added",
      description: "Strong candidate with excellent teaching background in mathematics.",
      user: "Amanda Nur",
      timestamp: "5 hours ago",
      icon: "note"
    },
    {
      id: 3,
      type: "assessment",
      title: "Assessment Completed",
      description: "Candidate completed the MCQ assessment with a score of 85%",
      user: "System",
      timestamp: "1 day ago",
      icon: "assessment"
    },
    {
      id: 4,
      type: "video",
      title: "Video Assessment Submitted",
      description: "Demo video submitted and ready for review",
      user: "System",
      timestamp: "2 days ago",
      icon: "video"
    },
    {
      id: 5,
      type: "application",
      title: "Application Submitted",
      description: "Candidate submitted their application",
      user: "System",
      timestamp: "3 days ago",
      icon: "application"
    }
  ];

  return (
    <div className="flex gap-6 px-6 py-6">
     

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mx-auto">
        <div className="space-y-4">

          {/* Subjects Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Subjects</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {candidateInfo.subjects && candidateInfo.subjects.length > 0 ? (
                  candidateInfo.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No subjects specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Education</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {candidateInfo.education_qualifications && candidateInfo.education_qualifications.length > 0 ? (
                  candidateInfo.education_qualifications.map((edu, index) => (
                    <div key={index} className="relative">
                      {index !== candidateInfo.education_qualifications.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <p className="text-sm font-medium text-gray-900">{edu.degree}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{edu.institution}</p>
                          {edu.specialization && (
                            <p className="text-xs text-gray-500 mt-0.5">{edu.specialization}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {edu.startDate} - {edu.endDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No education information available</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Experience Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Work Experience</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {candidateInfo.teaching_experience && candidateInfo.teaching_experience.length > 0 ? (
                  candidateInfo.teaching_experience.map((exp, index) => (
                    <div key={index} className="relative">
                      {index !== candidateInfo.teaching_experience.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <p className="text-sm font-medium text-gray-900">{exp.designation}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{exp.school}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{exp.city}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {exp.startDate} - {exp.endDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No work experience available</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Resume Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
            </div>
            <div className="p-4">
              {candidateInfo.resume_url ? (
                <a
                  href={candidateInfo.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {candidateInfo.resume_file_name || 'Resume.pdf'}
                    </p>
                    <p className="text-xs text-gray-500">Click to view</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="text-sm text-gray-500">No resume uploaded</p>
              )}
            </div>
          </div>

         
        </div>
         {/* Activity Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
              <button
                onClick={() => setIsNotesDialogOpen(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                + Add Note
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="relative">
                      {index !== activities.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                      )}
                      
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.type === "status_change" ? "bg-green-100" :
                            activity.type === "note" ? "bg-blue-100" :
                            activity.type === "assessment" ? "bg-purple-100" :
                            activity.type === "video" ? "bg-orange-100" :
                            "bg-gray-100"
                          }`}>
                            {activity.icon === "check" && (
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {activity.icon === "note" && (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                            {activity.icon === "assessment" && (
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {activity.icon === "video" && (
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            {activity.icon === "application" && (
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{activity.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                          <p className="text-xs text-gray-500">by {activity.user}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>

     
    </div>
  );
}