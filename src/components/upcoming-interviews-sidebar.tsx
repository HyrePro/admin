'use client'

import React from 'react'

interface InterviewSchedule {
  interview_id: string;
  id?: string; // Keep for backward compatibility
  first_name?: string; // Keep for backward compatibility
  last_name?: string; // Keep for backward compatibility
  interview_date: string;
  start_time: string;
  duration_minutes?: number;
  duration?: string;
  status: 'scheduled' | 'completed' | 'overdue';
  interview_type: string;
  meeting_location?: string;
  candidate_response?: 'accepted' | 'declined' | 'pending';
  interviewer_response?: 'accepted' | 'declined' | 'pending';
  meeting_link?: string;
  note: string | null;
  created_at: string;
  candidate: {
    id: string;
    dob: string | null;
    city: string;
    email: string;
    phone: string;
    state: string;
    avatar: string | null;
    gender: string;
    subjects: any[];
    education: any[];
    last_name: string;
    first_name: string;
    resume_url: string;
    teaching_experience: any[];
  };
  job: {
    id: string;
    plan: string;
    title: string;
    status: string;
    openings: number;
    created_by: any;
    hired_count: number;
    hiring_urgency: string;
  };
  organiser: {
    id: string;
    role: string;
    email: string;
    avatar: string;
    last_name: string;
    first_name: string;
  };
  panelists: {
    id: string;
    role: string;
    email: string;
    avatar: string;
    last_name: string;
    first_name: string;
  }[];
  // Legacy fields for backward compatibility
  candidate_email?: string;
  candidate_phone?: string;
  job_title?: string;
  interviewers?: Array<{ id?: string; first_name?: string; last_name?: string; email?: string; avatar?: string; role?: string; name?: string }>;
  organizer?: { id?: string; first_name?: string; last_name?: string; email?: string; avatar?: string; role?: string; name?: string };
  notes?: string;
  // Nested job structure for backward compatibility
  job_object?: {
    id: string;
    title: string;
    status: string;
    hiring_urgency?: string;
    openings: number;
    hired_count: number;
    created_by?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      avatar?: string;
    };
  };
}

const formatTimeRange = (time: string) => {
  const [h, m] = time.split(':')
  return `${h}:${m} - ${(Number(h) + 1).toString().padStart(2, '0')}:${m}`
}

export default function UpcomingInterviewsSidebar({ 
  interviews 
}: { 
  interviews: InterviewSchedule[] 
}) {
  const upcomingInterviews = interviews
    .filter(i => new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
    .slice(0, 8)

  return (
    <div className="w-80 bg-white flex flex-col">
      <div className="p-6 border-b">
        <h3 className="text-base font-semibold text-gray-900">Upcoming Interviews</h3>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {upcomingInterviews.map(interview => {
          const statusColors = {
            scheduled: 'border-l-blue-500',
            completed: 'border-l-green-500',
            overdue: 'border-l-red-500'
          }
          return (
            <div 
              key={interview.id} 
              className={`p-4 bg-white border border-gray-200 border-l-4 ${statusColors[interview.status]} rounded-lg hover:shadow-sm transition-shadow`}
            >
              <div className="font-medium text-gray-900 text-sm mb-1">{interview.job_title}</div>
              <div className="text-xs text-gray-600 mb-2">{interview.first_name || ''} {interview.last_name || ''}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimeRange(interview.start_time)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}