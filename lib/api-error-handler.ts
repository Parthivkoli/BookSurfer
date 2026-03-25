// lib/api-error-handler.ts
import { AxiosError } from 'axios';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: any): APIError {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    return new APIError(
      status,
      data?.message || 'An error occurred',
      data?.details
    );
  } else if (error.request) {
    // Request sent but no response
    return new APIError(
      0,
      'No response from server. Please check your connection.',
      error
    );
  } else if (error instanceof Error) {
    return new APIError(500, error.message, error);
  }
  
  return new APIError(500, 'An unexpected error occurred', error);
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
