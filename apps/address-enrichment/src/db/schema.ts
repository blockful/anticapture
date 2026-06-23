import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Storage for address enrichment data.
 * Arkham data is permanent - once fetched, stored forever.
 * ENS data (name, avatar, banner, socials) and EFP stats (follower/following
 * counts) are cached together with a configurable TTL (ens_updated_at tracks
 * freshness for all of them).
 */
export const addressEnrichment = pgTable("address_enrichment", {
  address: varchar("address", { length: 42 }).primaryKey(),
  isContract: boolean("is_contract").notNull(),
  arkhamEntity: varchar("arkham_entity", { length: 255 }),
  arkhamEntityType: varchar("arkham_entity_type", { length: 100 }), // e.g., "cex", "dex", "defi"
  arkhamLabel: varchar("arkham_label", { length: 255 }),
  arkhamTwitter: varchar("arkham_twitter", { length: 255 }),
  ensName: varchar("ens_name", { length: 255 }),
  ensAvatar: text("ens_avatar"),
  ensBanner: text("ens_banner"),
  ensTwitter: varchar("ens_twitter", { length: 255 }),
  ensTelegram: varchar("ens_telegram", { length: 255 }),
  ensEmail: varchar("ens_email", { length: 255 }),
  ensGithub: varchar("ens_github", { length: 255 }),
  efpFollowers: integer("efp_followers"),
  efpFollowing: integer("efp_following"),
  ensUpdatedAt: timestamp("ens_updated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AddressEnrichment = typeof addressEnrichment.$inferSelect;
export type NewAddressEnrichment = typeof addressEnrichment.$inferInsert;
