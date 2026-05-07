import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { ConfigResponseSchema } from "@/schemas/config";

interface ConfigControllerDeps {
  minVotingPower: string;
  maxRelayPerAddressPerDay: number;
}

export function config(app: Hono, deps: ConfigControllerDeps) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getConfig",
      path: "/config",
      summary: "Public relayer configuration",
      description:
        "Returns the static configuration values the dashboard needs to render eligibility hints.",
      tags: ["system"],
      responses: {
        200: {
          description: "Relayer configuration",
          content: {
            "application/json": { schema: ConfigResponseSchema },
          },
        },
      },
    }),
    async (c) =>
      c.json(
        {
          minVotingPower: deps.minVotingPower,
          maxRelayPerAddressPerDay: deps.maxRelayPerAddressPerDay,
        },
        200,
      ),
  );
}
