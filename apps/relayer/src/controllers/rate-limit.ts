import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import type { Address } from "viem";

import {
  RateLimitParamsSchema,
  RateLimitResponseSchema,
} from "@/schemas/rate-limit";
import { ErrorResponseSchema, Errors } from "@/errors";
import type {
  RateLimitStorage,
  RelayOperation,
} from "@/repository/rate-limit-storage";

interface RateLimitControllerDeps {
  storage: RateLimitStorage;
  daoName: string;
  governorAddress: Address;
  limits: Record<RelayOperation, number>;
}

function nextUtcMonthStartIso(now: number): string {
  const date = new Date(now);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  ).toISOString();
}

function clampRemaining(used: number, max: number): number {
  return Math.max(0, max - used);
}

export function rateLimit(app: Hono, deps: RateLimitControllerDeps) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRateLimit",
      path: "/relay/rate-limit/{address}",
      summary: "Per-address relay usage for the current UTC month",
      description:
        "Returns the number of relay calls already used and remaining for the given address, " +
        "split by operation. Reads do not consume the rate limit.",
      tags: ["system"],
      request: {
        params: RateLimitParamsSchema,
      },
      responses: {
        200: {
          description: "Current usage and remaining quota",
          content: {
            "application/json": { schema: RateLimitResponseSchema },
          },
        },
        400: {
          description: "Invalid address",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
        503: {
          description: "Rate limiter storage is unavailable",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
      },
    }),
    async (c) => {
      const { address } = c.req.valid("param");

      let voteUsed: number;
      let delegationUsed: number;
      try {
        [voteUsed, delegationUsed] = await Promise.all([
          deps.storage.getCount({
            daoName: deps.daoName,
            governorAddress: deps.governorAddress,
            address,
            operation: "vote",
          }),
          deps.storage.getCount({
            daoName: deps.daoName,
            governorAddress: deps.governorAddress,
            address,
            operation: "delegation",
          }),
        ]);
      } catch {
        throw Errors.RATE_LIMITER_UNAVAILABLE();
      }

      return c.json(
        {
          address,
          vote: {
            used: voteUsed,
            remaining: clampRemaining(voteUsed, deps.limits.vote),
            limit: deps.limits.vote,
          },
          delegation: {
            used: delegationUsed,
            remaining: clampRemaining(delegationUsed, deps.limits.delegation),
            limit: deps.limits.delegation,
          },
          resetsAt: nextUtcMonthStartIso(Date.now()),
        },
        200,
      );
    },
  );
}
