import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { ProposalsService } from "@/api/services/proposals/proposals";
import { ProposalsResponseSchema, ProposalsRequestSchema } from "../mappers";

export function proposals(app: Hono, service: ProposalsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalsActivity",
      path: "/proposals",
      summary: "Get proposals for delegate",
      description: "Returns a list of proposal",
      tags: ["proposals"],
      request: {
        query: ProposalsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: ProposalsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { skip, limit, orderDirection } = context.req.valid("query");

      const result = await service.getProposals({
        skip,
        limit,
        orderDirection,
      });

      return context.json(result, 200);
    },
  );
}
