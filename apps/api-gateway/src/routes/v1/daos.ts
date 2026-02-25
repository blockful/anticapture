import { Hono } from "hono";
import pRetry from "p-retry";
import { getRegisteredDaos } from "../../dao-registry.js";

export const daosRoute = new Hono();

/**
 * GET /v1/daos
 *
 * Fans out to all registered DAO APIs' /dao endpoint in parallel,
 * collects successful responses, and returns an aggregated list.
 */
daosRoute.get("/daos", async (c) => {
  const daos = getRegisteredDaos();

  if (daos.size === 0) {
    return c.json({ items: [], totalCount: 0 });
  }

  const results = await Promise.allSettled(
    [...daos.entries()].map(([daoId, baseUrl]) =>
      pRetry(
        async () => {
          const res = await fetch(`${baseUrl}/dao`);
          if (!res.ok) {
            throw new Error(`${daoId} responded with ${res.status}`);
          }
          return res.json();
        },
        { retries: 2, factor: 2, minTimeout: 200 },
      ).then((data) => ({ daoId, data })),
    ),
  );

  const items = results
    .filter(
      (r): r is PromiseFulfilledResult<{ daoId: string; data: unknown }> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value.data);

  return c.json({ items, totalCount: items.length });
});
