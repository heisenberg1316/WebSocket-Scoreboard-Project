DROP INDEX "idx_commentary_match_id";--> statement-breakpoint
CREATE INDEX "idx_commentary_match_id" ON "commentary" USING btree ("match_id");