// Request deduplicator with throttling and rate limiting to prevent duplicate API requests and limit request rate
import { requestThrottler, generateThrottlingKey } from './request-throttler';
import { ApiRateLimiter } from './api-rate-limiter';

class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Execute a request with deduplication based on the key
   * @param key - Unique key for the request (e.g., URL + parameters)
   * @param requestFn - Function that returns a promise for the request
   * @returns Promise that resolves with the request result
   */
  async execute<T>(
    key: string, 
    requestFn: () => Promise<T>,
    userId: string = 'anonymous',
    endpoint: string = '',
    method: string = 'GET'
  ): Promise<T> {
    // Generate throttling key
    const throttlingKey = generateThrottlingKey(userId, endpoint, method);
    
    // Check if request is allowed based on throttling
    if (!requestThrottler.isRequestAllowed(throttlingKey)) {
      throw new Error(`Request throttled: Too many requests. Please slow down your requests.`);
    }
    
    // Check if request is allowed based on rate limiting
    const rateLimiter = ApiRateLimiter.getInstance();
    if (!rateLimiter.isRequestAllowed(endpoint, method)) {
      throw new Error(`Rate limit exceeded for ${method} ${endpoint}. Please try again later.`);
    }
    
    // Check if there's already a pending request with the same key
    if (this.pendingRequests.has(key)) {
      // Return the existing promise if one is already pending
      return this.pendingRequests.get(key)!;
    }

    // Create a new promise for this request
    const requestPromise = requestFn().finally(() => {
      // Clean up the pending request once it's completed (resolved or rejected)
      this.pendingRequests.delete(key);
    });

    // Store the promise in the map
    this.pendingRequests.set(key, requestPromise);

    // Return the promise
    return requestPromise;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    this.pendingRequests.clear();
  }

  /**
   * Check if a request with the given key is currently pending
   */
  hasPendingRequest(key: string): boolean {
    return this.pendingRequests.has(key);
  }
}

// Create a singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Generate a unique key for a request based on URL and parameters
 * @param url - The request URL
 * @param params - Request parameters
 * @param method - HTTP method
 * @returns Unique key string for the request
 */
export function generateRequestKey(url: string, params?: Record<string, any>, method: string = 'GET'): string {
  // Sort parameters to ensure consistent key generation
  const sortedParams = params ? 
    Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&') 
    : '';
  
  return `${method}:${url}?${sortedParams}`;
}