/**
 * Global Error Handler
 *
 * Provides a unified error handling system that:
 * - Formats errors into a standard format
 * - Logs errors using Pino logger
 * - Reports errors to Sentry with appropriate context
 * - Supports different error sources and severity levels
 */

import { logger } from '@/logger';
import * as Sentry from '@sentry/nextjs';
import { AxiosError } from 'axios';
import { parseAPIError } from '@/utils/common/parseAPIError';

/**
 * Error severity levels aligned with Sentry's levels
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Error source indicates where the error originated
 */
export enum ErrorSource {
  WINDOW = 'window',
  PROMISE = 'unhandled-promise',
  REACT_QUERY = 'react-query',
  ERROR_BOUNDARY = 'error-boundary',
  API = 'api',
  MANUAL = 'manual',
  MIDDLEWARE = 'middleware',
  SERVER = 'server',
}

/**
 * Standard error format that all errors are normalized to
 */
export interface StandardError {
  /** Error message (user-friendly when possible) */
  message: string;
  /** Error name/type */
  name: string;
  /** Stack trace */
  stack?: string;
  /** Original error object */
  originalError: unknown;
  /** Source of the error */
  source: ErrorSource;
  /** Severity level */
  severity: ErrorSeverity;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Timestamp when error was captured */
  timestamp: number;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** URL or endpoint where error occurred */
  url?: string;
}

/**
 * Options for the global error handler
 */
export interface ErrorHandlerOptions {
  /** Error source */
  source?: ErrorSource;
  /** Severity level (defaults to ERROR) */
  severity?: ErrorSeverity;
  /** Additional context to attach to the error */
  context?: Record<string, unknown>;
  /** Whether to skip logging (default: false) */
  skipLogging?: boolean;
  /** Whether to skip Sentry reporting (default: false) */
  skipSentry?: boolean;
  /** Custom tags for Sentry */
  tags?: Record<string, string | number | boolean>;
  /** Custom fingerprint for Sentry grouping */
  fingerprint?: string[];
  /** User information to attach */
  user?: Sentry.User;
}

/**
 * Normalizes any error type into a StandardError format
 */
export function normalizeError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): StandardError {
  const {
    source = ErrorSource.MANUAL,
    severity = ErrorSeverity.ERROR,
    context = {},
  } = options;

  const timestamp = Date.now();
  let message = 'An unknown error occurred';
  let name = 'UnknownError';
  let stack: string | undefined;
  let statusCode: number | undefined;
  let url: string | undefined;

  // Handle AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    message = parseAPIError(axiosError);
    name = 'APIError';
    stack = axiosError.stack;
    statusCode = axiosError.response?.status;
    url = axiosError.config?.url;
  }
  // Handle Error instances
  else if (error instanceof Error) {
    message = error.message;
    name = error.name;
    stack = error.stack;
  }
  // Handle string errors
  else if (typeof error === 'string') {
    message = error;
    name = 'StringError';
  }
  // Handle error-like objects
  else if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    message = String(errorObj.message || errorObj.error || 'Unknown error');
    name = String(errorObj.name || 'ObjectError');
    stack = errorObj.stack as string | undefined;
  }

  return {
    message,
    name,
    stack,
    originalError: error,
    source,
    severity,
    context,
    timestamp,
    statusCode,
    url,
  };
}

/**
 * Logs a standardized error using Pino
 */
function logError(standardError: StandardError): void {
  const logData = {
    errorName: standardError.name,
    errorMessage: standardError.message,
    source: standardError.source,
    severity: standardError.severity,
    context: standardError.context,
    statusCode: standardError.statusCode,
    url: standardError.url,
    timestamp: standardError.timestamp,
    stack: standardError.stack,
  };

  // Use appropriate log level
  switch (standardError.severity) {
    case ErrorSeverity.DEBUG:
      logger.debug(logData, standardError.message);
      break;
    case ErrorSeverity.INFO:
      logger.info(logData, standardError.message);
      break;
    case ErrorSeverity.WARNING:
      logger.warn(logData, standardError.message);
      break;
    case ErrorSeverity.FATAL:
    case ErrorSeverity.ERROR:
    default:
      logger.error(logData, standardError.message);
      break;
  }
}

/**
 * Reports a standardized error to Sentry
 */
