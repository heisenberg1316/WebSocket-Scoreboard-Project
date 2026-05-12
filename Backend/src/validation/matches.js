import { z } from 'zod';

export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});


export const createMatchSchema = z.object({
    sport: z.string().min(1),

    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),

    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),

    // football
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),

    // cricket
    homeRuns: z.coerce.number().int().nonnegative().optional(),
    homeWickets: z.coerce.number().int().nonnegative().optional(),
    homeTotalBalls: z.coerce.number().int().nonnegative().optional(),

    awayRuns: z.coerce.number().int().nonnegative().optional(),
    awayWickets: z.coerce.number().int().nonnegative().optional(),
    awayTotalBalls: z.coerce.number().int().nonnegative().optional(),
    
}).superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // 1. Time Validation
    if (end <= start) {
        ctx.addIssue({
            code: "custom",
            message: "endTime must be chronologically after startTime",
            path: ["endTime"],
        });
    }
    // 2. Team Validation
    if (data.homeTeam.trim().toLowerCase() === data.awayTeam.trim().toLowerCase()) {
        ctx.addIssue({
            code: "custom",
            message: "A team cannot play against itself",
            path: ["awayTeam"], 
        });
    }
});
export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
});