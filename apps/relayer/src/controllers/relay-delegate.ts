import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RelayDelegateRequestSchema,
  RelayDelegateResponseSchema,
} from "@/schemas/relay-delegate";
import { ErrorResponseSchema } from "@/schemas/shared";
import { RelayService } from "@/services/relay";

export function relayDelegate(app: Hono, relayService: RelayService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "relayDelegate",
      path: "/relay/delegate",
      summary: "Relay a gasless delegation",
      description:
        "Submit an EIP-712 signed delegation on behalf of a user. The relayer pays gas.",
      tags: ["relay"],
      request: {
        body: {
          content: {
            "application/json": { schema: RelayDelegateRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: "Delegation transaction submitted",
          content: {
            "application/json": { schema: RelayDelegateResponseSchema },
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

      const result = await relayService.relayDelegation({
        delegatee: body.delegatee as `0x${string}`,
        nonce: BigInt(body.nonce),
        expiry: BigInt(body.expiry),
        v: body.v,
        r: body.r as `0x${string}`,
        s: body.s as `0x${string}`,
      });

      return c.json(
        {
          transactionHash: result.hash,
          delegator: result.signer,
        },
        200,
      );
    },
  );
}
