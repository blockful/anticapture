CREATE TABLE "authful"."token_usage_batches" (
	"idempotency_key" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
