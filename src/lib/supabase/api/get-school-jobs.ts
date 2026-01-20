import { JobData } from '@/components/school-job-campaign';

export async function getSchoolJobs(schoolId: string): Promise<JobData[]> {
  try {
    const response = await fetch(`/api/school-jobs?schoolId=${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch school jobs');
    }

    const data: JobData[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching school jobs:', error);
    throw error;
  }
}