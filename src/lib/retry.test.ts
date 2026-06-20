import { describe, expect, it } from "vitest";

import { retry } from "./retry";

describe("retry", () => {
  it("returns the operation result after a retryable failure", async () => {
    let attempts = 0;

    const result = await retry(
      async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("temporarily unavailable");
        }
        return "ok";
      },
      {
        maxAttempts: 3,
        retryable: () => true
      }
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });

  it("does not retry non-retryable failures", async () => {
    let attempts = 0;
    const failure = new Error("validation failed");

    await expect(
      retry(
        async () => {
          attempts += 1;
          throw failure;
        },
        {
          maxAttempts: 3,
          retryable: () => false
        }
      )
    ).rejects.toBe(failure);

    expect(attempts).toBe(1);
  });

  it("throws the terminal failure after max attempts", async () => {
    let attempts = 0;

    await expect(
      retry(
        async () => {
          attempts += 1;
          throw new Error(`failure ${attempts}`);
        },
        {
          maxAttempts: 3,
          retryable: () => true
        }
      )
    ).rejects.toThrow("failure 3");

    expect(attempts).toBe(3);
  });

  it("awaits delay between retryable attempts with attempt and error", async () => {
    const errors: string[] = [];
    const attempts: number[] = [];
    let operationAttempts = 0;

    const result = await retry(
      async () => {
        operationAttempts += 1;
        if (operationAttempts < 3) {
          throw new Error(`failure ${operationAttempts}`);
        }
        return "recovered";
      },
      {
        maxAttempts: 3,
        retryable: () => true,
        delay: async (attempt, error) => {
          attempts.push(attempt);
          errors.push(error instanceof Error ? error.message : "unknown");
          return 0;
        }
      }
    );

    expect(result).toBe("recovered");
    expect(attempts).toEqual([1, 2]);
    expect(errors).toEqual(["failure 1", "failure 2"]);
  });
});
