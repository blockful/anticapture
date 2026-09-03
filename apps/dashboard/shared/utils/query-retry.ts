/**
 * Retry policy for React Query.
 *
 * The SDK rejects HTTP failures with an error carrying the response `status`.
 * Those are deterministic: the gateway or the API already decided, and every
 * retry against a failing route counts once more toward the gateway circuit
 * breaker for that DAO (React Query's default is 3 retries, so one page view
 * of a broken card produced four failures). Only network-level errors, which
 * have no status, are retried, and only once.
 */
export const MAX_NETWORK_RETRIES = 1;

export const isHttpError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { status?: unknown }).status === "number";

export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => !isHttpError(error) && failureCount < MAX_NETWORK_RETRIES;
