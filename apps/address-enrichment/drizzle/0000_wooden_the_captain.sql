CREATE TABLE "address_enrichment" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"is_contract" boolean NOT NULL,
	"arkham_entity" varchar(255),
	"arkham_entity_type" varchar(100),
	"arkham_label" varchar(255),
	"arkham_twitter" varchar(255),
	"ens_name" varchar(255),
	"ens_avatar" text,
	"ens_banner" text,
	"ens_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
