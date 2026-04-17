CREATE SCHEMA IF NOT EXISTS anticapture;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'event_type' AND n.nspname = 'anticapture') THEN CREATE TYPE "anticapture"."event_type" AS ENUM('VOTE', 'PROPOSAL', 'DELEGATION', 'TRANSFER', 'DELEGATION_VOTES_CHANGED', 'PROPOSAL_EXTENDED'); END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'metricType' AND n.nspname = 'anticapture') THEN CREATE TYPE "anticapture"."metricType" AS ENUM('TOTAL_SUPPLY', 'DELEGATED_SUPPLY', 'CEX_SUPPLY', 'DEX_SUPPLY', 'LENDING_SUPPLY', 'CIRCULATING_SUPPLY', 'TREASURY'); END IF; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_balance" (
	"account_id" text NOT NULL,
	"token_id" text NOT NULL,
	"balance" bigint NOT NULL,
	"delegate" text DEFAULT '0x0000000000000000000000000000000000000000' NOT NULL,
	CONSTRAINT "account_balance_account_id_token_id_pk" PRIMARY KEY("account_id","token_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_power" (
	"account_id" text NOT NULL,
	"dao_id" text NOT NULL,
	"voting_power" bigint DEFAULT 0 NOT NULL,
	"votes_count" integer DEFAULT 0 NOT NULL,
	"proposals_count" integer DEFAULT 0 NOT NULL,
	"delegations_count" integer DEFAULT 0 NOT NULL,
	"last_vote_timestamp" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "account_power_account_id_pk" PRIMARY KEY("account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "balance_history" (
	"transaction_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"account_id" text NOT NULL,
	"balance" bigint NOT NULL,
	"delta" bigint NOT NULL,
	"delta_mod" bigint NOT NULL,
	"timestamp" bigint NOT NULL,
	"log_index" integer NOT NULL,
	CONSTRAINT "balance_history_transaction_hash_account_id_log_index_pk" PRIMARY KEY("transaction_hash","account_id","log_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dao_metrics_day_buckets" (
	"date" bigint NOT NULL,
	"dao_id" text NOT NULL,
	"token_id" text NOT NULL,
	"metricType" "metricType" NOT NULL,
	"open" bigint NOT NULL,
	"close" bigint NOT NULL,
	"low" bigint NOT NULL,
	"high" bigint NOT NULL,
	"average" bigint NOT NULL,
	"volume" bigint NOT NULL,
	"count" integer NOT NULL,
	"last_update" bigint NOT NULL,
	CONSTRAINT "dao_metrics_day_buckets_date_token_id_metricType_pk" PRIMARY KEY("date","token_id","metricType")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delegations" (
	"transaction_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"delegate_account_id" text NOT NULL,
	"delegator_account_id" text NOT NULL,
	"delegated_value" bigint DEFAULT 0 NOT NULL,
	"previous_delegate" text,
	"timestamp" bigint NOT NULL,
	"log_index" integer NOT NULL,
	"is_cex" boolean DEFAULT false NOT NULL,
	"is_dex" boolean DEFAULT false NOT NULL,
	"is_lending" boolean DEFAULT false NOT NULL,
	"is_total" boolean DEFAULT false NOT NULL,
	CONSTRAINT "delegations_transaction_hash_delegator_account_id_delegate_account_id_pk" PRIMARY KEY("transaction_hash","delegator_account_id","delegate_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_event" (
	"tx_hash" text NOT NULL,
	"log_index" integer NOT NULL,
	"type" "event_type" NOT NULL,
	"value" bigint DEFAULT 0 NOT NULL,
	"timestamp" bigint NOT NULL,
	"metadata" json,
	CONSTRAINT "feed_event_tx_hash_log_index_pk" PRIMARY KEY("tx_hash","log_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposals_onchain" (
	"id" text PRIMARY KEY NOT NULL,
	"tx_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"proposer_account_id" text NOT NULL,
	"targets" json NOT NULL,
	"values" json NOT NULL,
	"signatures" json NOT NULL,
	"calldatas" json NOT NULL,
	"start_block" integer NOT NULL,
	"end_block" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"end_timestamp" bigint NOT NULL,
	"status" text NOT NULL,
	"for_votes" bigint DEFAULT 0 NOT NULL,
	"against_votes" bigint DEFAULT 0 NOT NULL,
	"abstain_votes" bigint DEFAULT 0 NOT NULL,
	"proposal_type" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"decimals" integer NOT NULL,
	"total_supply" bigint DEFAULT 0 NOT NULL,
	"delegated_supply" bigint DEFAULT 0 NOT NULL,
	"cex_supply" bigint DEFAULT 0 NOT NULL,
	"dex_supply" bigint DEFAULT 0 NOT NULL,
	"lending_supply" bigint DEFAULT 0 NOT NULL,
	"circulating_supply" bigint DEFAULT 0 NOT NULL,
	"treasury" bigint DEFAULT 0 NOT NULL,
	"non_circulating_supply" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_price" (
	"price" bigint NOT NULL,
	"timestamp" bigint PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"transaction_hash" text PRIMARY KEY NOT NULL,
	"from_address" text,
	"to_address" text,
	"is_cex" boolean DEFAULT false NOT NULL,
	"is_dex" boolean DEFAULT false NOT NULL,
	"is_lending" boolean DEFAULT false NOT NULL,
	"is_total" boolean DEFAULT false NOT NULL,
	"timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfers" (
	"transaction_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"token_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"from_account_id" text NOT NULL,
	"to_account_id" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"log_index" integer NOT NULL,
	"is_cex" boolean DEFAULT false NOT NULL,
	"is_dex" boolean DEFAULT false NOT NULL,
	"is_lending" boolean DEFAULT false NOT NULL,
	"is_total" boolean DEFAULT false NOT NULL,
	CONSTRAINT "transfers_transaction_hash_from_account_id_to_account_id_pk" PRIMARY KEY("transaction_hash","from_account_id","to_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes_onchain" (
	"tx_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"voter_account_id" text NOT NULL,
	"proposal_id" text NOT NULL,
	"support" text NOT NULL,
	"voting_power" bigint NOT NULL,
	"reason" text,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "votes_onchain_voter_account_id_proposal_id_pk" PRIMARY KEY("voter_account_id","proposal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_power_history" (
	"transaction_hash" text NOT NULL,
	"dao_id" text NOT NULL,
	"account_id" text NOT NULL,
	"voting_power" bigint NOT NULL,
	"delta" bigint NOT NULL,
	"delta_mod" bigint NOT NULL,
	"timestamp" bigint NOT NULL,
	"log_index" integer NOT NULL,
	CONSTRAINT "voting_power_history_transaction_hash_account_id_log_index_pk" PRIMARY KEY("transaction_hash","account_id","log_index")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_balance_delegate_index" ON "account_balance" USING btree ("delegate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_power_last_vote_timestamp_index" ON "account_power" USING btree ("last_vote_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delegations_transaction_hash_index" ON "delegations" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delegations_timestamp_index" ON "delegations" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delegations_delegator_account_id_index" ON "delegations" USING btree ("delegator_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delegations_delegate_account_id_index" ON "delegations" USING btree ("delegate_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delegations_delegated_value_index" ON "delegations" USING btree ("delegated_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_event_timestamp_index" ON "feed_event" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_event_type_index" ON "feed_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feed_event_value_index" ON "feed_event" USING btree ("value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proposals_onchain_proposer_account_id_index" ON "proposals_onchain" USING btree ("proposer_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_transaction_hash_index" ON "transfers" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_timestamp_index" ON "transfers" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_from_account_id_index" ON "transfers" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_to_account_id_index" ON "transfers" USING btree ("to_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_amount_index" ON "transfers" USING btree ("amount");