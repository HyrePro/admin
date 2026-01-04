import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display in the UI
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input);
}

/**
 * Sanitize job data to prevent XSS attacks
 * @param jobData - The job data to sanitize
 * @returns Sanitized job data
 */
export function sanitizeJobData(jobData: any): any {
  if (!jobData || typeof jobData !== 'object') {
    return jobData;
  }

  const sanitizedData: any = Array.isArray(jobData) ? [] : {};

  for (const key in jobData) {
    if (Object.prototype.hasOwnProperty.call(jobData, key)) {
      const value = jobData[key];

      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitizedData[key] = sanitizeJobData(value);
      } else {
        sanitizedData[key] = value;
      }
    }
  }

  return sanitizedData;
}

/**
 * Sanitize a list of job data
 * @param jobs - Array of job data to sanitize
 * @returns Array of sanitized job data
 */
export function sanitizeJobList(jobs: any[]): any[] {
  if (!Array.isArray(jobs)) {
    return jobs;
  }

  return jobs.map(job => sanitizeJobData(job));
}