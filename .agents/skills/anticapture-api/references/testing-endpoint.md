## Code Examples

### Controller (Hono + OpenAPI)

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
      const daoData = await service.getDaoParameters();
      return context.json(daoData, 200);
    },
  );
}
```

### Service

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

### Repository

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
