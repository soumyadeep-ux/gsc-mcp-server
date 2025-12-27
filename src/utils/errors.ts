import { GaxiosError } from 'googleapis-common';

export interface FormattedError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Formats Google API errors into user-friendly messages
 */
export function formatGoogleApiError(error: unknown): FormattedError {
  if (error instanceof GaxiosError) {
    const status = error.response?.status;
    const errorData = error.response?.data as { error?: { message?: string; code?: number } } | undefined;
    const message = errorData?.error?.message ?? error.message;

    switch (status) {
      case 400:
        return {
          message: 'Invalid request parameters',
          code: 'INVALID_REQUEST',
          details: message,
        };
      case 401:
        return {
          message: 'Authentication failed. Try running "npm run auth" to re-authenticate.',
          code: 'UNAUTHORIZED',
          details: message,
        };
      case 403:
        return {
          message: 'Permission denied. Make sure you have access to this GSC property.',
          code: 'FORBIDDEN',
          details: message,
        };
      case 404:
        return {
          message: 'Resource not found. The URL or property may not exist.',
          code: 'NOT_FOUND',
          details: message,
        };
      case 429:
        return {
          message: 'Rate limit exceeded. Please wait a moment and try again.',
          code: 'RATE_LIMIT',
          details: message,
        };
      case 500:
      case 502:
      case 503:
        return {
          message: 'Google Search Console service is temporarily unavailable. Please try again later.',
          code: 'SERVICE_ERROR',
          details: message,
        };
      default:
        return {
          message: `Google API error: ${message}`,
          code: `HTTP_${status}`,
          details: message,
        };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Formats an error for tool output
 */
export function formatToolError(error: unknown): string {
  const formatted = formatGoogleApiError(error);
  let result = `Error: ${formatted.message}`;
  if (formatted.details && formatted.details !== formatted.message) {
    result += `\nDetails: ${formatted.details}`;
  }
  return result;
}
