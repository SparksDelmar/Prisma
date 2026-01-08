/**
 * Retry Utility for API calls
 * Implements exponential backoff and handles transient errors (429, 5xx).
 */

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Determine if the error is transient
      // 429: Too Many Requests
      // 5xx: Server Errors
      // Network failures (no status)
      const status = error?.status || error?.response?.status;
      const message = error?.message || "";
      
      const isRateLimit = status === 429;
      const isServerError = status >= 500 && status < 600;
      const isNetworkError = !status;
      const isTransient = isRateLimit || isServerError || isNetworkError;

      // If we reached max retries or the error isn't transient, throw immediately
      if (attempt === maxRetries || !isTransient) {
        console.error(`[Prisma] Final attempt ${attempt} failed:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff: 1.5s, 3s, 6s...
      const delay = initialDelay * Math.pow(2, attempt - 1);
      
      console.warn(
        `[Prisma] API call failed (Attempt ${attempt}/${maxRetries}). ` +
        `Status: ${status || 'Network Error'}. Retrying in ${delay}ms...`
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Maximum retries reached without success");
}
