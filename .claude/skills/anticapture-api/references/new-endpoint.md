# Creating Or Changing An Endpoint

Use this sequence when adding/changing a route in `apps/api`.

## 1) Controller

```typescript
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { DaoService } from "@/services";
import {
  DaoResponseSchema,
  DaosRequestParamsSchema,
  DaosRequestQuerySchema,
} from "@/mappers";

export function dao(app: Hono, service: DaoService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "dao",
      path: "/dao/:id",
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
      const { id } = context.req.valid("param");
      const { value } = context.req.valid("query");
      const daoData = await service.getDaoParameters(id, value);
      return context.json(daoData, 200);
    },
  );
}
```

## 2) Mapper/Input Schemas

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

## 3) Service

```typescript
interface DaoRepository {
  getDaoConfig(id: string): Promise<{
    id: string;
  }>;
}

export class DaoService {
  constructor(private repository: DaoRepository) {}

  async getDaoParameters(id: string, _value: bigint): Promise<{ id: string }> {
    return await this.repository.getDaoConfig(id);
  }
}
```

## 4) Repository

```typescript
import { db } from "@/database";
import { daoConfig } from "@/database/schema";
import { eq } from "drizzle-orm";

export class DaoRepository {
  async getDaoConfig(id: string) {
    return await db
      .select()
      .from(daoConfig)
      .where(eq(daoConfig.id, id))
      .limit(1);
  }
}
```

## 5) Validation Checklist

- Route is declared with `createRoute` and has response schema.
- Request params/query/body are validated in controller layer.
- Service coordinates business logic only.
- Repository only performs data access.
- Test coverage updated for happy path and validation error cases.
