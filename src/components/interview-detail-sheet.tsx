'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Mail, Phone, MapPin, Users, X, ChevronLeft, ChevronRight, MoreVertical, Plus, FileText, MessageSquare, Calendar, GlobeLock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UpdateStatusDialog from '@/components/update-status-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Candidate {
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
}

interface Job {
  id: string;
  plan: string;
  title: string;
  status: string;
  openings: number;
  created_by: any;
  hired_count: number;
  hiring_urgency: string;
}

interface Organiser {
  id: string;
  role: string;
  email: string;
  avatar: string;
  last_name: string;
  first_name: string;
}

interface Panelist {
  id: string;
  role: string;
  email: string;
  avatar: string;
  last_name: string;
  first_name: string;
}

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
  candidate: Candidate;
  job: Job;
  organiser: Organiser;
  panelists: Panelist[];
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

interface InterviewDetailSheetProps {
  interview?: InterviewSchedule;
  isOpen: boolean;
  onClose: () => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    scheduled: {
      bg: '#FFEDD5',
      text: '#9A3412',
      dot: '#FDBA74',
    },
    completed: {
      bg: '#DCFCE7',
      text: '#166534',
      dot: '#86EFAC',
    },
    overdue: {
      bg: '#FEE2E2',
      text: '#991B1B',
      dot: '#FCA5A5',
    },
    open: {
      bg: '#DCFCE7',
      text: '#166534',
      dot: '#86EFAC',
    },
    paused: {
      bg: '#FFE4B5',
      text: '#C05621',
      dot: '#FFB74D',
    },
  };

  const c = config[status.toLowerCase()] || config.overdue;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.text
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const JobStatusBadge = ({ status, type }: { status: string, type: 'job-status' | 'hiring-urgency' }) => {
  // Less prominent styling for job-related statuses
  const baseConfig: Record<string, { bg: string; text: string }> = {
    'job-status': {
      bg: '#F3F4F6',
      text: '#4B5563',
    },
    'hiring-urgency': {
      bg: '#FEF2F2',
      text: '#DC2626',
    },
  };

  // More prominent status-specific styling
  const statusConfig: Record<string, { bg: string; text: string }> = {
    open: {
      bg: '#DCFCE7',
      text: '#166534',
    },
    paused: {
      bg: '#FFE4B5',
      text: '#C05621',
    },
    completed: {
      bg: '#DCFCE7',
      text: '#166534',
    },
  };

  // Use status-specific colors if available, otherwise use base config
  const c = statusConfig[status.toLowerCase()] || baseConfig[type];

  if (!status) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.text
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const InterviewDetailSheet = ({ interview, isOpen, onClose }: InterviewDetailSheetProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'rubrics' | 'debug'>('details');
  const [showRawJson, setShowRawJson] = useState(false);
  const [rubrics, setRubrics] = useState<Array<{
    id: string;
    school_id: string;
    name: string;
    description: string;
    type: string;
    out_of: number;
    criterion_id: string;
  }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  // Parse interview data for display
  const parseInterviewData = () => {
    if (!interview) {
      // Return empty/default data when no interview is provided
      return {
        fullName: '',
        dateStr: '',
        timeStr: '',
        duration: '',
        status: '',
        candidate: {
          name: '',
          email: '',
          phone: '',
          id: ''
        },
        job: {
          title: '',
          id: '',
          hiring_urgency: '',
          stage: 'Shortlist',
          endDate: '20 Oct, 2025'
        },
        interviewers: [],
        organizer: null,
        location: '',
        note: '',
        gmtOffset: 'GMT+5:30'
      };
    }

    // Handle new data structure from terminal output
    let fullName = '';
    if (interview.first_name && interview.last_name) {
      // Legacy structure
      fullName = `${interview.first_name} ${interview.last_name}`;
    } else if (interview.candidate) {
      // New structure from terminal
      fullName = `${interview.candidate.first_name} ${interview.candidate.last_name}`;
    }

    const interviewDate = new Date(interview.interview_date);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dateStr = `${dayNames[interviewDate.getDay()]} ${interviewDate.getDate()}`;

    // Parse time
    const [hours, minutes] = interview.start_time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const endTimeHours = (hours + 1) % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} - ${endTimeHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Duration - handle both formats
    let duration = '1 hour';
    if (interview.duration_minutes !== undefined) {
      duration = `${interview.duration_minutes} minutes`;
    } else if (interview.duration) {
      duration = `${interview.duration} minutes`;
    }

    return {
      fullName,
      dateStr,
      timeStr,
      duration,
      status: interview.status.replace('_', ' '),
      candidate: {
        name: fullName,
        email: interview.candidate?.email || interview.candidate_email || '',
        phone: interview.candidate?.phone || interview.candidate_phone || '',
        id: interview.candidate?.id || interview.id || ''
      },
      job: {
        title: interview.job?.title || interview.job_title || '',
        id: interview.job?.id || interview.id || '',
        hiring_urgency: interview.job?.hiring_urgency || interview.job_object?.hiring_urgency || '',
        stage: 'Shortlist',
        endDate: '20 Oct, 2025',
        status: interview.job?.status || interview.job_object?.status || '',
        hired_count: interview.job?.hired_count || interview.job_object?.hired_count || 0,
        openings: interview.job?.openings || interview.job_object?.openings || 1,
        created_by: interview.job?.created_by || interview.job_object?.created_by
      },
      // Handle both old and new interviewer structures
      interviewers: (interview.panelists || interview.interviewers)?.map((interviewer: any) => ({
        ...interviewer,
        name: interviewer.name || `${interviewer.first_name || ''} ${interviewer.last_name || ''}`.trim() || interviewer.email || 'Unknown',
        role: interviewer.role || 'Interviewer'
      })) || [],
      // Handle both old and new organizer structures
      organizer: (interview.organiser || interview.organizer) ? {
        ...interview.organiser || interview.organizer,
        name: `${(interview.organiser || interview.organizer)?.first_name || ''} ${(interview.organiser || interview.organizer)?.last_name || ''}`.trim() || (interview.organiser || interview.organizer)?.email || 'Unknown',
        role: (interview.organiser || interview.organizer)?.role || 'Organiser'
      } : null,
      location: interview.meeting_location || interview.meeting_link || 'https://meeting.example.com/room/abc123',
      note: interview.note || interview.notes || '',
      gmtOffset: 'GMT+5:30'
    };
  };

  const parsedData = parseInterviewData();

  // Fetch rubrics when rubrics tab is activated
  useEffect(() => {
    if (activeTab === 'rubrics' && rubrics === null) {
      fetchRubrics();
    }
  }, [activeTab]);

  const fetchRubrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/interview-rubrics');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rubrics');
      }

      setRubrics(data.rubrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rubrics');
      setRubrics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = () => {
    setShowUpdateStatusDialog(true);
  };

  const handleStatusUpdate = (status: 'completed' | 'rescheduled' | 'cancelled') => {
    // Here you would typically update the interview status via an API call
    console.log(`Updating interview status to: ${status}`);

    // Close the dialog and the main sheet
    setShowUpdateStatusDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-h-[95vh] overflow-hidden p-0 w-full max-w-[98vw] sm:max-w-[90vw] lg:max-w-2xl"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('[data-autocomplete-dropdown]')) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Interview Detail
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span>{parsedData.dateStr}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-lg text-gray-900">{parsedData.timeStr}</div>
                  <StatusBadge status={interview?.status || ''} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm pt-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Type:</span>
                    <span className="font-medium text-gray-900">
                      {(interview?.interview_type || '').charAt(0).toUpperCase() + (interview?.interview_type || '').slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GlobeLock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {parsedData.gmtOffset}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {parsedData.duration}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => window.open(`/jobs/${parsedData.job.id}`, '_blank')}>
                      View Job Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/jobs/${parsedData.job.id}/${parsedData.candidate.id}`, '_blank')}>
                      View Candidate Information
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {interview?.status === 'overdue' ? (
                  <Button
                    variant="outline"
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 font-medium"
                  >
                    Update Status
                  </Button>
                ) : (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Start Meeting
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 border-b border-gray-100 flex gap-6">
            <button
              className={`pb-3 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('details')}
            >
              Detailed Information
            </button>
            <button
              className={`pb-3 text-sm font-medium ${activeTab === 'rubrics' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('rubrics')}
            >
              Interview Rubrics
            </button>
          
          </div>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            

            {/* Detailed Information Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                <div className="space-y-3">
      <h3 className="text-sm font-medium tracking-tight text-gray-900">
          Candidate Information
        </h3>

        <div className="flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gray-900 text-sm font-semibold text-white flex items-center justify-center">
            {parsedData.candidate.name?.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900">
              {parsedData.candidate.name}
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <a
                href={`mailto:${parsedData.candidate.email}`}
                className="hover:text-gray-900 hover:underline flex items-center"
              >
                <Mail className="w-4 h-4 text-gray-500 mr-1" />
                {parsedData.candidate.email}
              </a>

              {parsedData.candidate.phone && (
                <a
                  href={`tel:${parsedData.candidate.phone}`}
                  className="hover:text-gray-900 hover:underline flex items-center"
                >
                  <Phone className="w-4 h-4 text-gray-500 mr-1" />
                  {parsedData.candidate.phone}
                </a>
              )}
            </div>
          </div>

          <a
            href={`/jobs/${parsedData.job.id}/${parsedData.candidate.id}`}
            className="text-gray-400 hover:text-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* ================= Job ================= */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium tracking-tight text-gray-900">
          Job Information
        </h3>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className='flex items-start gap-4'>
              <div className="font-medium text-gray-900">
              {parsedData.job.title}
            </div>

            <div className="mt-1 flex flex-wrap gap-2">
              {parsedData.job.status && (
                <JobStatusBadge status={parsedData.job.status} type="job-status" />
              )}
              {parsedData.job.hiring_urgency && (
                <JobStatusBadge status={parsedData.job.hiring_urgency} type="hiring-urgency" />
              )}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Hiring manager:{" "}
              
              <span className="font-medium text-gray-900">
                {parsedData.job.created_by?.first_name}{" "}
                {parsedData.job.created_by?.last_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 text-xs font-medium text-gray-700">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                />
                { parsedData.job.openings && parsedData.job.openings > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      ((parsedData.job.hired_count || 0) /
                        parsedData.job.openings) *
                      94.2
                    } 94.2`}
                  />
                )}
                {/* <text
                  x="18"
                  y="22"
                  textAnchor="middle"
                  className="fill-gray-700 text-[10px]"
                >
                  {parsedData.job.hired_count}/{parsedData.job.openings}
                </text> */}
              </svg>
            </div>

            <a
              href={`/jobs/${parsedData.job.id}`}
              className="text-gray-400 hover:text-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>


                  {/* ===================== Interview ===================== */}
                  <section className="rounded-xl bg-white">
                    <header className="mb-4">
                      <h3 className="text-sm font-medium tracking-tight text-gray-900 text-gray-500">
                        Interview Information
                      </h3>
                    </header>

                    <div className="space-y-6">
                      {/* ---------- Organizer ---------- */}
                      {parsedData.organizer && (
                        <div>

                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-purple-600 text-sm font-semibold text-white">
                              {parsedData.organizer.avatar ? (
                                <img
                                  src={parsedData.organizer.avatar}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  {(parsedData.organizer.first_name || parsedData.organizer.email || "?")
                                    .charAt(0)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">
                                {`${parsedData.organizer.first_name || ""} ${parsedData.organizer.last_name || ""}`.trim() || "Guest"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(parsedData.organizer.role || "Organiser")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (parsedData.organizer.role || "Organiser").slice(1)}
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ---------- Participants ---------- */}
                      <div>
                        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Participants
                        </div>

                        <div className="space-y-3">
                          {/* Candidate */}
                          <div className="flex items-center gap-3 rounded-lg border bg-gray-50 px-3 py-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white flex items-center justify-center">
                              {parsedData.candidate.name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {parsedData.candidate.name}
                              </div>
                              <div className="text-xs text-gray-500">Candidate</div>
                            </div>
                          </div>

                          {/* Interviewers */}
                          {parsedData.interviewers.map((interviewer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border px-3 py-2"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-purple-100 text-xs font-semibold text-purple-700 flex items-center justify-center">
                                  {interviewer.avatar ? (
                                    <img
                                      src={interviewer.avatar}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    (interviewer.first_name || interviewer.email || "?").charAt(0)
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-gray-900">
                                    {`${interviewer.first_name || ""} ${interviewer.last_name || ""}`.trim() ||
                                      interviewer.email ||
                                      "Unknown"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(interviewer.role || "Interviewer")
                                      .charAt(0)
                                      .toUpperCase() +
                                      (interviewer.role || "Interviewer").slice(1)}
                                  </div>
                                </div>
                              </div>

                              <button className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {interview?.status !== "overdue" && (
                            <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                              <Plus className="h-4 w-4" />
                              Add participant
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ---------- Location ---------- */}
                      <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Location
                        </div>
                        <a
                          href={parsedData.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm text-indigo-600 hover:underline"
                        >
                          {parsedData.location}
                        </a>
                      </div>

                      {/* ---------- Notes ---------- */}
                      <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Notes
                        </div>

                        {parsedData.note ? (
                          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {parsedData.note}
                          </p>
                        ) : (
                          <div className="rounded-lg border border-dashed px-3 py-3 text-sm italic text-gray-400">
                            No notes added
                          </div>
                        )}

                        {interview?.status !== "overdue" && (
                          <button className="mt-2 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            <FileText className="h-4 w-4" />
                            Edit note
                          </button>
                        )}
                      </div>
                    </div>
                  </section>

                </div>
              )}

            {/* Interview Rubrics Tab */}
            {activeTab === 'rubrics' && (
              <div className="space-y-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
                  </div>
                )}



                {error && (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <X className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Error Loading Rubrics</h3>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchRubrics} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {!loading && !error && rubrics && rubrics.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">No Criteria Added</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      No interview rubrics have been configured for your school yet.
                    </p>
                  </div>
                )}

                {!loading && !error && rubrics && rubrics.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Criteria</TableHead>
                          <TableHead className="w-[25%]">Type</TableHead>
                          <TableHead className="w-[25%]">Scoring</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rubrics.map((rubric) => (
                          <TableRow key={rubric.id}>
                            <TableCell className="max-w-[200px]">
                              <div>
                                <p className="font-medium text-gray-900 truncate">{rubric.name}</p>
                                {rubric.description && (
                                  <p className="text-xs text-gray-500 mt-1 truncate" title={rubric.description}>
                                    {rubric.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {rubric.type}
                              </span>
                            </TableCell>
                            <TableCell>
                              {rubric.type === 'numeric' ? (
                                <span className="text-sm text-gray-600">Out of {rubric.out_of}</span>
                              ) : rubric.type === 'boolean' ? (
                                <span className="text-sm text-gray-600">Yes/No</span>
                              ) : (
                                <span className="text-sm text-gray-600">-</span>
                              )}
                            </TableCell>

                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UpdateStatusDialog
        isOpen={showUpdateStatusDialog}
        onClose={() => setShowUpdateStatusDialog(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </>);
};

export default InterviewDetailSheet;