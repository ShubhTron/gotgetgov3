/**
 * Error Logging Utility
 * 
 * Provides centralized error logging functionality with support for:
 * - Console logging in development
 * - Error tracking service integration (e.g., Sentry)
 * - Structured error information (message, stack trace, timestamp, context)
 */

export interface ErrorLogContext {
  /** Additional context about where/why the error occurred */
  context: string;
  /** Optional user ID for tracking */
  userId?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Logs an error with context information
 * 
 * @param error - The error object to log
 * @param context - String describing where the error occurred (e.g., "Feed Data Fetching")
 * @param userId - Optional user ID for tracking
 * @param metadata - Optional additional metadata to include
 */
export function logError(
  error: Error | unknown,
  context: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  // Ensure we have an Error object
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  // Construct structured error information
  const errorInfo = {
    message: errorObj.message,
    stack: errorObj.stack,
    timestamp: new Date().toISOString(),
    context,
    userId,
    metadata,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[Error - ${context}]:`, errorInfo);
  }

  // TODO: Send to error tracking service (e.g., Sentry)
  // Example Sentry integration:
  // if (typeof Sentry !== 'undefined') {
  //   Sentry.captureException(errorObj, {
  //     tags: { context },
  //     user: userId ? { id: userId } : undefined,
  //     extra: metadata,
  //   });
  // }
}

/**
 * Logs a warning with context information
 * 
 * @param message - The warning message
 * @param context - String describing where the warning occurred
 * @param metadata - Optional additional metadata to include
 */
export function logWarning(
  message: string,
  context: string,
  metadata?: Record<string, unknown>
): void {
  const warningInfo = {
    message,
    timestamp: new Date().toISOString(),
    context,
    metadata,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn(`[Warning - ${context}]:`, warningInfo);
  }

  // TODO: Send to error tracking service if needed
}
