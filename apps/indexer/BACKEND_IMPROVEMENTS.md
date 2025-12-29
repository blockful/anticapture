# Backend Architecture Improvements

**Author:** Senior Backend Engineer  
**Date:** December 2024  
**Context:** Observations while implementing the `/token-holders` endpoint

---

## 1. Dependency Injection & Service Composition

### Current State

Services are instantiated directly in `api/index.ts` with explicit repository dependencies:

```typescript
const accountBalanceRepo = new AccountBalanceRepository();
const accountInteractionRepo = new AccountInteractionsRepository();
const accountBalanceService = new BalanceVariationsService(
  accountBalanceRepo,
  accountInteractionRepo,
);
```

### Issues

- **Tight coupling**: The main file knows about all repositories and their composition
- **Testing friction**: Hard to mock dependencies for unit tests
- **Growing complexity**: Each new endpoint adds more instantiation code to `index.ts`

### Recommendation

Consider a DI container or a factory pattern:

```typescript
// Option A: Factory pattern
// api/factories/services.factory.ts
export const createTokenHoldersService = () => {
  return new TokenHoldersService(new TokenHoldersRepository());
};

// Option B: Simple DI container
// api/container.ts
export const container = {
  tokenHoldersService: () =>
    new TokenHoldersService(new TokenHoldersRepository()),
  // lazy singleton if needed
};
```

---

## 2. Repository Interface Duplication

### Current State

Each service defines its own repository interface inline:

```typescript
// services/token-holders/index.ts
interface TokenHoldersRepository {
  getTokenHolders(...): Promise<TokenHoldersResult>;
}

export class TokenHoldersService {
  constructor(private readonly repository: TokenHoldersRepository) {}
}
```

### Issues

- **Duplication**: The interface is defined in the service but implemented in the repository
- **No type safety**: TypeScript can't verify the repository implements the interface
- **Maintenance burden**: Changes require updates in two places

### Recommendation

Define interfaces in a shared location:

```typescript
// api/interfaces/token-holders.interface.ts
export interface ITokenHoldersRepository {
  getTokenHolders(...): Promise<TokenHoldersResult>;
}

// repositories/token-holders/index.ts
export class TokenHoldersRepository implements ITokenHoldersRepository {
  // ...
}

// services/token-holders/index.ts
import { ITokenHoldersRepository } from "@/api/interfaces";

export class TokenHoldersService {
  constructor(private readonly repository: ITokenHoldersRepository) {}
}
```

---

## 3. Error Handling Consistency

### Current State

The global error handler exists (`api/middlewares/errorHandler.ts`), but individual endpoints don't throw typed errors consistently.

### Issues

- No distinction between client errors (4xx) and server errors (5xx)
- Database errors bubble up with raw messages
- Missing request validation for some edge cases

### Recommendation

Create custom error classes:

```typescript
// api/errors/index.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
  }
}
```

---

## 4. Query Performance Concerns

### Current State

The token-holders query joins three derived tables (account_balance + two transfer aggregations):

```sql
SELECT ... FROM account_balance
LEFT JOIN transfers_from ON ...
LEFT JOIN transfers_to ON ...
```

### Issues

- **N+1 potential**: Two separate count queries (items + total)
- **No indexes**: The `transfer` table may lack indexes on `timestamp` + `from_account_id` / `to_account_id`
- **Full table scan**: Large time ranges scan entire transfer history

### Recommendations

1. **Add composite indexes** to Ponder schema:

```typescript
// ponder.schema.ts
export const transfer = onchainTable(
  "transfers",
  (drizzle) => ({ ... }),
  (table) => ({
    // Add:
    transferTimestampFromIdx: index().on(table.timestamp, table.fromAccountId),
    transferTimestampToIdx: index().on(table.timestamp, table.toAccountId),
  }),
);
```

2. **Use window functions** for count:

```sql
SELECT *, COUNT(*) OVER() as total_count
FROM combined
LIMIT $limit OFFSET $skip
```

