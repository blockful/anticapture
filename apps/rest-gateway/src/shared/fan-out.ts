/**
 * Fetches a path from all configured DAO APIs in parallel
 * Returns a Map of dao name → parsed JSON response (only successful ones)
 */
export async function fanOutGet<T = unknown>(
  daoApis: Map<string, string>,
  path: string,
  queryString?: string,
): Promise<Map<string, T>> {
  const entries = Array.from(daoApis.entries());

  const results = await Promise.allSettled(
    entries.map(async ([dao, baseUrl]) => {
      const url = new URL(path, baseUrl);
      if (queryString) url.search = queryString;

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`${dao}: ${res.status}`);

      const data = (await res.json()) as T;
      return { dao, data };
    }),
  );

  const responses = new Map<string, T>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      responses.set(result.value.dao, result.value.data);
    }
  }

  return responses;
}
