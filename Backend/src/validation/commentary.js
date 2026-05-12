import { z } from 'zod';
import { eventTypeEnum } from '../db/schema.js';

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
    matchId: z.number().int(),

    sport: z.string().min(1),

    minute: z.number().int().nonnegative().nullish(),

    over: z.number().int().nonnegative().nullish(),
    ball: z.number().int().min(0).max(6).nullish(),

    sequence: z.number().int().nonnegative(),

    period: z.string().nullish(),

    eventType: z.enum(eventTypeEnum.enumValues),

    actor: z.string().optional(),

    team: z.string().optional(),

    message: z.string().min(1),

    scoreDelta: z
      .object({
        homeScore: z.number().optional(),
        awayScore: z.number().optional(),
        runs: z.number().optional(),
        wickets: z.number().optional(),
      })
      .nullish(),

    metadata: z.record(z.string(), z.any()).nullish(),

    tags: z.array(z.string()).optional(),
});
