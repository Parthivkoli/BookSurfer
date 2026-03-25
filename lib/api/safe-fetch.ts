// lib/api/safe-fetch.ts - Safe API wrapper with error handling
import { APIError, handleAPIError, retryWithExponentialBackoff } from '@/lib/api-error-handler';

interface FetchOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

/**
 * Safe fetch wrapper with automatic error handling and retries
 */
export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = 3, timeout = 30000, ...fetchOptions } = options;

  return retryWithExponentialBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new APIError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          await response.json().catch(() => null)
        );
      }

      return await response.json() as T;
    } catch (error) {
      throw handleAPIError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }, retries);
}

/**
 * Safe POST request
 */
export async function safePost<T>(
  url: string,
  data: any,
  options: FetchOptions = {}
): Promise<T> {
  return safeFetch<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Safe GET request
 */
export async function safeGet<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  return safeFetch<T>(url, {
    ...options,
    method: 'GET',
  });
}
