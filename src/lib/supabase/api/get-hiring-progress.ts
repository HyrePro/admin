import { HiringProgressData } from '@/components/hiring-progress-chart';

export async function getHiringProgress(schoolId: string): Promise<HiringProgressData> {
  try {
    const response = await fetch(`/api/hiring-progress?schoolId=${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch hiring progress data');
    }

    const data: HiringProgressData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching hiring progress:', error);
    throw error;
  }
}