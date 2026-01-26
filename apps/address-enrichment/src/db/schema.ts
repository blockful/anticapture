import { pgTable, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Permanent storage for address enrichment data.
 * No TTL, no deletion - once fetched, data is stored forever.
 * This ensures data availability even if Arkham API access is lost.
 */
export const addressEnrichment = pgTable("address_enrichment", {
  address: varchar("address", { length: 42 }).primaryKey(),
  isContract: boolean("is_contract").notNull(),
  arkhamEntity: varchar("arkham_entity", { length: 255 }),
  arkhamEntityType: varchar("arkham_entity_type", { length: 100 }), // e.g., "cex", "dex", "defi"
  arkhamLabel: varchar("arkham_label", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AddressEnrichment = typeof addressEnrichment.$inferSelect;
export type NewAddressEnrichment = typeof addressEnrichment.$inferInsert;
