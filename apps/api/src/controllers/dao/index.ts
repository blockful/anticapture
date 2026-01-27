import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { DaoService } from "@/services";
import { DaoResponseSchema } from "@/mappers";

export function dao(app: Hono, service: DaoService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "dao",
      path: "/dao",
      summary: "Get DAO governance parameters",
      description: "Returns current governance parameters for this DAO",
      tags: ["governance"],
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
