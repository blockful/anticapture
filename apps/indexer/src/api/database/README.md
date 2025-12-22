# Database Abstraction Layer

This module provides a centralized, database-agnostic abstraction for Drizzle ORM clients across the indexer application.

## Overview

The `DrizzleDB` type supports multiple PostgreSQL-compatible database implementations through Ponder's abstraction pattern, allowing repositories to work seamlessly with different database drivers.

## Supported Databases

- **PostgreSQL** - Production database via `node-postgres` driver (`NodePgDatabase`)
- **PGlite** - Embedded PostgreSQL for testing/development (`PgliteDatabase`)

## Core Exports

### `DrizzleDB` Type

```typescript
export type DrizzleDB =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;
```

A union type that accepts any Ponder-compatible database client. This follows the same pattern as Ponder's internal type system.

### `getDbClient()` Function

```typescript
export function getDbClient(dbClient?: DrizzleDB): DrizzleDB;
```

Helper function that:

1. Returns the provided `dbClient` if one is passed
2. Falls back to Ponder's global `db` instance
3. Throws an error if neither is available

## Usage in Repositories

### Basic Pattern

```typescript
import { DrizzleDB } from "@/api/database";

export class MyRepository {
  constructor(private readonly db: DrizzleDB) {}

  async getData() {
    return await this.db.select().from(myTable);
  }
}
```

### Optional Database Client Pattern

For repositories that need to support both dependency injection and global db:

```typescript
import { DrizzleDB, getDbClient } from "@/api/database";

export class MyRepository {
  private db: DrizzleDB;

  constructor(dbClient?: DrizzleDB) {
    this.db = getDbClient(dbClient);
  }

  async getData() {
    return await this.db.select().from(myTable);
  }
}
```

## Implementation Details

### Design Principles

1. **Single Source of Truth**: All database type definitions are centralized in this module
2. **Dependency Injection**: Repositories accept database clients via constructor
3. **Backward Compatibility**: Supports Ponder's global `db` instance as fallback
4. **Type Safety**: Full TypeScript type inference across all database operations

### Files Using This Module

- `DrizzleRepository` - General drizzle operations
- `VotingPowerRepository` - Voting power queries
- `NounsVotingPowerRepository` - Nouns-specific voting power queries
- Additional repositories as they are migrated

## Testing

### Using a Custom Database Client

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { MyRepository } from "@/api/repositories/my-repository";
import { DrizzleDB } from "@/api/database";
import postgres from "postgres";
import * as schema from "ponder:schema";

// Test setup
const testClient = postgres("postgresql://test:test@localhost:5432/test");
const testDb: DrizzleDB = drizzle(testClient, { schema });

// Inject into repository
const repository = new MyRepository(testDb);

// Run tests
expect(await repository.getData()).toBeDefined();
```

### Using PGlite for Fast Tests

```typescript
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { DrizzleDB } from "@/api/database";

const pglite = new PGlite();
const db: DrizzleDB = drizzle(pglite, { schema });
const repository = new MyRepository(db);
```

## Migration Guide

To migrate a repository to use this abstraction:

1. Import the `DrizzleDB` type:

   ```typescript
   import { DrizzleDB } from "@/api/database";
   ```

2. Add constructor parameter:

   ```typescript
   constructor(private readonly db: DrizzleDB) {}
   ```

3. Replace all `db` references with `this.db`

4. Update instantiation in `api/index.ts`:
   ```typescript
   import { db } from "ponder:api";
   const myRepo = new MyRepository(db);
   ```

## Benefits

✅ **Testability** - Easy to inject mock databases for unit tests
✅ **Flexibility** - Switch between PostgreSQL implementations without code changes
✅ **Type Safety** - Full TypeScript support with proper type inference
✅ **Consistency** - Single pattern for all database access
✅ **Maintainability** - Centralized database type definitions
