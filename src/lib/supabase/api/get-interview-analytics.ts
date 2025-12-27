import { createClient } from "./client";

export interface InterviewAnalytics {
  type: string;
  job_id: string;
  interview_funnel: {
    hired: number;
    offered: number;
    eligible: number;
    rejected: number;
    completed: number;
    scheduled: number;
  };
  panelist_summary: {
    total_panelists: number;
    total_evaluations: number;
    avg_panelist_score: number;
    max_panelist_score: number;
    total_score_available: number;
  };
  score_statistics: {
    avg_score: number;
    max_score: number;
    total_score: number;
    total_evaluations: number;
  };
  panelist_overview: Array<{
    type: string;
    title: string;
    out_of: number;
    average: number;
    description: string;
    evaluation_count: number;
  }>;
  panelist_performance: Array<PanelistPerformance>;
  generated_at: string;
}

export interface PanelistPerformance {
  panelist_id: string;
  panelist_name: string;
  average_score: number;
  total_evaluations: number;
  performance_metrics: Array<{
    category: string;
    score: number;
    max_score: number;
    evaluation_count: number;
  }>;
}

// Helper function to convert any value to a JSON-serializable format
function toSerializable(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitive types that are already serializable
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    // Handle NaN and Infinity
    return isFinite(value) ? value : null;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => toSerializable(item));
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Type assertion to allow property access
    const obj = value as Record<string, unknown>;
    
    // Check if it's a special database type by common properties
    // BigNumeric or similar numeric types often have specific properties
    if ('_data' in obj && obj._data !== undefined) {
      // This looks like a BigNumeric or similar - convert to number
      return Number(obj._data);
    }

    // Check for numeric-like objects
    if ('toFixed' in obj && typeof (obj as { toFixed?: unknown }).toFixed === 'function') {
      // Decimal.js or similar - convert to number
      return Number(obj as number | { valueOf: () => number });
    }

    // Check if it's a string representation of a number
    if ('toString' in obj && typeof (obj as { toString?: unknown }).toString === 'function') {
      const strValue = (obj as { toString?: () => string }).toString?.();
      if (strValue && !isNaN(Number(strValue)) && !isNaN(parseFloat(strValue))) {
        return Number(strValue);
      }
    }

    // Handle PostgreSQL-specific types by checking constructor name
    const typedValue = value as object & { constructor?: { name?: string } };
    if (typedValue.constructor && typedValue.constructor.name) {
      // If it's a custom numeric type from the database driver
      if (['Big', 'BigNumber', 'Decimal', 'Numeric'].includes(typedValue.constructor.name)) {
        return Number(value as number | string | { valueOf: () => number });
      }
    }

    // Recursively handle nested objects
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = toSerializable(obj[key]);
      }
    }
    return result;
  }

  // For any other type, try to convert to string as a fallback
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    // If all else fails, convert to string
    return String(value);
  }
}

export async function getInterviewAnalytics(
  jobId: string
): Promise<{ data: InterviewAnalytics | null; error: string | null }> {
  // Create the supabase client instance
  const supabase = createClient();

  try {
    // Validate jobId format (basic UUID validation)
    if (!jobId || typeof jobId !== 'string' || jobId.length < 36) {
      throw new Error('Invalid job ID format');
    }

    const response = await fetch(`/api/interview-analytics?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interview analytics');
    }

    let data = await response.json();
    
    // Apply serialization to handle any non-serializable values
    data = toSerializable(data);
    
    return { data: data as InterviewAnalytics, error: null };
  } catch (err) {
    console.error('Error fetching interview analytics:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while fetching interview analytics',
    };
  }
}