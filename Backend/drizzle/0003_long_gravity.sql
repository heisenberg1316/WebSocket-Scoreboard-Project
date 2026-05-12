CREATE TYPE "public"."event_type" AS ENUM('goal', 'save', 'shot', 'foul', 'yellow_card', 'red_card', 'corner', 'offside', 'substitution', 'run', 'four', 'six', 'wicket', 'wide', 'no_ball', 'match_start', 'match_end', 'period_start', 'period_end');--> statement-breakpoint
ALTER TABLE "commentary" ALTER COLUMN "sequence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commentary" ALTER COLUMN "event_type" SET DATA TYPE "public"."event_type" USING "event_type"::"public"."event_type";--> statement-breakpoint
ALTER TABLE "commentary" ALTER COLUMN "event_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "home_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "home_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commentary" ADD COLUMN "sport" text NOT NULL;--> statement-breakpoint
ALTER TABLE "commentary" ADD COLUMN "over" integer;--> statement-breakpoint
ALTER TABLE "commentary" ADD COLUMN "ball" integer;--> statement-breakpoint
ALTER TABLE "commentary" ADD COLUMN "score_delta" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_runs" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_wickets" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_overs" numeric;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_runs" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_wickets" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_overs" numeric;