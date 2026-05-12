import { pgTable, serial, numeric, text, integer, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core';

export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

export const eventTypeEnum = pgEnum("event_type", [
  // football
  "goal",
  "save",
  "shot",
  "foul",
  "yellow_card",
  "red_card",
  "corner",
  "offside",
  "substitution",

  // cricket
  "run",
  "four",
  "six",
  "wicket",
  "wide",
  "no_ball",

  // match lifecycle (both sports)
  "match_start",
  "match_end",
  "period_start",
  "period_end"
]);

export const matches = pgTable('matches', {
    id: serial('id').primaryKey(),

    sport: text('sport').notNull(),

    homeTeam: text('home_team').notNull(),
    awayTeam: text('away_team').notNull(),

    status: matchStatusEnum('status').notNull().default('scheduled'),

    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),

    // Football score
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),

    // Cricket score
    homeRuns: integer('home_runs'),
    homeWickets: integer('home_wickets'),
    homeTotalBalls: integer('home_total_balls'),

    awayRuns: integer('away_runs'),
    awayWickets: integer('away_wickets'),
    awayTotalBalls: integer('away_total_balls'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const commentary = pgTable(
  'commentary',
  {
    id: serial('id').primaryKey(),

    matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: "cascade" }),

    sport: text('sport').notNull(),

    // Football
    minute: integer('minute'),

    // Cricket
    over: integer('over'),
    ball: integer('ball'),

    sequence: integer('sequence').notNull(),

    period: text('period'),

    eventType: eventTypeEnum('event_type').notNull(),

    actor: text('actor'),

    team: text('team'),

    message: text('message').notNull(),

    // Optional score update
    scoreDelta: jsonb('score_delta'),

    metadata: jsonb('metadata'),

    tags: text('tags').array(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      matchIdIdx: index("idx_commentary_match_id").on(table.matchId),
    };
  }
);