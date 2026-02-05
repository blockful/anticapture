import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

/**
 * Storage for address enrichment data.
 * Arkham data is permanent - once fetched, stored forever.
 * ENS data is cached with a configurable TTL (ens_updated_at tracks freshness).
 */
export const addressEnrichment = pgTable("address_enrichment", {
  address: varchar("address", { length: 42 }).primaryKey(),
  isContract: boolean("is_contract").notNull(),
  arkhamEntity: varchar("arkham_entity", { length: 255 }),
  arkhamEntityType: varchar("arkham_entity_type", { length: 100 }), // e.g., "cex", "dex", "defi"
  arkhamLabel: varchar("arkham_label", { length: 255 }),
  ensName: varchar("ens_name", { length: 255 }),
  ensAvatar: text("ens_avatar"),
  ensBanner: text("ens_banner"),
  ensUpdatedAt: timestamp("ens_updated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AddressEnrichment = typeof addressEnrichment.$inferSelect;
export type NewAddressEnrichment = typeof addressEnrichment.$inferInsert;
