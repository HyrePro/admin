import { AnalyticsData } from '@/components/weekly-activity-chart';

export async function getWeeklyActivity(schoolId: string): Promise<AnalyticsData[]> {
  try {
    const response = await fetch(`/api/weekly-activity?schoolId=${schoolId}&type=weekly`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch weekly activity data');
    }

    const data: AnalyticsData[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    // Return fallback data on error
    return [
      { period: 'Mon', total_applications: 10 },
      { period: 'Tue', total_applications: 12 },
      { period: 'Wed', total_applications: 8 },
      { period: 'Thu', total_applications: 17 },
      { period: 'Fri', total_applications: 19 },
      { period: 'Sat', total_applications: 5 },
      { period: 'Sun', total_applications: 5 },
    ];
  }
}