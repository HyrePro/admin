export interface JobCount {
  count: number;
  message: string;
}

export async function getJobCount(status?: string, search?: string): Promise<{ data: JobCount | null; error: string | null }> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const queryParams = params.toString();
    const url = queryParams ? `/api/get-job-count?${queryParams}` : `/api/get-job-count`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch job count');
    }

    const data = await response.json();
    return { data: data as JobCount, error: null };
  } catch (err) {
    console.error('Error fetching job count:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while fetching job count',
    };
  }
}