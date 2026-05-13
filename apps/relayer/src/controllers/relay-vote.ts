import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RelayVoteRequestSchema,
  RelayVoteResponseSchema,
} from "@/schemas/relay-vote";
import { ErrorResponseSchema } from "@/errors";
import { RelayService } from "@/services/relay";

export function relayVote(app: Hono, relayService: RelayService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "relayVote",
      path: "/relay/vote",
      summary: "Relay a gasless vote",
      description:
        "Submit an EIP-712 signed vote on behalf of a user. The relayer pays gas.",
      tags: ["relay"],
      request: {
        body: {
          content: {
            "application/json": { schema: RelayVoteRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: "Vote transaction submitted",
          content: {
            "application/json": { schema: RelayVoteResponseSchema },
          },
        },
        400: {
          description: "Validation or eligibility error",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
        429: {
          description: "Rate limited",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
        503: {
          description: "Relayer unavailable (low balance)",
          content: {
            "application/json": { schema: ErrorResponseSchema },
          },
        },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const result = await relayService.relayVote(body);

      return c.json(
        {
          transactionHash: result.hash,
          voter: result.signer,
        },
        200,
      );
    },
  );
}
