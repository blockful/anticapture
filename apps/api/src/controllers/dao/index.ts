import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaysEnum } from "@/lib/enums";
import {
  DaoParametersRequestQuerySchema,
  DaoParametersResponseSchema,
} from "@/mappers";
import { DaoService } from "@/services";

export function dao(app: Hono, service: DaoService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "dao",
      path: "/dao",
      summary: "Get DAO governance parameters",
      description: "Returns current governance parameters for this DAO",
      tags: ["governance"],
      request: {
        query: DaoParametersRequestQuerySchema,
      },
      responses: {
        200: {
          description: "DAO governance parameters",
          content: {
            "application/json": {
              schema: DaoParametersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, fetchGovernanceData } = context.req.valid("query");
      const daoData = await service.getDaoParameters(
        fromDate || Math.floor(Date.now() / 1000) - DaysEnum["90d"],
        fetchGovernanceData,
      );
      return context.json(daoData, 200);
    },
  );
}
