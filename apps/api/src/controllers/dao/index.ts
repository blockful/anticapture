import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaysEnum } from "@/lib/enums";
import { DaoRequestQuerySchema, DaoResponseSchema } from "@/mappers";
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
        query: DaoRequestQuerySchema,
      },
      responses: {
        200: {
          description: "DAO governance parameters",
          content: {
            "application/json": {
              schema: DaoResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate } = context.req.valid("query");
      const daoData = await service.getDaoParameters(
        fromDate || Math.floor(Date.now() / 1000) - DaysEnum["90d"],
      );
      return context.json(daoData, 200);
    },
  );
}
