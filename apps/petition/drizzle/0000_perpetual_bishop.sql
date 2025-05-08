CREATE TABLE "petition_signatures" (
	"account_id" text NOT NULL,
	"dao_id" text NOT NULL,
	"signature" text NOT NULL,
	"message" text NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "petition_signatures_account_id_dao_id_pk" PRIMARY KEY("account_id","dao_id")
);
