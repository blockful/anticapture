import { CircuitOpenError } from "./circuit-breaker.js";
import type { CircuitBreakerRegistry } from "./circuit-breaker-registry.js";

/**
 * Fetches a path from all configured DAO APIs in parallel.
 * Returns both the parsed response data and the Cache-Control header from
 * the first successful upstream so callers can propagate the TTL downstream.
 */
export async function fanOutGet<T = unknown>(
  daoApis: Map<string, string>,
  registry: CircuitBreakerRegistry,
  path: string,
  queryString?: string,
): Promise<{ data: Map<string, T>; cacheControl: string | null }> {
  const entries = Array.from(daoApis.entries());

  const results = await Promise.allSettled(
    entries.map(async ([dao, baseUrl]) => {
      return registry.get(dao).execute(async () => {
        const url = new URL(path, baseUrl);
        if (queryString) url.search = queryString;

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`${dao}: ${res.status}`);
      const cacheControl = res.headers?.get("cache-control") ?? null;

      const data = (await res.json()) as T;
      return { dao, data, cacheControl };
    }),
  );

  const data = new Map<string, T>();
  let cacheControl: string | null = null;

  for (const result of results) {
    if (result.status === "fulfilled") {
      data.set(result.value.dao, result.value.data);
      if (cacheControl === null) {
        cacheControl = result.value.cacheControl;
      }
    } else {
      if (result.reason instanceof CircuitOpenError) {
        console.warn(`[fan-out] `, result.reason);
      } else {
        console.error(`[fan-out] `, result.reason);
      }
    }
  }

  return { data, cacheControl };
}
