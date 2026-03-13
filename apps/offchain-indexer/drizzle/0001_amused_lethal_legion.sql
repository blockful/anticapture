ALTER TABLE "snapshot"."votes" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "snapshot"."votes" ADD CONSTRAINT "votes_proposal_id_voter_pk" PRIMARY KEY("proposal_id","voter");