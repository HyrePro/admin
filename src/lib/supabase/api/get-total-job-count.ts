import { createClient } from "./client";

export interface TotalJobCount {
  totalJobs: number;
  message: string;
}

export async function getTotalJobCount(): Promise<{ data: TotalJobCount | null; error: string | null }> {
  try {
    const response = await fetch(`/api/get-total-job-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch total job count');
    }

    const data = await response.json();
    return { data: data as TotalJobCount, error: null };
  } catch (err) {
    console.error('Error fetching total job count:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while fetching total job count',
    };
  }
}