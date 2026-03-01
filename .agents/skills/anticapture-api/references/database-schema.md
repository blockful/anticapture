# Database Schema

⚠️ **Important**: This schema is a **mapping** from the Indexer's Ponder schema.

**Workflow for schema changes**:

1. Change must originate in `apps/indexer/src/ponder.schema.ts`
2. Translate Ponder syntax to Drizzle format in `src/database/schema/`
3. Update relevant repositories and mappers
4. Update OpenAPI schemas in controllers
