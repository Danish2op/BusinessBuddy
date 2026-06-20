export type RetryablePredicate = (error: unknown, attempt: number) => boolean | Promise<boolean>;
export type RetryDelay = (attempt: number, error: unknown) => number | Promise<number>;

export type RetryOptions = {
  maxAttempts: number;
  retryable?: RetryablePredicate;
  delay?: RetryDelay;
};

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T>(
  operation: (attempt: number) => Promise<T> | T,
  options: RetryOptions
): Promise<T> {
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new RangeError("retry maxAttempts must be a positive integer");
  }

  const retryable = options.retryable ?? (() => true);

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      const hasAttemptsRemaining = attempt < options.maxAttempts;
      if (!hasAttemptsRemaining || !(await retryable(error, attempt))) {
        throw error;
      }

      if (options.delay) {
        await sleep(await options.delay(attempt, error));
      }
    }
  }

  throw new Error("retry exhausted without a terminal error");
}
