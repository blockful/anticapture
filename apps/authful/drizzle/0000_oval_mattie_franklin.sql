CREATE SCHEMA IF NOT EXISTS "authful";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authful"."tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"rate_limit_per_min" integer DEFAULT 600 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tokens_tenant_index" ON "authful"."tokens" USING btree ("tenant");