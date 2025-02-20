CREATE SCHEMA "offchain";
--> statement-breakpoint
CREATE TABLE "offchain"."petition_signatures" (
	"accountId" text NOT NULL,
	"daoId" text NOT NULL,
	"signature" text NOT NULL,
	"message" text NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "petition_signatures_accountId_daoId_pk" PRIMARY KEY("accountId","daoId")
);