function reportToSentry(
  standardError: StandardError,
  options: ErrorHandlerOptions = {}
): void {
  const { tags = {}, fingerprint, user } = options;

  // Set user context if provided
  if (user) {
    Sentry.setUser(user);
  }

  // Prepare Sentry context
  const sentryContext: Sentry.CaptureContext = {
    level: standardError.severity as Sentry.SeverityLevel,
    tags: {
      ...tags,
      source: standardError.source,
      errorName: standardError.name,
    },
    extra: {
      ...standardError.context,
      timestamp: standardError.timestamp,
      statusCode: standardError.statusCode,
      url: standardError.url,
    },
    fingerprint,
  };

  // Report to Sentry
  if (standardError.originalError instanceof Error) {
    Sentry.captureException(standardError.originalError, sentryContext);
  } else {
    // For non-Error objects, capture as a message with context
    Sentry.captureMessage(standardError.message, sentryContext);
  }
}

/**
 * Global error handler - the main entry point for handling errors
 *
 * @param error - The error to handle (any type)
 * @param options - Configuration options
 * @returns The normalized StandardError
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, {
 *     source: ErrorSource.API,
 *     context: { endpoint: '/api/data' },
 *     tags: { feature: 'data-fetching' }
 *   });
 * }
 * ```
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): StandardError {
  const { skipLogging = false, skipSentry = false } = options;

  // Normalize the error
  const standardError = normalizeError(error, options);

  // Log to Pino
  if (!skipLogging) {
    logError(standardError);
  }

  // Report to Sentry
  if (!skipSentry && typeof window !== 'undefined') {
    reportToSentry(standardError, options);
  }

  return standardError;
}

/**
 * Specialized handler for React Query errors
 */
export function handleQueryError(
  error: unknown,
  context?: Record<string, unknown>
): StandardError {
  return handleError(error, {
    source: ErrorSource.REACT_QUERY,
    context,
    tags: { component: 'react-query' },
  });
}

/**
 * Specialized handler for Error Boundary errors
 */
export function handleBoundaryError(
  error: Error,
  errorInfo?: { componentStack?: string },
  context?: Record<string, unknown>
): StandardError {
  return handleError(error, {
    source: ErrorSource.ERROR_BOUNDARY,
    context: {
      ...context,
      componentStack: errorInfo?.componentStack,
    },
    tags: { component: 'error-boundary' },
  });
}

/**
 * Specialized handler for API errors
 */
export function handleAPIError(
  error: unknown,
  endpoint?: string,
  context?: Record<string, unknown>
): StandardError {
  return handleError(error, {
    source: ErrorSource.API,
    context: {
      ...context,
      endpoint,
    },
    tags: { component: 'api' },
  });
}

/**
 * Specialized handler for window-level errors
 */
export function handleWindowError(
  error: Error | string,
  source?: string,
  lineno?: number,
  colno?: number
): StandardError {
  return handleError(error, {
    source: ErrorSource.WINDOW,
    context: {
      source,
      lineno,
      colno,
    },
    tags: { component: 'window' },
  });
}

/**
 * Specialized handler for unhandled promise rejections
 */
export function handlePromiseRejection(
  reason: unknown,
  promise: Promise<unknown>
): StandardError {
  return handleError(reason, {
    source: ErrorSource.PROMISE,
    context: {
      promise: String(promise),
    },
    tags: { component: 'promise' },
  });
}

/**
 * Initialize global error handlers for window errors and unhandled promise rejections
 * This should be called once in the application initialization
 */
export function initializeGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleWindowError(
      event.error || event.message,
      event.filename,
      event.lineno,
      event.colno
    );
    // Don't prevent default to allow other handlers to run
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handlePromiseRejection(event.reason, event.promise);
    // Don't prevent default to allow other handlers to run
  });

  logger.info('Global error handlers initialized');
}

/**
 * Utility to create an error handler with pre-configured options
 * Useful for creating context-specific error handlers
 *
 * @example
 * ```typescript
 * const handleAuthError = createErrorHandler({
 *   source: ErrorSource.API,
 *   tags: { module: 'auth' }
 * });
 *
 * handleAuthError(error, { context: { userId: '123' } });
 * ```
 */
export function createErrorHandler(defaultOptions: ErrorHandlerOptions) {
  return (error: unknown, options: ErrorHandlerOptions = {}): StandardError => {
    return handleError(error, {
      ...defaultOptions,
      ...options,
      context: {
        ...defaultOptions.context,
        ...options.context,
      },
      tags: {
        ...defaultOptions.tags,
        ...options.tags,
      },
    });
  };
}
