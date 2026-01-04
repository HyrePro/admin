/**
 * API Rate Limiter - Implements client-side rate limiting to prevent server overload
 */
export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private requestCounts: Map<string, { count: number; timestamp: number }[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindowMs: number;

  private constructor(maxRequests: number = 10, timeWindowMs: number = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  public static getInstance(maxRequests?: number, timeWindowMs?: number): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter(maxRequests, timeWindowMs);
    }
    return ApiRateLimiter.instance;
  }

  /**
   * Check if a request is allowed based on rate limits
   * @param endpoint - The API endpoint being called
   * @param method - The HTTP method (GET, POST, PUT, DELETE, etc.)
   * @returns boolean indicating if the request is allowed
   */
  public isRequestAllowed(endpoint: string, method: string = 'GET'): boolean {
    const key = `${method}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - this.timeWindowMs;

    // Get existing requests for this endpoint/method combination
    let requests = this.requestCounts.get(key) || [];

    // Remove requests that are outside the time window
    requests = requests.filter(request => request.timestamp > windowStart);

    // Check if we're under the limit
    const allowed = requests.length < this.maxRequests;

    if (allowed) {
      // Add the current request to the list
      requests.push({ count: 1, timestamp: now });
      this.requestCounts.set(key, requests);
    }

    return allowed;
  }

  /**
   * Execute a request with rate limiting
   * @param endpoint - The API endpoint to call
   * @param method - The HTTP method
   * @param requestFn - The function that makes the actual request
   * @returns Promise with the result of the request or an error if rate limited
   */
  public async executeWithRateLimit<T>(
    endpoint: string,
    method: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (!this.isRequestAllowed(endpoint, method)) {
      throw new Error(`Rate limit exceeded for ${method} ${endpoint}. Please try again later.`);
    }

    return await requestFn();
  }

  /**
   * Get the remaining requests allowed for an endpoint
   * @param endpoint - The API endpoint
   * @param method - The HTTP method
   * @returns number of remaining requests allowed in the current time window
   */
  public getRemainingRequests(endpoint: string, method: string = 'GET'): number {
    const key = `${method}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - this.timeWindowMs;

    // Get existing requests for this endpoint/method combination
    let requests = this.requestCounts.get(key) || [];

    // Remove requests that are outside the time window
    requests = requests.filter(request => request.timestamp > windowStart);

    return Math.max(0, this.maxRequests - requests.length);
  }

  /**
   * Get the time until the rate limit resets for an endpoint
   * @param endpoint - The API endpoint
   * @param method - The HTTP method
   * @returns number of milliseconds until rate limit resets
   */
  public getTimeUntilReset(endpoint: string, method: string = 'GET'): number {
    const key = `${method}:${endpoint}`;
    const requests = this.requestCounts.get(key) || [];

    if (requests.length === 0) {
      return 0; // No requests made yet
    }

    // The reset time is the time of the first request in the window + timeWindowMs
    const now = Date.now();
    const windowStart = now - this.timeWindowMs;
    
    // Find the first request in the current window
    const firstRequestInWindow = requests.reduce((earliest, current) => {
      return current.timestamp < earliest.timestamp ? current : earliest;
    }, requests[0]);

    if (firstRequestInWindow.timestamp > windowStart) {
      return (firstRequestInWindow.timestamp + this.timeWindowMs) - now;
    }

    return 0; // Window has already reset
  }

  /**
   * Reset the rate limiter for a specific endpoint
   * @param endpoint - The API endpoint to reset
   * @param method - The HTTP method
   */
  public reset(endpoint: string, method: string = 'GET'): void {
    const key = `${method}:${endpoint}`;
    this.requestCounts.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  public clear(): void {
    this.requestCounts.clear();
  }
}