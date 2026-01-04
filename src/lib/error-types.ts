/**
 * Error types for better error handling in the JobsTable component
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error class for API-related errors
 */
export class ApiError extends AppError {
  public readonly statusCode?: number;
  public readonly url?: string;
  public readonly method?: string;

  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    method?: string,
    details?: any
  ) {
    super(message, 'API_ERROR', details);
    this.statusCode = statusCode;
    this.url = url;
    this.method = method;
  }
}

/**
 * Error class for authentication-related errors
 */
export class AuthError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details);
  }
}

/**
 * Error class for validation-related errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.field = field;
    this.value = value;
  }
}

/**
 * Error class for network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Error class for timeout-related errors
 */
export class TimeoutError extends AppError {
  public readonly timeout: number;

  constructor(message: string, timeout: number, details?: any) {
    super(message, 'TIMEOUT_ERROR', details);
    this.timeout = timeout;
  }
}

/**
 * Error class for rate limit-related errors
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: any) {
    super(message, 'RATE_LIMIT_ERROR', details);
    this.retryAfter = retryAfter;
  }
}

/**
 * Error class for data integrity errors
 */
export class DataIntegrityError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_INTEGRITY_ERROR', details);
  }
}

/**
 * Error class for permission-related errors
 */
export class PermissionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details);
  }
}

/**
 * Type guard functions to check error types
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: any): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: any): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isRateLimitError(error: any): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isDataIntegrityError(error: any): error is DataIntegrityError {
  return error instanceof DataIntegrityError;
}

export function isPermissionError(error: any): error is PermissionError {
  return error instanceof PermissionError;
}

/**
 * Error response interface for API responses
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Standardized error response builder
 */
export class ErrorBuilder {
  static buildErrorResponse(error: AppError): ErrorResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
      },
    };
  }

  static buildApiError(
    message: string,
    statusCode?: number,
    url?: string,
    method?: string,
    details?: any
  ): ApiError {
    return new ApiError(message, statusCode, url, method, details);
  }

  static buildValidationError(
    message: string,
    field?: string,
    value?: any,
    details?: any
  ): ValidationError {
    return new ValidationError(message, field, value, details);
  }

  static buildNetworkError(message: string, details?: any): NetworkError {
    return new NetworkError(message, details);
  }

  static buildTimeoutError(
    message: string,
    timeout: number,
    details?: any
  ): TimeoutError {
    return new TimeoutError(message, timeout, details);
  }

  static buildRateLimitError(
    message: string,
    retryAfter?: number,
    details?: any
  ): RateLimitError {
    return new RateLimitError(message, retryAfter, details);
  }
}