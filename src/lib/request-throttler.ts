// Request throttler to limit the rate of API requests
class RequestThrottler {
  private requests: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindowMs: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  /**
   * Check if a request is allowed based on throttling rules
   * @param key - Unique key for the request (e.g., user ID + endpoint)
   * @returns boolean indicating if the request is allowed
   */
  isRequestAllowed(key: string): boolean {
    const now = Date.now();
    const requestInfo = this.requests.get(key);

    if (!requestInfo) {
      // First request from this key
      this.requests.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Check if the time window has passed
    if (now - requestInfo.timestamp > this.timeWindowMs) {
      // Reset the counter for this key
      this.requests.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Check if we're under the limit
    if (requestInfo.count < this.maxRequests) {
      // Increment the counter
      this.requests.set(key, { 
        count: requestInfo.count + 1, 
        timestamp: requestInfo.timestamp 
      });
      return true;
    }

    // Request is throttled
    return false;
  }

  /**
   * Execute a request with throttling
   * @param key - Unique key for the request
   * @param requestFn - Function that returns a promise for the request
   * @returns Promise that resolves with the request result or rejects with throttling error
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (!this.isRequestAllowed(key)) {
      throw new Error(`Request throttled: Too many requests from this source. Maximum ${this.maxRequests} requests per ${this.timeWindowMs}ms.`);
    }

    return requestFn();
  }

  /**
   * Get request statistics for a key
   */
  getRequestStats(key: string) {
    return this.requests.get(key);
  }

  /**
   * Clear expired entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    for (const [key, requestInfo] of this.requests.entries()) {
      if (now - requestInfo.timestamp > this.timeWindowMs) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset throttling for a specific key
   */
  reset(key: string) {
    this.requests.delete(key);
  }
}

// Create a singleton instance with default settings
export const requestThrottler = new RequestThrottler(10, 1000); // 10 requests per second

/**
 * Generate a throttling key for a request based on user context and endpoint
 * @param userId - User ID (or 'anonymous' for unauthenticated users)
 * @param endpoint - API endpoint being called
 * @param method - HTTP method
 * @returns Unique key for throttling
 */
export function generateThrottlingKey(userId: string, endpoint: string, method: string = 'GET'): string {
  return `${userId}:${method}:${endpoint}`;
}

/**
 * Enhanced request executor that combines deduplication and throttling
 */
export class RequestManager {
  constructor(
    private throttler: RequestThrottler,
    private deduplicator: any // Using any type since we'll pass the actual deduplicator
  ) {}

  async execute<T>(
    key: string,
    userId: string,
    endpoint: string,
    method: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Generate throttling key
    const throttlingKey = generateThrottlingKey(userId, endpoint, method);

    // Check if request is allowed based on throttling
    if (!this.throttler.isRequestAllowed(throttlingKey)) {
      throw new Error(`Request throttled: Too many requests. Please slow down your requests.`);
    }

    // Execute with deduplication
    return this.deduplicator.execute(key, requestFn);
  }
}