# API Package Guide

## Overview

- **Service ID**: `<dao>-api`
- **Port**: 42069 (configurable via `PORT` env var)
- **Stack**: Hono 4.7, Drizzle ORM 0.41, @hono/zod-openapi 0.19, pg 8.17
- **Purpose**: REST API serving governance data from the indexer with OpenAPI documentation

## What It Does

- Serves governance data indexed by the Indexer
- Exposes RESTful endpoints with OpenAPI/Swagger documentation
- Consumed by the API Gateway to create a unified GraphQL API
- Provides `/docs` endpoint with interactive OpenAPI spec

## Commands

```bash
# Development
pnpm api dev                    # Start dev server on :42069

# Testing
pnpm api test                   # Run Jest unit tests
pnpm api test:watch             # Run tests in watch mode

# Verification (run after every change)
pnpm api typecheck              # Type checking
pnpm api lint                   # Lint checking
pnpm api lint:fix               # Auto-fix lint issues
```

## Dependencies

- **PostgreSQL**: With data populated by the Indexer
- **Ethereum RPC**: For some real-time queries
- **Indexer**: Must have run to populate database

## Architecture

The API follows a **layered architecture**:

```
Controller (route + validation)
    ↓
Service (business logic)
    ↓
Repository (DB queries) ← → Client (external APIs)
    ↓
Mapper (DB → API response)
```

### Layer Responsibilities

- **Controllers**: Define routes, validate requests, handle responses
- **Services**: Implement business logic, orchestrate repositories and clients
- **Repositories**: Execute database queries using Drizzle ORM
- **Clients**: Interact with external APIs (CoinGecko, Dune, etc.)
- **Mappers**: Transform database models to API response DTOs

## File Structure

```
apps/api/
├── src/
│   ├── controllers/
│   │   └── <domain>/           # Route definitions + OpenAPI specs
│   ├── services/
│   │   └── <domain>/           # Business logic
│   ├── repositories/
│   │   └── <domain>/           # Database queries
│   ├── mappers/
│   │   └── <domain>/           # Data transformation
│   ├── clients/
│   │   └── <service>/          # External API integrations
│   ├── database/
│   │   └── schema/             # Drizzle ORM schema definitions
│   ├── config/                 # Configuration files
│   └── index.ts                # Application entry point
├── tests/                      # Jest test files
└── jest.config.js              # Jest configuration
```

## Where to Put New Code

| What you're adding       | Where it goes                |
| ------------------------ | ---------------------------- |
| New API endpoint         | `src/controllers/<domain>/`  |
| Business logic           | `src/services/<domain>/`     |
| Database query           | `src/repositories/<domain>/` |
| Data transformation      | `src/mappers/<domain>/`      |
| External API integration | `src/clients/<service>/`     |
| Database schema          | `src/database/schema/`       |

## Database Schema

⚠️ **Important**: This schema is a **mapping** from the Indexer's Ponder schema.

**Workflow for schema changes**:

1. Change must originate in `apps/indexer/src/ponder.schema.ts`
2. Get approval (triggers reindex + API changes)
3. Translate Ponder syntax to Drizzle format in `src/database/schema/`
4. Update relevant repositories and mappers
5. Update OpenAPI schemas in controllers

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
import { DaoRepository } from "@/repositories";
import { mapDaoToResponse } from "@/mappers";

export class DaoService {
  constructor(private repository: DaoRepository) {}

  async getDaoParameters() {
    const daoData = await this.repository.getDaoConfig();
    return mapDaoToResponse(daoData);
  }
}
```

### Repository

```typescript
import { db } from "@/database";
import { daoConfig } from "@/database/schema";
import { eq } from "drizzle-orm";

export class DaoRepository {
  async getDaoConfig() {
    return await db.select().from(daoConfig).limit(1);
  }
}
```

## Testing Strategy

- **Unit tests**: Test services and repositories in isolation
- **Integration tests**: Test full request/response flow
- **Mocking**: Use Jest mocks for external dependencies

```typescript
// Example test
describe("DaoService", () => {
  it("should return DAO parameters", async () => {
    const mockRepo = { getDaoConfig: jest.fn().mockResolvedValue({...}) };
    const service = new DaoService(mockRepo);

    const result = await service.getDaoParameters();

    expect(result).toBeDefined();
    expect(mockRepo.getDaoConfig).toHaveBeenCalled();
  });
});
```

## Development Workflow

1. **Define OpenAPI schema** in controller
2. **Implement service logic** with business rules
3. **Create repository** for database queries
4. **Add mapper** for data transformation
5. **Write tests** for new functionality
6. **Verify**: `pnpm api typecheck && pnpm api lint && pnpm api test`
7. **Test manually**: Visit `http://localhost:42069/docs` for Swagger UI

## Common Issues

- **Database connection errors**: Ensure PostgreSQL is running with indexer data
- **OpenAPI validation errors**: Check schema definitions match response types
- **Type errors**: Ensure Drizzle schema matches Ponder schema structure

## Related Documentation

- [Hono Documentation](https://hono.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- Root `AGENTS.md` for general guidelines
- `apps/indexer/AGENTS.md` for source schema
- `apps/api-gateway/AGENTS.md` for OpenAPI consumption
