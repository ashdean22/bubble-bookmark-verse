import { lazy, ComponentType } from 'react';

/**
 * React.lazy with automatic retry + cache-busting reload fallback.
 * On flaky mobile networks a dynamic chunk request can fail once; the default
 * React.lazy then throws forever and takes the whole screen down.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  delayMs = 400,
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }
    throw lastError;
  });
}
