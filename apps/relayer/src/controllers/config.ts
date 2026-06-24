import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import type { RelayOperation } from "@/services/guards/rate-limiter";
import { ConfigResponseSchema } from "@/schemas/config";

interface ConfigControllerDeps {
  minVotingPower: string;
  limits: Record<RelayOperation, number>;
}

export function config(app: Hono, deps: ConfigControllerDeps) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getConfig",
      path: "/relay/config",
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
          limits: deps.limits,
        },
        200,
      ),
  );
}
