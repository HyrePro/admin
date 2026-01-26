import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/api/client';

// Define the interface matching the expected structure from the terminal output
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

// Define the parameters for the query
interface UseInterviewScheduleParams {
  schoolId: string;
  view: 'day' | 'week' | 'month';
  currentDate: Date;
  statusFilter: 'all' | 'scheduled' | 'overdue' | 'completed';
  userId: string | null;
  jobId?: string | null;
  jobsAssignedToMe: boolean;
  panelist: boolean;
}

export const useInterviewSchedule = ({
  schoolId,
  view,
  currentDate,
  statusFilter,
  userId,
  jobId,
  jobsAssignedToMe,
  panelist
}: UseInterviewScheduleParams) => {
  console.log('useInterviewSchedule hook called with params:', {
    schoolId,
    view,
    currentDate,
    statusFilter,
    userId,
    jobId,
    jobsAssignedToMe,
    panelist,
    enabledCondition: !!schoolId && !!userId
  });
  

  return useQuery<InterviewSchedule[], Error>({
    queryKey: [
      'interview-schedule',
      schoolId,
      view,
      currentDate.toISOString(),
      statusFilter,
      userId,
      jobId,
      jobsAssignedToMe,
      panelist
    ],
    queryFn: async () => {
      console.log('useInterviewSchedule queryFn called with params:', {
        schoolId,
        view,
        currentDate,
        statusFilter,
        userId,
        jobId,
        jobsAssignedToMe,
        panelist
      });
      // Calculate start and end dates based on the view mode
      let startDate: Date;
      let endDate: Date;
      
      console.log('Calculating dates for view:', view, 'currentDate:', currentDate);

      if (view === 'day') {
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (view === 'week') {
        startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - currentDate.getDay()); // Start from Sunday
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else { // month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of month
      }
      
      // Format dates as YYYY-MM-DD strings
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('Calculated date range:', { startDateStr, endDateStr, startDate, endDate });



      // Create API URL with parameters
      const params = new URLSearchParams({
        p_school_id: schoolId,
        p_view: view,
        p_current_date: currentDate.toISOString().split('T')[0],
        p_status_filter: statusFilter,
        p_jobs_assigned_to_me: jobsAssignedToMe.toString(),
        p_panelist: panelist.toString()
      });
      
      if (userId) {
        params.append('p_user_id', userId);
      }
      
      if (jobId) {
        params.append('p_job_id', jobId);
      }
      
      console.log('Calling interview schedule API with parameters:', {
        schoolId,
        view,
        currentDate: currentDate.toISOString().split('T')[0],
        statusFilter,
        userId,
        jobId,
        jobsAssignedToMe,
        panelist
      });
      
      // Call the API endpoint
      const response = await fetch(`/api/interview-schedule?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch interview schedule');
      }
      
      const data = await response.json();
      
      console.log('API interview_schedule result:', { data });

      // Error was already handled by the response.ok check above

      // Transform the server data to match the new interface structure
      const transformedData: InterviewSchedule[] = (data || []).map((item: any) => ({
        // New structure fields
        interview_id: item.interview_id || item.id || '',
        candidate: item.candidate || {
          id: item.candidate?.id || '',
          dob: item.candidate?.dob || null,
          city: item.candidate?.city || '',
          email: item.candidate?.email || '',
          phone: item.candidate?.phone || '',
          state: item.candidate?.state || '',
          avatar: item.candidate?.avatar || null,
          gender: item.candidate?.gender || '',
          subjects: item.candidate?.subjects || [],
          education: item.candidate?.education || [],
          last_name: item.candidate?.last_name || '',
          first_name: item.candidate?.first_name || '',
          resume_url: item.candidate?.resume_url || '',
          teaching_experience: item.candidate?.teaching_experience || []
        },
        job: item.job || {
          id: item.job?.id || '',
          plan: item.job?.plan || '',
          title: item.job?.title || '',
          status: item.job?.status || '',
          openings: item.job?.openings || 1,
          created_by: item.job?.created_by || {},
          hired_count: item.job?.hired_count || 0,
          hiring_urgency: item.job?.hiring_urgency || ''
        },
        organiser: item.organiser || {
          id: item.organiser?.id || '',
          role: item.organiser?.role || '',
          email: item.organiser?.email || '',
          avatar: item.organiser?.avatar || '',
          last_name: item.organiser?.last_name || '',
          first_name: item.organiser?.first_name || ''
        },
        panelists: item.panelists || [],
        
        // Legacy fields for backward compatibility
        id: item.interview_id || item.id || '',
        first_name: item.candidate?.first_name || item.first_name || '',
        last_name: item.candidate?.last_name || item.last_name || '',
        candidate_email: item.candidate?.email || item.candidate_email || '',
        candidate_phone: item.candidate?.phone || item.candidate_phone || '',
        job_title: item.job?.title || item.job_title || '',
        interview_date: item.interview_date || '',
        start_time: item.start_time ? item.start_time.toString().substring(0, 5) : '', // Extract HH:MM from HH:MM:SS
        duration_minutes: item.duration_minutes,
        duration: item.duration_minutes ? `${item.duration_minutes}` : item.duration || '',
        status: item.status as 'scheduled' | 'completed' | 'overdue' || 'scheduled',
        interview_type: item.interview_type || '',
        meeting_location: item.meeting_location,
        candidate_response: undefined, // Not provided in new structure
        interviewer_response: undefined, // Not provided in new structure
        meeting_link: item.meeting_location || item.meeting_link || '',
        note: item.note || '',
        notes: item.note || item.notes || '',
        created_at: item.created_at || '',
        interviewers: item.panelists || item.interviewers || [],
        organizer: item.organiser || item.organizer,
        job_object: {
          id: item.job?.id || '',
          title: item.job?.title || '',
          status: item.job?.status || '',
          hiring_urgency: item.job?.hiring_urgency || '',
          openings: item.job?.openings || 1,
          hired_count: item.job?.hired_count || 0,
          created_by: item.job?.created_by || {}
        }
      }));

      return transformedData;
    },
    enabled: !!schoolId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
  
  console.log('useInterviewSchedule hook - enabled status:', !!schoolId && !!userId, { schoolId, userId });
};