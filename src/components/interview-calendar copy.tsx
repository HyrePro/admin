'use client'

import React, { useEffect, useState } from 'react'
import { getInterviewSchedule } from '@/lib/supabase/api/get-interview-schedule'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/api/client'
import { format } from 'date-fns'
import { Calendar, Clock, AlertTriangle, Check, User, CheckCircle, XCircle, Clock as ClockIcon, GlobeLock, Briefcase } from 'lucide-react'

type ResponseState = 'accepted' | 'declined' | 'pending'

interface InterviewSchedule {
  id: string
  first_name: string
  last_name: string
  candidate_email?: string
  job_title: string

  interview_date: string
  start_time: string
  duration?: string

  status: 'scheduled' | 'completed' | 'overdue'
  interview_type: string

  candidate_response?: ResponseState
  interviewer_response?: ResponseState
  
  // Interviewer information
  interviewers?: {
    name: string;
    response: ResponseState;
  }[];
}

const ResponseBadge = ({ state = 'pending' }: { state?: ResponseState }) => {
  const map = {
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    declined: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded ${map[state]}`}>
      {state.toUpperCase()}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<
    string,
    { bg: string; text: string; dot: string }
  > = {
    scheduled: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      dot: 'bg-purple-500',
    },
    completed: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
    },
    overdue: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      dot: 'bg-red-500',
    },
  }

  const c = config[status] || config.overdue

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}


const StatusIndicator = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    scheduled: 'bg-indigo-500',
    completed: 'bg-emerald-500',
    overdue: 'bg-red-500',
  }

  return (
    <div
      className={`w-[2px] self-stretch ${colorMap[status] || 'bg-red-300'}`}
    />
  )
}


const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })

const formatTimeRange = (time: string, duration: string = '60') => {
  const [h, m] = time.split(':')
  const start = new Date()
  start.setHours(Number(h), Number(m))
  
  const durationMinutes = parseInt(duration);
  const end = new Date(start)
  end.setMinutes(start.getMinutes() + durationMinutes)

  const f = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return `${f(start)} – ${f(end)}`
}

const InterviewerBadge = ({ name, response }: { name: string; response: ResponseState }) => {
  const responseConfig = {
    accepted: { 
      bgClass: 'bg-green-100', 
      textClass: 'text-green-800', 
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    },
    declined: { 
      bgClass: 'bg-red-100', 
      textClass: 'text-red-800', 
      icon: <XCircle className="w-4 h-4 text-red-600" />
    },
    pending: { 
      bgClass: 'bg-yellow-100', 
      textClass: 'text-yellow-800', 
      icon: <ClockIcon className="w-4 h-4 text-yellow-600" />
    },
  }

  const config = responseConfig[response];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-medium">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm font-medium">{name}</span>
      <span className={`${config.bgClass} ${config.textClass} p-1 rounded-full`}>
        {config.icon}
      </span>
    </div>
  )
}

const formatDateTime = (dateString: string, timeString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const date = new Date(year, month - 1, day, hours, minutes);
  return date;
};

const formatDateHeader = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, 'EEEE, MMMM d, yyyy'); // e.g., "Monday, January 1, 2023"
};

export default function InterviewScheduleList() {
  const { schoolId, user } = useAuthStore()
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) return

    const fetchData = async () => {
      setLoading(true)
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 30)
      const end = new Date(today)
      end.setDate(today.getDate() + 60)

      const res = await getInterviewSchedule(
        schoolId,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        1,
        user?.id,
        null
      )

      if (res?.data) setInterviews(res.data as unknown as InterviewSchedule[])
      setLoading(false)
    }

    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel('interview_schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_schedule',
          filter: `school_id=eq.${schoolId}`,
        },
        fetchData
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schoolId, user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        Loading interviews…
      </div>
    )
  }

  // Group interviews by date
  const groupedInterviews = interviews.reduce((acc, interview) => {
    if (!acc[interview.interview_date]) {
      acc[interview.interview_date] = [];
    }
    acc[interview.interview_date].push(interview);
    return acc;
  }, {} as Record<string, InterviewSchedule[]>);

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedInterviews).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  return (
  <div className="h-[600px] overflow-y-auto px-4">
    <div className="space-y-3">
      {sortedDates.map((date) => {
        const interviewsForDate = groupedInterviews[date]

        return (
          <div key={date} className="space-y-3">
            <div className="flex flex-col lg:flex-row">
              {/* DATE COLUMN */}
              <div className="relative lg:w-[110px] flex justify-center">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-300" />

                <div className="sticky top-0 self-start z-10">
                  <div className="w-[88px] rounded-xl overflow-hidden border bg-white">
                    <div className="bg-slate-100 text-center py-1 border-b border-slate-300">
                      <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                        {format(new Date(date), 'MMM')}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-3">
                      <span className="text-3xl font-bold text-slate-900 leading-none">
                        {format(new Date(date), 'd')}
                      </span>
                      <span className="mt-1 text-[11px] font-medium text-slate-600 uppercase tracking-wide">
                        {format(new Date(date), 'EEE')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:w-4" />

              {/* INTERVIEWS */}
              <div className="flex-1 lg:pl-4 space-y-3">
                {interviewsForDate.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex bg-white border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <StatusIndicator status={interview.status} />

                    <div className="flex-1 p-4 sm:p-5 space-y-4">
                      {/* TOP ROW */}
                      <div className="flex items-start justify-between gap-6">
                        {/* LEFT GROUP */}
                        <div className="flex flex-wrap lg:flex-nowrap gap-6 flex-1">
                          {/* TIME + STATUS */}
                          <div className="flex-shrink-0 w-[400px]">
                            <div className="flex items-center gap-3 pb-3">
                              <span className="text-sm font-bold text-slate-900">
                                {formatTimeRange(
                                  interview.start_time,
                                  interview.duration || '60'
                                )}
                              </span>
                              <StatusBadge status={interview.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm pt-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">Type:</span>
                                <span className="font-medium text-slate-900">
                                  {interview.interview_type.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GlobeLock className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-900">
                                  GMT+5:30 (IST)
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-900">
                                  {interview.duration || '60'} min
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 pt-3">
                              <p className="text-xs text-slate-500">Interviewers:</p>
                              <div className="flex flex-wrap gap-2">
                                {interview.interviewers?.length ? (
                                  interview.interviewers.map((i, idx) => (
                                    <InterviewerBadge
                                      key={idx}
                                      name={i.name}
                                      response={i.response}
                                    />
                                  ))
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    No interviewers assigned
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden lg:block w-px bg-slate-200" />

                          {/* CANDIDATE */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
                                {`${interview.first_name[0]}${interview.last_name[0]}`}
                              </div>
                              <p className="font-medium text-slate-900">
                                {interview.first_name} {interview.last_name}
                              </p>
                            </div>

                            <p className="text-sm text-slate-600">
                              {interview.candidate_email}
                            </p>

                            <div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-500">
                                  Applied Job:
                                </span>
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {interview.job_title}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: ACTIONS */}
                        <div className="flex gap-2 shrink-0">
                          {interview.status === 'scheduled' && (
                            <>
                              <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                Start Meeting
                              </button>
                              <button className="p-2 border rounded hover:bg-slate-50">
                                ⋮
                              </button>
                            </>
                          )}

                          {interview.status === 'completed' && (
                            <>
                              <button className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                Take Action
                              </button>
                              <button className="p-2 border rounded hover:bg-slate-50">
                                ⋮
                              </button>
                            </>
                          )}

                          {interview.status === 'overdue' && (
                            <>
                              <button className="px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded hover:bg-red-50">
                                Reschedule
                              </button>
                              <button className="p-2 border rounded hover:bg-slate-50">
                                ⋮
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

}
