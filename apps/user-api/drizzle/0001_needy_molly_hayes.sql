CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"author_address" text,
	"dao_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"discussion_url" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drafts_user_id_dao_id_index" ON "drafts" USING btree ("user_id","dao_id");--> statement-breakpoint
CREATE INDEX "drafts_author_address_index" ON "drafts" USING btree ("author_address");