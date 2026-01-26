import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';

// Define the type for the interview details data based on the terminal output
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

interface InterviewDetails {
  interview_id: string;
  interview_date: string;
  start_time: string;
  duration_minutes: number;
  interview_type: string;
  status: string;
  meeting_location: string;
  note: string | null;
  created_at: string;
  candidate: Candidate;
  job: Job;
  organiser: Organiser;
  panelists: Panelist[];
}

export const useInterviewDetails = (interviewId: string) => {
  const fetchInterviewDetails = async (): Promise<InterviewDetails> => {
    if (!interviewId) {
      throw new Error('Interview ID is required to fetch interview details');
    }

    const response = await fetch(`/api/interview-details?id=${interviewId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interview details');
    }
    
    const data = await response.json();
    return data;
  };

  return useQuery<InterviewDetails, Error>({
    queryKey: ['interview-details', interviewId],
    queryFn: fetchInterviewDetails,
    enabled: !!interviewId, // Only run the query if interviewId is provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collection time
  });
};