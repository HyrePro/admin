'use client'

import React, { useState, useEffect, useRef } from 'react'

type ResponseState = 'accepted' | 'declined' | 'pending'
type ViewMode = 'month' | 'week' | 'day'

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

export const mockInterviews: InterviewSchedule[] = [
  {
    interview_id: '1',
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    candidate_email: 'sarah.j@email.com',
    job_title: 'Senior Software Engineer',
    interview_date: '2026-01-13',
    start_time: '10:00',
    status: 'scheduled',
    interview_type: 'technical',
    candidate_response: 'accepted',
    interviewer_response: 'accepted',
    interviewers: [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@company.com', avatar: 'JS', role: 'admin' },
      { first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@company.com', avatar: 'JD', role: 'External' }
    ],
    note: null,
    created_at: new Date().toISOString(),
    candidate: {
      id: 'candidate1',
      dob: null,
      city: 'New York',
      email: 'sarah.j@email.com',
      phone: '+1234567890',
      state: 'NY',
      avatar: null,
      gender: 'Female',
      subjects: [],
      education: [],
      last_name: 'Johnson',
      first_name: 'Sarah',
      resume_url: '',
      teaching_experience: []
    },
    job: {
      id: 'job1',
      plan: 'premium',
      title: 'Senior Software Engineer',
      status: 'open',
      openings: 1,
      created_by: {},
      hired_count: 0,
      hiring_urgency: 'normal'
    },
    organiser: {
      id: 'org1',
      role: 'admin',
      email: 'organizer@company.com',
      avatar: 'OR',
      last_name: 'Organizer',
      first_name: 'John'
    },
    panelists: [
      {
        id: 'panel1',
        role: 'admin',
        email: 'john.smith@company.com',
        avatar: 'JS',
        last_name: 'Smith',
        first_name: 'John'
      }
    ]
  }
]

/* ---------- constants ---------- */
const VISIBLE_HOURS = 8
const HOUR_HEIGHT = 80
const VISIBLE_HEIGHT = VISIBLE_HOURS * HOUR_HEIGHT

/* ---------- helpers ---------- */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const formatTime = (time: string) => {
  const [h, m] = time.split(':')
  const hour = Number(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

const formatTimeRange = (time: string) => {
  const [h, m] = time.split(':')
  return `${h}:${m} - ${(Number(h) + 1).toString().padStart(2, '0')}:${m}`
}

const formatDate = (date: Date, formatStr: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  if (formatStr === 'MMMM yyyy') return `${months[date.getMonth()]} ${date.getFullYear()}`
  if (formatStr === 'MMMM d, yyyy') return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  if (formatStr === 'd') return date.getDate().toString()
  if (formatStr === 'EEE') return shortDays[date.getDay()]
  if (formatStr === 'EEEE') return days[date.getDay()]
  return date.toDateString()
}

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const days = []
  
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  return { days, firstDay }
}

const getWeekDays = (date: Date) => {
  const curr = new Date(date)
  const first = curr.getDate() - curr.getDay()
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr)
    d.setDate(first + i)
    days.push(d)
  }
  
  return days
}



