import { CircuitOpenError } from "./circuit-breaker.js";
import type { CircuitBreakerRegistry } from "./circuit-breaker-registry.js";

/**
 * Fetches a path from all configured DAO APIs in parallel
 * Returns a Map of dao name → parsed JSON response (only successful ones)
 */
export async function fanOutGet<T = unknown>(
  daoApis: Map<string, string>,
  registry: CircuitBreakerRegistry,
  path: string,
  queryString?: string,
): Promise<Map<string, T>> {
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

        const data = (await res.json()) as T;
        return { dao, data };
      });
    }),
  );

  const responses = new Map<string, T>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      responses.set(result.value.dao, result.value.data);
    } else {
      if (result.reason instanceof CircuitOpenError) {
        console.warn(`[fan-out] `, result.reason);
      } else {
        console.error(`[fan-out] `, result.reason);
      }
    }
  }

  return responses;
}
