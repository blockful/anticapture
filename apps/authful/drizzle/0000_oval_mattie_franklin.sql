CREATE SCHEMA "authful";
--> statement-breakpoint
CREATE TABLE "authful"."tokens" (
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
CREATE INDEX "tokens_tenant_index" ON "authful"."tokens" USING btree ("tenant");