import { Hono } from "hono";
import pRetry from "p-retry";
import { getRegisteredDaos } from "../../dao-registry.js";
import {
  alignDaoResponses,
  aggregateMeanPercentage,
  buildPaginatedResponse,
  type DelegationPercentageResponse,
} from "../../lib/aggregation.js";

export const delegatedPercentageRoute = new Hono();

/**
 * GET /v1/delegated-percentage
 *
 * Query params (forwarded to each DAO API):
 *   startDate, endDate, limit, after, before, orderDirection
 *
 * Fans out to all registered DAO APIs, aligns date ranges,
 * computes mean delegation percentage, and returns paginated series.
 */
delegatedPercentageRoute.get("/delegated-percentage", async (c) => {
  const query = c.req.query();

  if (query.startDate && query.endDate) {
    if (BigInt(query.startDate) >= BigInt(query.endDate)) {
      return c.json({ error: "startDate must be before endDate" }, 400);
    }
  }

  const daos = getRegisteredDaos();

  if (daos.size === 0) {
    return c.json(
      buildPaginatedResponse([], query, false),
    );
  }

  const results = await Promise.allSettled(
    [...daos.entries()].map(([daoId, baseUrl]) =>
      pRetry(
        async () => {
          const url = new URL(`${baseUrl}/delegation-percentage-by-day`);
          for (const [k, v] of Object.entries(query)) {
            url.searchParams.set(k, v);
          }
          const res = await fetch(url.toString());
          if (!res.ok) {
            throw new Error(`${daoId} responded with ${res.status}`);
          }
          return res.json() as Promise<DelegationPercentageResponse>;
        },
        { retries: 2, factor: 2, minTimeout: 200 },
      ).then((data) => ({ daoId, data })),
    ),
  );

  const daoResponses = new Map<string, DelegationPercentageResponse>(
    results
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{
          daoId: string;
          data: DelegationPercentageResponse;
        }> => r.status === "fulfilled",
      )
      .map((r) => [r.value.daoId, r.value.data]),
  );

  const hasNextPage = Array.from(daoResponses.values()).some(
    (r) => r?.pageInfo?.hasNextPage ?? false,
  );

  const aligned = alignDaoResponses(daoResponses, query.orderDirection);
  const aggregated =
    aligned.size === 0 ? [] : aggregateMeanPercentage(aligned);

  return c.json(buildPaginatedResponse(aggregated, query, hasNextPage));
});
