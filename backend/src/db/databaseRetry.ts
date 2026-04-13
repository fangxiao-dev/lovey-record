import { isTransientDatabaseError } from './databaseErrors';

type RetryOptions = {
  attempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 100;
  const backoffFactor = options.backoffFactor ?? 2;

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientDatabaseError(error) || attempt === attempts) {
        throw error;
      }

      await delay(delayMs);
      delayMs *= backoffFactor;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Database operation failed');
}