const InterviewPopover = ({ interview, position, onClose }: { interview: InterviewSchedule; position: { x: number; y: number }; onClose: () => void }) => {
  return (
    <div
      className="fixed z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseLeave={onClose}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">INTERVIEW</div>
            <div className="text-xl font-semibold text-gray-900 mb-1">
              {formatTime(interview.start_time)} - {formatTime(`${Number(interview.start_time.split(':')[0]) + 1}:00`)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                  {(interview.first_name?.[0] || '')}{(interview.last_name?.[0] || '')}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{interview.first_name || ''} {interview.last_name || ''}</div>
                  <div className="text-xs text-gray-500">Candidate</div>
                </div>
              </div>
              {interview.interviewers?.map((interviewer, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                    {interviewer.avatar ? (
                      <img src={interviewer.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (interviewer.role === 'admin' || interviewer.role === 'External') && (interviewer.first_name || interviewer.last_name)
                        ? `${(interviewer.first_name || '').charAt(0)}${(interviewer.last_name || '').charAt(0)}`
                        : (interviewer.email ? interviewer.email.charAt(0) : '?')
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{(interviewer.role === 'admin' || interviewer.role === 'External') && (interviewer.first_name || interviewer.last_name) ? `${interviewer.first_name || ''} ${interviewer.last_name || ''}`.trim() : interviewer.email || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{interviewer.role || 'Interviewer'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {interview.meeting_link && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <a href={interview.meeting_link} className="text-sm text-blue-600 hover:text-blue-700 truncate block">
                  {interview.meeting_link}
                </a>
              </div>
            </div>
          )}

          {interview.notes && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-700 flex-1 min-w-0">{interview.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const getStatusColors = (status: string) => {
  const colors: Record<string, { bg: string; border: string; hover: string }> = {
    scheduled: {
      bg: '#FFEDD5',
      border: '#FDBA74',
      hover: '#FED7AA'
    },
    completed: {
      bg: '#DCFCE7',
      border: '#86EFAC',
      hover: '#BBF7D0'
    },
    overdue: {
      bg: '#FEE2E2',
      border: '#FCA5A5',
      hover: '#FECACA'
    }
  };
  return colors[status] || colors.scheduled;
};

const InterviewCard = ({ interview, compact = false, onInterviewClick }: { interview: InterviewSchedule; compact?: boolean; onInterviewClick?: (interview: InterviewSchedule) => void }) => {
  const [showPopover, setShowPopover] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })
  const colors = getStatusColors(interview.status);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverPosition({ x: rect.left, y: rect.bottom + 8 })
    setShowPopover(true)
  }

  const handleClick = () => {
    if (onInterviewClick) {
      onInterviewClick(interview);
    }
  }

  if (compact) {
    return (
      <>
        <div
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowPopover(false)}
          className="text-xs p-1.5 rounded cursor-pointer transition-colors min-w-0"
          style={{
            borderLeft: `2px solid ${colors.border}`
          }}
        >
          <div className="font-medium text-gray-900 truncate">{interview.first_name} {interview.last_name}</div>
          <div className="text-gray-600 truncate">{formatTimeRange(interview.start_time)}</div>
        </div>
        {showPopover && <InterviewPopover interview={interview} position={popoverPosition} onClose={() => setShowPopover(false)} />}
      </>
    )
  }

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowPopover(false)}
        className="p-3 rounded-lg cursor-pointer transition-colors min-w-0"
        style={{
          borderLeft: `4px solid ${colors.border}`
        }}
      >
        <div className="text-sm font-medium text-gray-900 mb-1 truncate">{formatTime(interview.start_time)}</div>
        <div className="font-semibold text-gray-900 mb-1 truncate">{interview.first_name} {interview.last_name}</div>
        <div className="text-sm text-gray-600 truncate">{interview.job_title}</div>
      </div>
      {showPopover && <InterviewPopover interview={interview} position={popoverPosition} onClose={() => setShowPopover(false)} />}
    </>
  )
}

export default function InterviewSchedulePage({ 
  interviews = mockInterviews, 
  view: externalView, 
  setView: setExternalViewCallback, 
  currentDate: externalCurrentDate, 
  setCurrentDate: setExternalDateCallback,
  onInterviewClick
}: { 
  interviews?: InterviewSchedule[]; 
  view?: 'day' | 'week' | 'month'; 
  setView?: (view: 'day' | 'week' | 'month') => void; 
  currentDate?: Date; 
  setCurrentDate?: (date: Date) => void; 
  onInterviewClick?: (interview: InterviewSchedule) => void;
}) {
  const [localCurrentDate, setLocalCurrentDate] = useState(new Date())
  const [localViewMode, setLocalViewMode] = useState<ViewMode>('month')
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  
  // Use external state if provided, otherwise use local state
  const effectiveCurrentDate = externalCurrentDate || localCurrentDate;
  const effectiveViewMode = externalView || localViewMode;
  
  // Use external setters if provided, otherwise use local setters
  const handleSetCurrentDate = setExternalDateCallback || setLocalCurrentDate;
  const handleSetViewMode = setExternalViewCallback || setLocalViewMode;
  
  // Debug logging
  console.log('InterviewSchedulePage - state management:', {
    hasExternalView: !!externalView,
    hasExternalCurrentDate: !!externalCurrentDate,
    effectiveViewMode,
    effectiveCurrentDate,
    interviewsCount: interviews?.length
  });
  
  // Track when view or date changes
  useEffect(() => {
    console.log('InterviewSchedulePage - effectiveViewMode changed:', effectiveViewMode);
  }, [effectiveViewMode]);
  
  useEffect(() => {
    console.log('InterviewSchedulePage - effectiveCurrentDate changed:', effectiveCurrentDate);
  }, [effectiveCurrentDate]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  
  const weekRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(i)
  }, [])
  
  /* ---------- FIXED TIMELINE LOGIC ---------- */
  const getIndicatorTop = () => {
    const h = currentTime.getHours()
    const m = currentTime.getMinutes()
    return (h + m / 60) * HOUR_HEIGHT
  }

  useEffect(() => {
    if (effectiveViewMode === 'month') return
    const ref = effectiveViewMode === 'week' ? weekRef.current : dayRef.current
    if (!ref) return

    // Delay to ensure DOM is ready
    setTimeout(() => {
      const top = getIndicatorTop()
      ref.scrollTop = Math.max(0, top - VISIBLE_HEIGHT / 2)
    }, 100)
  }, [effectiveViewMode, effectiveCurrentDate])
  
  // Scroll to current time on initial load
  useEffect(() => {
    if (effectiveViewMode === 'month') return
    const ref = effectiveViewMode === 'week' ? weekRef.current : dayRef.current
    if (!ref) return

    const top = getIndicatorTop()
    ref.scrollTop = Math.max(0, top - VISIBLE_HEIGHT / 2)
  }, [])
  
  const isTodayDate = (date: Date) => isSameDay(date, currentTime)
  const isToday = (date: Date) => isSameDay(date, currentTime)

  const { days, firstDay } = getDaysInMonth(effectiveCurrentDate)
  const weekDays = getWeekDays(effectiveCurrentDate)

  const getInterviewsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    return interviews.filter(i => i.interview_date === dateString)
  }

  const previousPeriod = () => {
    const newDate = new Date(effectiveCurrentDate)
    if (effectiveViewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (effectiveViewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    handleSetCurrentDate(newDate)
    if (setExternalDateCallback) setExternalDateCallback(newDate)
  }

  const nextPeriod = () => {
    const newDate = new Date(effectiveCurrentDate)
    if (effectiveViewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (effectiveViewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    handleSetCurrentDate(newDate)
    if (setExternalDateCallback) setExternalDateCallback(newDate)
  }

  const getHeaderText = () => {
    if (effectiveViewMode === 'month') return formatDate(effectiveCurrentDate, 'MMMM yyyy')
    if (effectiveViewMode === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      return `${formatDate(start, 'MMMM d, yyyy')} - ${formatDate(end, 'MMMM d, yyyy')}`
    }
    return formatDate(effectiveCurrentDate, 'MMMM d, yyyy')
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

  return (
    <div className="h-full flex flex-col bg-white border-r-1" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex-1 px-4 py-2 overflow-hidden flex flex-col" style={{ backgroundColor: '#ffffff' }}>
        <div className="mb-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">{getHeaderText()}</h2>
          <div className="flex items-center gap-4">
           
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowViewDropdown(!showViewDropdown)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  {effectiveViewMode === 'month' ? 'Month' : effectiveViewMode === 'week' ? 'Week' : 'Day'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showViewDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
                    <button onClick={() => { 
                      handleSetViewMode('month'); 
                      setShowViewDropdown(false);
                      if (setExternalViewCallback) setExternalViewCallback('month');
                    }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-t-lg">Month</button>
                    <button onClick={() => { 
                      handleSetViewMode('week'); 
                      setShowViewDropdown(false);
                      if (setExternalViewCallback) setExternalViewCallback('week');
                    }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50">Week</button>
                    <button onClick={() => { 
                      handleSetViewMode('day'); 
                      setShowViewDropdown(false);
                      if (setExternalViewCallback) setExternalViewCallback('day');
                    }} className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-b-lg">Day</button>
                  </div>
                )}
              </div>
              <button onClick={previousPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">{effectiveViewMode === 'month' && (
          <div className="border border-gray-200 rounded-xl overflow-auto max-h-[calc(100vh-200px)]">
            <div className="grid grid-cols-7 bg-white border-b border-gray-200" style={{ backgroundColor: '#ffffff' }}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 min-h-max">
              {Array.from({ length: firstDay.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-32 bg-white border-r border-b border-gray-200" style={{ backgroundColor: '#ffffff' }}></div>
              ))}
              {days.map(day => {
                const dayInterviews = getInterviewsForDate(day)
                return (
                  <div key={day.toISOString()} className="min-h-32 p-2 border-r border-b border-gray-200 hover:bg-gray-50 bg-white" style={{ backgroundColor: '#ffffff' }}>
                    <div className={`text-sm font-semibold mb-2 ${isToday(day) ? 'inline-flex w-7 h-7 items-center justify-center bg-blue-600 text-white rounded-full' : 'text-gray-700'}`}>
                      {formatDate(day, 'd')}
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {dayInterviews.map(interview => (
                        <InterviewCard key={interview.id} interview={interview} compact onInterviewClick={onInterviewClick} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {effectiveViewMode === 'week' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex bg-white border-b border-gray-200 sticky top-0 z-30" style={{ backgroundColor: '#ffffff' }}>
              <div className="w-16 px-2 py-3 text-sm font-semibold text-gray-700 border-r flex-shrink-0">Time</div>
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="px-2 py-3 text-center border-r last:border-r-0">
                    <div className="text-xs text-gray-500">{formatDate(day, 'EEE')}</div>
                    <div className={`text-sm font-semibold mt-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>{formatDate(day, 'd')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div 
              ref={weekRef}
              className="relative overflow-auto"
              style={{ height: VISIBLE_HEIGHT }}
            >
              {weekDays.some(day => isTodayDate(day)) && (
                <div 
                  className="absolute h-0.5 bg-red-500 z-40 pointer-events-none"
                  style={{ 
                    top: `${getIndicatorTop()}px`,
                    left: '4rem',
                    right: '0'
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
              )}
              {timeSlots.map(time => (
                <div key={time} className="flex" style={{ height: HOUR_HEIGHT }}>
                  <div className="w-16 px-2 py-3 text-xs text-gray-500 border-r border-b bg-white flex-shrink-0" style={{ backgroundColor: '#ffffff' }} >{time}</div>
                  <div className="flex-1 grid grid-cols-7">
                    {weekDays.map(day => {
                      const dayInterviews = getInterviewsForDate(day).filter(i => i.start_time.startsWith(time.split(':')[0]))
                      return (
                        <div key={`${day.toISOString()}-${time}`} className="p-2 border-r border-b bg-white min-h-[80px]" style={{ backgroundColor: '#ffffff' }}>
                          <div className="space-y-1">
                            {dayInterviews.map(interview => (
                              <InterviewCard key={interview.id} interview={interview} onInterviewClick={onInterviewClick} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {effectiveViewMode === 'day' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-white border-b p-4 text-center sticky top-0 z-30" style={{ backgroundColor: '#ffffff' }}>
              <div className="text-sm text-gray-500">{formatDate(effectiveCurrentDate, 'EEEE')}</div>
              <div className={`text-2xl font-semibold mt-1 ${isToday(effectiveCurrentDate) ? 'text-blue-600' : 'text-gray-900'}`}>{formatDate(effectiveCurrentDate, 'd')}</div>
            </div>
            <div 
              ref={dayRef}
              className="relative overflow-auto"
              style={{ height: VISIBLE_HEIGHT }}
            >
              {isTodayDate(effectiveCurrentDate) && (
                <div 
                  className="absolute h-0.5 bg-red-500 z-40 pointer-events-none"
                  style={{ 
                    top: `${getIndicatorTop()}px`,
                    left: '6rem',
                    right: '0'
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
              )}
              {timeSlots.map(time => {
                const timeInterviews = getInterviewsForDate(effectiveCurrentDate).filter(i => i.start_time.startsWith(time.split(':')[0]))
                return (
                  <div key={time} className="flex border-b" style={{ height: HOUR_HEIGHT }}>
                    <div className="w-24 px-4 py-3 text-xs text-gray-500 border-r bg-white flex-shrink-0" style={{ backgroundColor: '#ffffff' }}>{time}</div>
                    <div className="flex-1 p-3 bg-white min-h-[80px]" style={{ backgroundColor: '#ffffff' }}>
                      <div className="space-y-2">
                        {timeInterviews.map(interview => (
                          <InterviewCard key={interview.id} interview={interview} onInterviewClick={onInterviewClick} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}