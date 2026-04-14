import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaoResponseSchema } from "@/mappers";
import { setCacheControl } from "@/middlewares";
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
      middleware: [setCacheControl(3600)],
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
      const daoData = await service.getDaoParameters();
      return context.json(daoData, 200);
    },
  );
}
