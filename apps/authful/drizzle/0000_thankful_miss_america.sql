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
CREATE TABLE "authful"."usage_hourly" (
	"token_id" uuid NOT NULL,
	"route" text NOT NULL,
	"hour" timestamp with time zone NOT NULL,
	"count" bigint NOT NULL,
	CONSTRAINT "usage_hourly_token_id_route_hour_pk" PRIMARY KEY("token_id","route","hour")
);
--> statement-breakpoint
ALTER TABLE "authful"."usage_hourly" ADD CONSTRAINT "usage_hourly_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "authful"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tokens_tenant_index" ON "authful"."tokens" USING btree ("tenant");