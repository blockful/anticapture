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
pnpm api test                   # Run Vitest unit tests
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
├── tests/                      # Vitest test files
└── vitest.config.ts            # Vitest configuration
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
- **Test doubles**: Use in-memory repository implementations instead of mocks
- **Assertions**: Use `toEqual` with the full expected object to verify exact output. Pass explicit values to factory/builder functions and assert those same values appear in the response — never use `expect.anything()` or partial matchers

### Repository Tests

Repository tests run against a real in-process PostgreSQL instance using **PGlite** — no Docker, no external dependencies. The schema is pushed with `pushSchema` from `drizzle-kit/api`.

**Setup pattern**:

```typescript
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/database/schema";
import { myTable } from "@/database/schema";
import { MyRepository } from "./my-repository";

type MyTableInsert = typeof myTable.$inferInsert;

// Named constants — typed at declaration so no `as` casts are needed later
const OWNER: Address = "0x1111111111111111111111111111111111111111";
const ENTITY_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ENTITY_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ENTITY_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

// Counter to guarantee unique keys across inserts
let counter = 0;

// Factory with sensible defaults; override only what the test cares about
const createRow = (overrides: Partial<MyTableInsert> = {}): MyTableInsert => ({
  id: `id-${counter++}`,
  value: 1000n,
  ...overrides,
});

// Sort factory — tests only override what they care about
const defaultSort = (overrides: Partial<SortOptions> = {}): SortOptions => ({
  orderBy: "value",
  orderDirection: "desc",
  ...overrides,
});

describe("MyRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: MyRepository;

  beforeAll(async () => {
    // Required so BigInt values serialize correctly in assertions
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new MyRepository(db);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  // Reset data and counter before each test for full isolation
  beforeEach(async () => {
    await db.delete(myTable);
    counter = 0;
  });

  describe("getItems", () => {
    it("should return items and totalCount", async () => {
      await db
        .insert(myTable)
        .values([createRow({ id: ENTITY_A, value: 500n })]);

      const result = await repository.getItems(ENTITY_A, 0, 10, defaultSort());

      expect(result).toEqual({
        items: [{ id: ENTITY_A, value: 500n }],
        totalCount: 1,
      });
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getItems(ENTITY_A, 0, 10, defaultSort());

      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    describe("sorting", () => {
      // Seed shared data once for all sorting tests
      beforeEach(async () => {
        await db
          .insert(myTable)
          .values([
            createRow({ id: ENTITY_A, value: 200n, timestamp: 2000n }),
            createRow({ id: ENTITY_B, value: 300n, timestamp: 1000n }),
            createRow({ id: ENTITY_C, value: 100n, timestamp: 3000n }),
          ]);
      });

      it("should order by value descending", async () => {
        const result = await repository.getItems(
          OWNER,
          0,
          10,
          defaultSort({ orderBy: "value", orderDirection: "desc" }),
        );

        expect(result).toEqual({
          items: [
            { id: ENTITY_B, value: 300n, timestamp: 1000n },
            { id: ENTITY_A, value: 200n, timestamp: 2000n },
            { id: ENTITY_C, value: 100n, timestamp: 3000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by value ascending", async () => {
        const result = await repository.getItems(
          OWNER,
          0,
          10,
          defaultSort({ orderBy: "value", orderDirection: "asc" }),
        );

        expect(result).toEqual({
          items: [
            { id: ENTITY_C, value: 100n, timestamp: 3000n },
            { id: ENTITY_A, value: 200n, timestamp: 2000n },
            { id: ENTITY_B, value: 300n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by timestamp descending", async () => {
        const result = await repository.getItems(
          OWNER,
          0,
          10,
          defaultSort({ orderBy: "timestamp", orderDirection: "desc" }),
        );

        expect(result).toEqual({
          items: [
            { id: ENTITY_C, value: 100n, timestamp: 3000n },
            { id: ENTITY_A, value: 200n, timestamp: 2000n },
            { id: ENTITY_B, value: 300n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by timestamp ascending", async () => {
        const result = await repository.getItems(
          OWNER,
          0,
          10,
          defaultSort({ orderBy: "timestamp", orderDirection: "asc" }),
        );

        expect(result).toEqual({
          items: [
            { id: ENTITY_B, value: 300n, timestamp: 1000n },
            { id: ENTITY_A, value: 200n, timestamp: 2000n },
            { id: ENTITY_C, value: 100n, timestamp: 3000n },
          ],
          totalCount: 3,
        });
      });
    });

    describe("pagination", () => {
      // Seed shared data once for all pagination tests
      beforeEach(async () => {
        await db
          .insert(myTable)
          .values([
            createRow({ id: ENTITY_A, value: 300n, timestamp: 3000n }),
            createRow({ id: ENTITY_B, value: 200n, timestamp: 2000n }),
            createRow({ id: ENTITY_C, value: 100n, timestamp: 1000n }),
          ]);
      });

      it("should apply skip", async () => {
        const result = await repository.getItems(OWNER, 1, 10, defaultSort());

        expect(result).toEqual({
          items: [
            { id: ENTITY_B, value: 200n, timestamp: 2000n },
            { id: ENTITY_C, value: 100n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should apply limit", async () => {
        const result = await repository.getItems(OWNER, 0, 2, defaultSort());

        expect(result).toEqual({
          items: [
            { id: ENTITY_A, value: 300n, timestamp: 3000n },
            { id: ENTITY_B, value: 200n, timestamp: 2000n },
          ],
          totalCount: 3,
        });
      });

      it("should return totalCount independent of pagination", async () => {
        const result = await repository.getItems(OWNER, 1, 1, defaultSort());

        expect(result).toEqual({
          items: [{ id: ENTITY_B, value: 200n, timestamp: 2000n }],
          totalCount: 3,
        });
      });
    });
  });
});
```

