# Creating or changing a new endpoint

## Controller

Where the endpoint definition lives, with the responses and error handling.

```typescript
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
      tags: ["governance"],
      request: {
        params: DaosRequestParamsSchema,
        query: DaosRequestQuerySchema,
      },
      responses: {
        200: {
          description: "DAO governance parameters",
          content: {
            "application/json": { schema: DaoResponseSchema },
          },
        },
      },
    }),
    async (context) => {
      const { id } = req.valid("params");
      const { value } = req.valid("query");
      const daoData = await service.getDaoParameters(id, value);
      return context.json(daoData, 200);
    },
  );
}
```

## Mappers

Validation of route params, responses and types.

```typescript
export const DaosRequestParamsSchema = z.object({
  id: z.string(),
});

export const DaosRequestQuerySchema = z.object({
  value: z.string().transform((val) => BigInt(val)),
});

export type DaosRequestQuery = z.infer<typeof DaosRequestQuerySchema>;
```

## Service

```typescript
import { mapDaoToResponse } from "@/mappers";

interface DaoRepository {
  getDaoConfig(): Promise<{}>;
}

export class DaoService {
  constructor(private repository: DaoRepository) {}

  async getDaoParameters() {
    return await this.repository.getDaoConfig();
  }
}
```

## Repository

```typescript
import { db } from "@/database";
import { daoConfig } from "@/database/schema";
import { eq } from "drizzle-orm";

export class DaoRepository {
  async getDaoConfig(): Promise<{}> {
    return await db.select().from(daoConfig).limit(1);
  }
}
```
