import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import type { Address } from "viem";

import {
  RateLimitParamsSchema,
  RateLimitResponseSchema,
} from "@/schemas/rate-limit";
import { ErrorResponseSchema, Errors } from "@/errors";
import type { RateLimitStorage } from "@/repository/rate-limit-storage";

interface RateLimitControllerDeps {
  storage: RateLimitStorage;
  daoName: string;
  governorAddress: Address;
  maxPerDay: number;
}

const DAY_MS = 86_400_000;

function nextUtcMidnightIso(now: number): string {
  return new Date(Math.floor(now / DAY_MS) * DAY_MS + DAY_MS).toISOString();
}

function clampRemaining(used: number, max: number): number {
  return Math.max(0, max - used);
}

export function rateLimit(app: Hono, deps: RateLimitControllerDeps) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRateLimit",
      path: "/rate-limit/{address}",
      summary: "Per-address relay usage for the current UTC day",
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
          maxPerDay: deps.maxPerDay,
          vote: {
            used: voteUsed,
            remaining: clampRemaining(voteUsed, deps.maxPerDay),
          },
          delegation: {
            used: delegationUsed,
            remaining: clampRemaining(delegationUsed, deps.maxPerDay),
          },
          resetsAt: nextUtcMidnightIso(Date.now()),
        },
        200,
      );
    },
  );
}
