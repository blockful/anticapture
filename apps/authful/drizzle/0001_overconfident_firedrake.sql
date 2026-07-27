CREATE TABLE "authful"."token_usage_daily" (
	"token_id" uuid NOT NULL,
	"day" date NOT NULL,
	"count" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "token_usage_daily_token_id_day_pk" PRIMARY KEY("token_id","day")
);
--> statement-breakpoint
ALTER TABLE "authful"."token_usage_daily" ADD CONSTRAINT "token_usage_daily_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "authful"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "token_usage_daily_day_index" ON "authful"."token_usage_daily" USING btree ("day");