ALTER TABLE "snapshot"."proposals" ADD COLUMN "network" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshot"."proposals" ADD COLUMN "snapshot" integer;--> statement-breakpoint
ALTER TABLE "snapshot"."proposals" ADD COLUMN "strategies" jsonb DEFAULT '[]'::jsonb NOT NULL;