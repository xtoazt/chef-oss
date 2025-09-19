/**
 * Wrapper to ensure API routes don't exceed Vercel Hobby Plan's 60-second timeout
 */

export function withTimeout<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs: number = 55000 // 55 seconds to leave buffer for cleanup
) {
  return async (...args: T): Promise<R> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Function timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const functionPromise = fn(...args);

    return Promise.race([functionPromise, timeoutPromise]);
  };
}

/**
 * Creates a timeout-aware response for streaming endpoints
 */
export function createTimeoutResponse(timeoutMs: number = 55000) {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}
