/**
 * Production-grade API wrapper for all Supabase/network calls.
 * Provides: retry logic, timeout handling, safe error extraction.
 */

import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// ─── Configuration ─────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

// ─── Error Types ───────────────────────────────────────
export class ApiError extends Error {
  public readonly isTimeout: boolean;
  public readonly isNetwork: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    options?: { isTimeout?: boolean; isNetwork?: boolean; statusCode?: number }
  ) {
    super(message);
    this.name = 'ApiError';
    this.isTimeout = options?.isTimeout ?? false;
    this.isNetwork = options?.isNetwork ?? false;
    this.statusCode = options?.statusCode;
  }
}

// ─── Timeout Wrapper ───────────────────────────────────
function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ApiError('Request timed out. Please try again.', { isTimeout: true }));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Network Check ─────────────────────────────────────
async function checkNetwork(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    // If NetInfo itself fails, assume connected and let the request decide
    return true;
  }
}

// ─── Safe Error Extraction ─────────────────────────────
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return 'An unexpected error occurred. Please try again.';
}

// ─── User-Friendly Error Display ───────────────────────
export function showUserError(error: unknown, title: string = 'Error'): void {
  const message = extractErrorMessage(error);

  if (error instanceof ApiError) {
    if (error.isTimeout) {
      Alert.alert('Connection Slow', 'The request timed out. Check your connection and try again.');
      return;
    }
    if (error.isNetwork) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }
  }

  Alert.alert(title, message);
}

// ─── Core Safe Call ────────────────────────────────────

interface SafeCallOptions {
  /** Max retries on failure (default: 2) */
  maxRetries?: number;
  /** Timeout in ms for each attempt (default: 15000) */
  timeoutMs?: number;
  /** If true, silently fail without throwing (default: false) */
  silent?: boolean;
  /** If true, check network before calling (default: true) */
  checkConnectivity?: boolean;
}

interface SafeCallResult<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Execute an async function with retry, timeout, and network checking.
 *
 * @example
 * const { data, error } = await safeCall(
 *   () => supabase.from('profiles').select('*').single(),
 *   { maxRetries: 2, timeoutMs: 10_000 }
 * );
 */
export async function safeCall<T>(
  fn: () => Promise<T>,
  options?: SafeCallOptions
): Promise<SafeCallResult<T>> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    silent = false,
    checkConnectivity = true,
  } = options ?? {};

  // 1. Check network
  if (checkConnectivity) {
    const isConnected = await checkNetwork();
    if (!isConnected) {
      const err = new ApiError('No internet connection.', { isNetwork: true });
      if (!silent) console.warn('[API] Network unavailable');
      return { data: null, error: err };
    }
  }

  // 2. Retry loop
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await withTimeout(fn(), timeoutMs);
      return { data: result, error: null };
    } catch (err) {
      lastError = err instanceof ApiError
        ? err
        : new ApiError(extractErrorMessage(err));

      // Don't retry on auth errors or client errors
      if (lastError.statusCode && lastError.statusCode >= 400 && lastError.statusCode < 500) {
        break;
      }

      // Don't retry on timeout (user would wait too long)
      if (lastError.isTimeout && attempt >= 1) {
        break;
      }

      // Wait before next retry
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        if (!silent) {
          console.warn(`[API] Retry ${attempt + 1}/${maxRetries} after error:`, lastError.message);
        }
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Wraps a Supabase query result, extracting data/error from the Supabase response shape.
 *
 * @example
 * const { data, error } = await safeSupabaseCall(
 *   supabase.from('profiles').select('*').eq('id', userId).single()
 * );
 */
export async function safeSupabaseCall<T>(
  queryPromise: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
  options?: SafeCallOptions
): Promise<SafeCallResult<T>> {
  const result = await safeCall(async () => {
    const response = await queryPromise;
    if (response.error) {
      throw new ApiError(response.error.message, {
        statusCode: response.error.code === 'PGRST116' ? 404 : undefined,
      });
    }
    return response.data as T;
  }, options);

  return result;
}
