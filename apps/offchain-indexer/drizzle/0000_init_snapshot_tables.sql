CREATE SCHEMA IF NOT EXISTS "snapshot";
--> statement-breakpoint
CREATE TABLE "snapshot"."proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"author" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"discussion" text DEFAULT '' NOT NULL,
	"type" text NOT NULL,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"state" text NOT NULL,
	"created" integer NOT NULL,
	"updated" integer NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot"."sync_status" (
	"entity" text PRIMARY KEY NOT NULL,
	"last_cursor" text,
	"last_synced_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot"."votes" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"voter" text NOT NULL,
	"proposal_id" text NOT NULL,
	"choice" jsonb NOT NULL,
	"vp" real NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "votes_proposal_id_idx" ON "snapshot"."votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "votes_voter_idx" ON "snapshot"."votes" USING btree ("voter");