import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");

/**
 * OpenAPI responses every session-gated route shares: sessionAuth rejects
 * untrusted Hosts with 400 and missing/invalid sessions with 401.
 */
export const unauthorizedResponses = {
  400: {
    description: "Request Host is not a trusted domain",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  401: {
    description: "Missing or invalid session",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
} as const;
