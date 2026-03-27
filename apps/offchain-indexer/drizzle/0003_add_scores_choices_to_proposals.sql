ALTER TABLE "snapshot"."proposals" ADD COLUMN "scores" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "snapshot"."proposals" ADD COLUMN "choices" jsonb DEFAULT '[]'::jsonb NOT NULL;
