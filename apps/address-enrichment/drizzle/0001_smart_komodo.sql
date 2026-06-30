ALTER TABLE "address_enrichment" ADD COLUMN "ens_twitter" varchar(255);--> statement-breakpoint
ALTER TABLE "address_enrichment" ADD COLUMN "ens_telegram" varchar(255);--> statement-breakpoint
ALTER TABLE "address_enrichment" ADD COLUMN "ens_email" varchar(255);--> statement-breakpoint
ALTER TABLE "address_enrichment" ADD COLUMN "ens_github" varchar(255);--> statement-breakpoint
ALTER TABLE "address_enrichment" ADD COLUMN "efp_followers" integer;--> statement-breakpoint
ALTER TABLE "address_enrichment" ADD COLUMN "efp_following" integer;