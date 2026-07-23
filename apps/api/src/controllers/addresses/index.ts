import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { AddressLabelsResponseSchema } from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { AddressLabelsService } from "@/services";

export function addressLabels(app: Hono, service: AddressLabelsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "addressLabels",
      path: "/addresses/labels",
      summary: "Get labeled addresses",
      description:
        "Returns the DAO's known labeled addresses (treasury and vesting contracts)",
      tags: ["addresses"],
      middleware: [setCacheControl(60)],
      responses: {
        200: {
          description: "Successfully retrieved labeled addresses",
          content: {
            "application/json": {
              schema: AddressLabelsResponseSchema,
            },
          },
        },
      },
    }),
    (context) => {
      const result = service.getAddressLabels();
      return context.json(AddressLabelsResponseSchema.parse(result), 200);
    },
  );
}
