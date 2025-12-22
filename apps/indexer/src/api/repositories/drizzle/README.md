# Database-Agnostic Drizzle Repository

This repository implementation supports multiple PostgreSQL database clients through Ponder's abstraction layer.

## Supported Databases

- **PostgreSQL** via `node-postgres` (`NodePgDatabase`)
- **PGlite** - Embedded PostgreSQL (`PgliteDatabase`)

## Usage

### Default Usage (with Ponder's global db)

```typescript
import { DrizzleRepository } from "@/api/repositories/drizzle";

// Uses Ponder's global db instance
const repository = new DrizzleRepository();

// Use the repository methods
const proposals = await repository.getProposals(
  0,
  10,
  "desc",
  undefined,
  undefined,
  undefined,
);
```

### Custom Database Client

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { DrizzleRepository } from "@/api/repositories/drizzle";
import { DrizzleDB } from "@/api/database";
import postgres from "postgres";
import * as schema from "ponder:schema";

// Create a custom database client
const client = postgres(process.env.DATABASE_URL);
const customDb: DrizzleDB = drizzle(client, { schema });

// Inject the custom database client
const repository = new DrizzleRepository(customDb);

// Use the repository methods
const proposals = await repository.getProposals(
  0,
  10,
  "desc",
  undefined,
  undefined,
  undefined,
);
```

### Using PGlite

```typescript
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { DrizzleRepository } from "@/api/repositories/drizzle";
import { DrizzleDB } from "@/api/database";
import * as schema from "ponder:schema";

// Create a PGlite database client
const pglite = new PGlite("./pglite-data");
const db: DrizzleDB = drizzle(pglite, { schema });

// Use with the repository
const repository = new DrizzleRepository(db);
```

## Architecture

The implementation follows Ponder's type system pattern defined in:
`node_modules/ponder/src/types/db.ts`

```typescript
export type DrizzleDB =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;
```

This allows the repository to work seamlessly with any PostgreSQL-compatible database client that Drizzle supports.

## Benefits

1. **Testability**: Easily inject mock database clients for unit testing
2. **Flexibility**: Switch between PostgreSQL and PGlite without code changes
3. **Type Safety**: Full TypeScript support with proper type inference
4. **Ponder Compatible**: Works seamlessly with Ponder's global db instance
5. **Migration Ready**: Easy to migrate to different database implementations

## Testing Example

```typescript
import { DrizzleRepository } from "@/api/repositories/drizzle";
import { createMockDb } from "@/test/utils";

describe("DrizzleRepository", () => {
  it("should get proposals", async () => {
    const mockDb = createMockDb();
    const repository = new DrizzleRepository(mockDb);

    const proposals = await repository.getProposals(
      0,
      10,
      "desc",
      undefined,
      undefined,
      undefined,
    );

    expect(proposals).toBeDefined();
  });
});
```
