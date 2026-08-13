import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RelayProposalRequestSchema,
  RelayProposalResponseSchema,
} from "@/schemas/relay-proposal";
import { ErrorResponseSchema } from "@/errors";
import { ProposalActionService } from "@/services/proposals/proposal-action";

const errorResponses = {
  400: {
    description: "Validation error",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  404: {
    description: "Proposal not found",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  409: {
    description: "Proposal is not in an actionable state",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  422: {
    description: "Proposal data failed on-chain verification",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  503: {
    description: "Relayer unavailable (low balance)",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
} as const;

export function relayProposal(app: Hono, service: ProposalActionService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "relayQueue",
      path: "/relay/queue",
      summary: "Queue a succeeded proposal",
      description:
        "Broadcast the permissionless Governor queue() for a proposal in Succeeded state. The relayer pays gas. Proposal args are fetched from the Anticapture API and verified on-chain via hashProposal.",
      tags: ["relay"],
      request: {
        body: {
          content: {
            "application/json": { schema: RelayProposalRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: "Queue transaction submitted",
          content: {
            "application/json": { schema: RelayProposalResponseSchema },
          },
        },
        ...errorResponses,
      },
    }),
    async (c) => {
      const { proposalId } = c.req.valid("json");
      const { txHash } = await service.queue(proposalId.toString());
      return c.json({ transactionHash: txHash }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "relayExecute",
      path: "/relay/execute",
      summary: "Execute a queued proposal",
      description:
        "Broadcast the permissionless Governor execute() for a proposal in Queued state whose timelock eta has passed. The relayer pays gas. Proposal args are fetched from the Anticapture API and verified on-chain via hashProposal.",
      tags: ["relay"],
      request: {
        body: {
          content: {
            "application/json": { schema: RelayProposalRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: "Execute transaction submitted",
          content: {
            "application/json": { schema: RelayProposalResponseSchema },
          },
        },
        ...errorResponses,
      },
    }),
    async (c) => {
      const { proposalId } = c.req.valid("json");
      const { txHash } = await service.execute(proposalId.toString());
      return c.json({ transactionHash: txHash }, 200);
    },
  );
}
