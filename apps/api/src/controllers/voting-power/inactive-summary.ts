import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  InactiveVotingPowerSummaryRequestSchema,
  InactiveVotingPowerSummaryResponseSchema,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { InactiveVotingPowerSummaryService } from "@/services";

export function inactiveVotingPowerSummary(
  app: Hono,
  service: InactiveVotingPowerSummaryService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "inactiveVotingPowerSummary",
      path: "/voting-powers/inactive-summary",
      summary: "Get inactive delegated voting power summary",
      description:
        "Returns the share of delegated voting power assigned to delegates that cast zero votes on proposals whose voting period falls within the given time window",
      tags: ["voting-power"],
      middleware: [setCacheControl(60)],
      request: {
        query: InactiveVotingPowerSummaryRequestSchema,
      },
      responses: {
        200: {
          description:
            "Successfully retrieved inactive delegated voting power summary",
          content: {
            "application/json": {
              schema: InactiveVotingPowerSummaryResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, toDate } = context.req.valid("query");
      const result = await service.getInactiveVotingPowerSummary(
        fromDate,
        toDate,
      );
      return context.json(
        InactiveVotingPowerSummaryResponseSchema.parse(result),
        200,
      );
    },
  );
}
