CREATE SCHEMA IF NOT EXISTS "general";
--> statement-breakpoint
CREATE TABLE "general"."proposal_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"dao_id" text NOT NULL,
	"author" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"discussion_url" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "proposal_drafts_author_index" ON "general"."proposal_drafts" USING btree ("author");--> statement-breakpoint
CREATE INDEX "proposal_drafts_dao_id_index" ON "general"."proposal_drafts" USING btree ("dao_id");