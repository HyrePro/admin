import { createClient } from "./client";

export interface MCQAssessmentAnalytics {
  type: string;
  job_id: string;
  metrics: {
    avg_score: number;
    avg_attempted: number;
    avg_percentage: number;
    avg_total_questions: number;
  };
  summary: {
    failed: number;
    passed: number;
    eligible: number;
    attempted: number;
  };
  generated_at: string;
  category_metrics: {
    [category: string]: {
      avg_score: number;
      avg_attempted: number;
      avg_percentage: number;
      avg_total_questions: number;
    };
  };
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

export async function getMcqAssessmentAnalytics(
  jobId: string
): Promise<{ data: MCQAssessmentAnalytics | null; error: string | null }> {
  // Create the supabase client instance
  const supabase = createClient();

  try {
    // Validate jobId format (basic UUID validation)
    if (!jobId || typeof jobId !== 'string' || jobId.length < 36) {
      throw new Error('Invalid job ID format');
    }

    const response = await fetch(`/api/mcq-assessment-analytics?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch MCQ assessment analytics');
    }

    let data = await response.json();
    
    // Apply serialization to handle any non-serializable values
    data = toSerializable(data);
    
    return { data: data as MCQAssessmentAnalytics, error: null };
  } catch (err) {
    console.error('Error fetching MCQ assessment analytics:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while fetching MCQ assessment analytics',
    };
  }
}