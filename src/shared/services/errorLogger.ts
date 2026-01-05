/**
 * Error Logger Service
 * 
 * Logs errors to backend for monitoring and debugging.
 * 
 * Features:
 * - Pluggable architecture (can integrate Sentry, DataDog later)
 * - Sanitizes sensitive data
 * - Includes context (route, user agent, etc.)
 * - Handles network failures gracefully
 * 
 * Future: Can extend to support different log levels, batching, filtering
 */

export interface ErrorLogContext {
  componentStack?: string;
  route: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  // FUTURE: Add these without breaking changes
  sessionId?: string;
  previousActions?: string[];
  performanceMetrics?: {
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

export interface ErrorLogger {
  log(error: Error, context: ErrorLogContext): Promise<void>;
}

/**
 * Sanitize error message and stack trace to remove sensitive data
 */
function sanitizeError(error: Error): { message: string; stack?: string } {
  // Remove potential tokens, passwords, API keys from error messages
  const sensitivePatterns = [
    /token[=:]\s*[^\s&]+/gi,
    /password[=:]\s*[^\s&]+/gi,
    /api[_-]?key[=:]\s*[^\s&]+/gi,
    /bearer\s+[^\s&]+/gi,
  ];

  let message = error.message;
  let stack = error.stack;

  sensitivePatterns.forEach((pattern) => {
    message = message.replace(pattern, '[REDACTED]');
    if (stack) {
      stack = stack.replace(pattern, '[REDACTED]');
    }
  });

  return { message, stack };
}

/**
 * Default error logger implementation
 * Sends errors to backend API
 */
const defaultErrorLogger: ErrorLogger = {
  log: async (error: Error, context: ErrorLogContext): Promise<void> => {
    try {
      // Sanitize error
      const { message, stack } = sanitizeError(error);

      // Prepare payload
      const payload = {
        message,
        stack,
        context: {
          ...context,
          // Add user/tenant info if available from localStorage
          userId: localStorage.getItem('user_id') || undefined,
          tenantId: localStorage.getItem('tenant_id') || undefined,
        },
      };

      // Send to backend
      // Note: Don't use apiClient here to avoid circular dependency and potential infinite loops
      const response = await fetch('/api/errors/log/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available
          ...(localStorage.getItem('access_token') && {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to log error: ${response.status}`);
      }


    } catch (_logError) {
      // Fail silently in production, log to console in development
      if (import.meta.env.DEV) {
        console.error('Failed to send error log to backend:', _logError);
      }
    }
  },
};

/**
 * Export the error logger
 * 
 * FUTURE: This can be swapped out for different implementations:
 * - Sentry: export const errorLogger = sentryErrorLogger;
 * - DataDog: export const errorLogger = datadogErrorLogger;
 * - Multiple: export const errorLogger = compositeLogger([backend, sentry]);
 */
export const errorLogger: ErrorLogger = defaultErrorLogger;

/**
 * Helper function to manually log errors
 * Useful for try-catch blocks where you want to log but not crash
 */
export function logError(error: Error, additionalContext?: Partial<ErrorLogContext>): void {
  errorLogger.log(error, {
    route: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  }).catch((_err) => {
    if (import.meta.env.DEV) {
      console.warn('Error logger failure:', _err);
    }
  });
}
