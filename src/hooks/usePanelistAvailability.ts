import { useQuery } from '@tanstack/react-query';

interface PanelistAvailability {
  is_available: boolean;
  conflict_interview_id?: string;
  conflict_start_time?: string;
  conflict_end_time?: string;
  job_id?: string;
  candidate_email?: string;
  interview_type?: string;
  interview_status?: string;
  meet_link?: string;
}

interface UsePanelistAvailabilityParams {
  panelistEmail: string;
  interviewDate: string; // YYYY-MM-DD format
  startTime: string;     // HH:MM format
  endTime: string;       // HH:MM format
  enabled?: boolean;     // Whether to enable the query
}

export const usePanelistAvailability = ({
  panelistEmail,
  interviewDate,
  startTime,
  endTime,
  enabled = true
}: UsePanelistAvailabilityParams) => {
  return useQuery<PanelistAvailability[], Error>({
    queryKey: ['panelist-availability', panelistEmail, interviewDate, startTime, endTime],
    queryFn: async () => {
      const response = await fetch('/api/check-panelist-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelistEmail,
          interviewDate,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check panelist availability');
      }

      const data: PanelistAvailability[] = await response.json();
      return data;
    },
    enabled: Boolean(panelistEmail && interviewDate && startTime && endTime && enabled),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};