3. **Consider materialized views** for pre-computed variations (if query becomes slow)

---

## 5. Pagination Strategy

### Current State

Mixed pagination strategies:

- GraphQL uses cursor-based pagination (`after`, `before`)
- REST endpoints use offset-based (`skip`, `limit`)

### Issues

- Inconsistent API experience
- Offset pagination is inefficient for large offsets
- No standardized page info response

### Recommendation

Standardize on cursor-based pagination for REST endpoints:

```typescript
// Cursor = base64(lastItemId:sortValue)
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  direction: z.enum(["next", "prev"]).default("next"),
});

// Response includes:
{
  items: [...],
  pageInfo: {
    hasNextPage: boolean,
    hasPrevPage: boolean,
    nextCursor: string | null,
    prevCursor: string | null,
  }
}
```

---

## 6. Request/Response Type Safety

### Current State

Zod schemas define validation, but types are inferred:

```typescript
export type TokenHoldersRequest = z.infer<typeof TokenHoldersRequestSchema>;
```

### Issues

- Schema transformations (e.g., `days` enum → number) create type mismatches
- Controller handler doesn't get strong typing from OpenAPI route

### Recommendation

Use Hono's type-safe route helpers:

```typescript
import { createRoute, z } from "@hono/zod-openapi";

const route = createRoute({
  method: "get",
  path: "/token-holders",
  request: { query: TokenHoldersRequestSchema },
  responses: {
    200: {
      content: { "application/json": { schema: TokenHoldersResponseSchema } },
    },
  },
});

// Handler gets typed context
app.openapi(route, (c) => {
  const query = c.req.valid("query"); // Fully typed!
});
```

---

## 7. Testing Strategy

### Current State

- Test files exist but coverage appears limited
- No integration tests for API endpoints
- Mocking database queries is difficult

### Recommendations

1. **Repository tests** with test database:

```typescript
describe("TokenHoldersRepository", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  it("should return holders sorted by variation", async () => {
    const repo = new TokenHoldersRepository();
    const result = await repo.getTokenHolders(...);
    expect(result.items[0].variation).toBeGreaterThan(result.items[1].variation);
  });
});
```

2. **Controller tests** with supertest:

```typescript
describe("GET /token-holders", () => {
  it("should filter by delegate", async () => {
    const res = await request(app)
      .get("/token-holders?delegate=nonzero")
      .expect(200);

    expect(res.body.items.every((i) => i.delegate !== zeroAddress)).toBe(true);
  });
});
```

3. **Service tests** with mocked repositories

---

## 8. Documentation & OpenAPI

### Current State

OpenAPI docs are auto-generated from Zod schemas, which is good.

### Improvements

- Add example values to schemas for better Swagger UI experience
- Document error responses (400, 404, 500)
- Add rate limiting headers documentation

```typescript
export const TokenHoldersRequestSchema = z.object({
  days: z.enum(DaysOpts).optional().default("90d").openapi({
    example: "30d",
    description: "Time period for variation calculation",
  }),
});
```

---

## Priority Matrix

| Improvement                 | Impact | Effort | Priority |
| --------------------------- | ------ | ------ | -------- |
| Query performance (indexes) | High   | Low    | **P0**   |
| Error handling              | Medium | Medium | P1       |
| Repository interfaces       | Medium | Low    | P1       |
| DI / Factory pattern        | Medium | Medium | P2       |
| Pagination standardization  | Medium | High   | P2       |
| Testing strategy            | High   | High   | P2       |
| Documentation               | Low    | Low    | P3       |

---

## Summary

The codebase follows reasonable patterns for a Ponder-based indexer with Hono API. The main areas for improvement are:

1. **Performance**: Add database indexes for time-range queries
2. **Maintainability**: Centralize interfaces and use DI patterns
3. **Reliability**: Standardize error handling and add comprehensive tests
4. **Consistency**: Align pagination strategies across GraphQL and REST

These improvements can be implemented incrementally without major refactoring.