**Key rules**:

- Use `PGlite` (in-process) — never Testcontainers or a real Postgres server for repository unit tests
- Push the full Drizzle schema once in `beforeAll` with `pushSchema`
- Delete all rows and reset counters in `beforeEach` to isolate every test
- Patch `BigInt.prototype.toJSON` in `beforeAll` so BigInt values can be compared with `toEqual`
- Define named address/ID constants at the top; avoid magic strings inside tests
- **No type casting** — never use `as SomeType`, `as Address`, or `as unknown as T`; declare constants with the correct type at definition (`const OWNER: Address = "0x..."`) so the compiler validates them without casts
- Use factory functions with `Partial<T>` overrides — only pass what the test needs to control
- Use `toEqual` with the full expected object; never use `expect.anything()` or partial matchers
- Cover: happy path, empty state, filter/scope correctness, aggregation, edge values (zero, duplicates), sorting variants, and pagination (`skip`/`limit` with `totalCount` independent of page)

### Service Tests

```typescript
// In-memory repository implementing the same interface
class InMemoryDaoRepository {
  private data: DaoConfig[];

  constructor(data: DaoConfig[]) {
    this.data = data;
  }

  async getDaoConfig() {
    return this.data;
  }
}

// Example test
describe("DaoService", () => {
  it("should return DAO parameters", async () => {
    const repository = new InMemoryDaoRepository([
      { name: "Uniswap", quorum: 40_000_000n, proposalThreshold: 2_500_000n },
    ]);
    const service = new DaoService(repository);

    const result = await service.getDaoParameters();

    expect(result).toEqual({
      name: "Uniswap",
      quorum: "40000000",
      proposalThreshold: "2500000",
    });
  });
});
```

## Development Workflow

1. **Define OpenAPI schema** in mappers using Zod
2. **Create repository** for database queries
3. **Implement service logic** with business rules injecting an abstraction of the repository
4. **Add the route** as a controller
5. **Write tests** for new functionality
6. **Verify**: `pnpm api typecheck && pnpm api lint && pnpm api test`
7. **Test manually**:
   1. Run `pnpm api dev`
   2. Make requests varying the parameters to see how the API responds

Every time a new endpoint/parameter is added/changed, the codegen files should be updated:

1. run the API locally
2. run the gateway pointing to the given API
3. run the client pointing to the local gateway
4. commit the generated files

## Common Issues

- **Type errors**: Ensure Drizzle schema matches Ponder schema structure

## Related Documentation

- [Hono Documentation](https://hono.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- Root `AGENTS.md` for general guidelines
- `apps/indexer/AGENTS.md` for source schema
- `apps/api-gateway/AGENTS.md` for OpenAPI consumption
