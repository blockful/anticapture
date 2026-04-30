# Database

`apps/indexer/ponder.schema.ts` is the source of truth for indexed storage shape.

When schema changes:

1. Keep changes minimal and backward-compatible where possible.
2. Confirm affected event handlers still populate required fields.
3. Coordinate required mapping changes in `apps/api/src/database/schema.ts` and related repositories/mappers.
4. Reindex implications must be explicitly acknowledged before runtime execution.
