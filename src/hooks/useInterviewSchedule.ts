import { useQuery } from '@tanstack/react-query';
import {
  InterviewStatusFilter,
  InterviewCalendarView,
} from '@/lib/query/contracts/interviews';
import { interviewScheduleQueryOptions } from '@/lib/query/fetchers/interviews';

interface UseInterviewScheduleParams {
  schoolId: string;
  view: InterviewCalendarView;
  currentDate: Date;
  statusFilter: InterviewStatusFilter;
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
  panelist,
}: UseInterviewScheduleParams) => {
  return useQuery({
    ...interviewScheduleQueryOptions({
      schoolId,
      view,
      currentDate: currentDate.toISOString().split('T')[0],
      statusFilter,
      userId: userId || '',
      jobId,
      jobsAssignedToMe,
      panelist,
    }),
    placeholderData: (previousData) => previousData,
  });
};
