import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { commentary, matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { desc, eq } from "drizzle-orm";

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);

    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalid match ID.', details: paramsResult.error.issues });
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: 'Invalid query parameters.', details: queryResult.error.issues });
    }

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;

        const safeLimit = Math.min(limit, MAX_LIMIT);

        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        return res.status(200).json({ data: results });
    }
    catch (error) {
        console.error('Failed to fetch commentary:', error);
        return res.status(500).json({ error: 'Failed to fetch commentary.' });
    }
});

    commentaryRouter.post('/', async (req, res) => {

        const paramsResult = matchIdParamSchema.safeParse(req.params);

        if (!paramsResult.success) {
            return res.status(400).json({ error: 'Invalid match ID.', details: paramsResult.error.issues });
        }

        const bodyResult = createCommentarySchema.safeParse(req.body);

        if (!bodyResult.success) {
            return res.status(400).json({ error: 'Invalid commentary payload.', details: bodyResult.error.issues });
        }

        try {

            const { minute, ...rest } = bodyResult.data;

            const [result] = await db.insert(commentary).values({
                matchId: paramsResult.data.id,
                minute,
                ...rest
            }).returning();

            const matchId = result.matchId;

            /* -------------------------
            GET MATCH
            --------------------------*/

            const [match] = await db
                .select()
                .from(matches)
                .where(eq(matches.id, matchId));

            if (!match) {
                return res.status(404).json({ error: "Match not found" });
            }

            /* -------------------------
            FOOTBALL UPDATE
            --------------------------*/
            

            if (result.sport === "football" && result.eventType === "goal") {

                const isHome = result.team === match.homeTeam;

                const homeScore = (match.homeScore ?? 0) + (result.scoreDelta?.homeScore ?? 0);
                const awayScore = (match.awayScore ?? 0) + (result.scoreDelta?.awayScore ?? 0);

                await db.update(matches)
                    .set({
                        homeScore: isHome ? homeScore : match.homeScore,
                        awayScore: !isHome ? awayScore : match.awayScore
                    })
                    .where(eq(matches.id, matchId));
            }

            /* -------------------------
            CRICKET UPDATE
            --------------------------*/

            if (result.sport === "cricket" && result.eventType !== "match_start" && result.eventType !== "match_end") {
        
                const teamLower = (result.team ?? "").toLowerCase();
                const homeTeamLower = (match.homeTeam ?? "").toLowerCase();

                let isHome = teamLower === homeTeamLower;
                const event = result.eventType;
                const runs = result.scoreDelta?.runs ?? 0;

                let balls = 1;
                if (event === "wide" || event === "no_ball") {
                    balls = 0;
                    isHome = !isHome; //because from backend we are returning the team whose bowler bowl that ball
                }

                // Build updates exactly like your frontend logic
                const updates = {};

                // runs
                updates.homeRuns = isHome ? (match.homeRuns ?? 0) + runs : match.homeRuns;
                updates.awayRuns = !isHome ? (match.awayRuns ?? 0) + runs : match.awayRuns;

                // wickets (note: frontend logic increments other side for wicket in a specific way;
                updates.homeWickets =
                    (!isHome && event === "wicket") ? (match.homeWickets ?? 0) + 1 : match.homeWickets;

                updates.awayWickets =
                    (isHome && event === "wicket") ? (match.awayWickets ?? 0) + 1 : match.awayWickets;

                // total balls: mirror frontend compound conditions
                const incHomeTotalBalls =
                    (isHome && (event === "run" || event === "four" || event === "six"))
                    || (event === "wicket" && !isHome);

                const incAwayTotalBalls =
                    (!isHome && (event === "run" || event === "four" || event === "six"))
                    || (event === "wicket" && isHome);

                updates.homeTotalBalls = incHomeTotalBalls ? (match.homeTotalBalls ?? 0) + balls : match.homeTotalBalls;
                updates.awayTotalBalls = incAwayTotalBalls ? (match.awayTotalBalls ?? 0) + balls : match.awayTotalBalls;

                // finally persist
                await db.update(matches).set(updates).where(eq(matches.id, matchId));
            }

            /* -------------------------
            BROADCAST
            --------------------------*/

            if (res.app.locals.broadcastCommentary) {
                res.app.locals.broadcastCommentary(result.matchId, result);
            }

            return res.status(201).json({ data: result });

        }
        catch (error) {
            console.error('Failed to create commentary:');
            console.error(error);
            console.error(error.stack);
            return res.status(500).json({ error: 'Failed to create commentary.' });
        }
    });