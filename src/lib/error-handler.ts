/**
 * Global Error Handler Service
 * Provides centralized error handling for API responses and other errors
 */

import { toast } from 'sonner';
import { ApiError, AuthError, NetworkError, ValidationError, TimeoutError, RateLimitError, PermissionError, isNetworkError as isNetworkErrorType, ErrorBuilder } from './error-types';
import { isTimeoutError } from './utils';

export interface ErrorContext {
  operation?: string;
  component?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  timestamp?: Date;
}

export class GlobalErrorHandler {
  /**
   * Handle API errors with centralized logic
   */
  static handleApiError(error: any, context?: ErrorContext): string {
    // Log error for debugging
    console.error(`API Error in ${context?.operation || 'unknown operation'}:`, error);
    
    // Determine error type and return appropriate message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      const message = 'Network error: Unable to connect to the server. Please check your internet connection.';
      toast.error(message);
      return message;
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Network error
      const message = 'Network error: Failed to connect to the server.';
      toast.error(message);
      return message;
    }
    
    if (isTimeoutError(error)) {
      // Timeout error
      const message = 'Request timeout: The server took too long to respond. Please try again.';
      toast.error(message);
      return message;
    }
    
    if (error instanceof Response) {
      // Response error
      const message = `Server error: Request failed with status ${error.status}`;
      toast.error(message);
      return message;
    }
    
    if (error instanceof Error) {
      // Standard error
      if (context?.statusCode) {
        switch (context.statusCode) {
          case 401:
            const message = 'Authentication required: Please log in to continue.';
            toast.error(message);
            return message;
          case 403:
            const forbiddenMessage = 'Access denied: You do not have permission to perform this action.';
            toast.error(forbiddenMessage);
            return forbiddenMessage;
          case 404:
            const notFoundMessage = 'Resource not found: The requested resource could not be found.';
            toast.error(notFoundMessage);
            return notFoundMessage;
          case 429:
            const rateLimitMessage = 'Rate limit exceeded: Too many requests. Please try again later.';
            toast.error(rateLimitMessage);
            return rateLimitMessage;
          case 500:
            const serverMessage = 'Server error: An internal server error occurred. Please try again later.';
            toast.error(serverMessage);
            return serverMessage;
          default:
            const defaultMessage = error.message || 'An error occurred while processing your request.';
            toast.error(defaultMessage);
            return defaultMessage;
        }
      }
      
      const message = error.message || 'An unexpected error occurred.';
      toast.error(message);
      return message;
    }
    
    // Generic error
    const message = 'An unexpected error occurred. Please try again.';
    toast.error(message);
    return message;
  }

  /**
   * Handle general application errors
   */
  static handleGeneralError(error: any, context?: ErrorContext): string {
    console.error(`General Error in ${context?.component || 'unknown component'}:`, error);
    
    if (error instanceof Error) {
      const message = error.message || 'An unexpected error occurred.';
      toast.error(message);
      return message;
    }
    
    const message = 'An unexpected error occurred. Please try again.';
    toast.error(message);
    return message;
  }

  /**
   * Log error with context
   */
  static logError(error: any, context?: ErrorContext): void {
    const logEntry = {
      error: error?.message || error?.toString() || 'Unknown error',
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Error Log:', logEntry);
  }
}

export default GlobalErrorHandler;