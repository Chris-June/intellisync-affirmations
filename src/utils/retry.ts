export const exponentialBackoff = (retryCount: number, baseDelay: number = 1000) => {
  const maxDelay = 30000; // Maximum delay of 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  const jitter = Math.random() * 1000; // Add random jitter to prevent thundering herd
  return delay + jitter;
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  onRetry?: (retryCount: number, error: Error) => void
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (retryCount === maxRetries) {
        break;
      }

      const delay = exponentialBackoff(retryCount, baseDelay);
      onRetry?.(retryCount + 1, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
