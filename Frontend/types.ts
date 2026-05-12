export type CommentaryEventType =
  | "goal"
  | "save"
  | "shot"
  | "foul"
  | "yellow_card"
  | "red_card"
  | "corner"
  | "offside"
  | "substitution"
  | "run"
  | "four"
  | "six"
  | "wicket"
  | "wide"
  | "no_ball"
  | "match_start"
  | "match_end"
  | "period_start"
  | "period_end";

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ScoreDelta {
  homeScore ?: number;
  awayScore ?: number;
  runs ?: number;
  wickets ?: number;
}

export interface Match {
  id: number | string;

  sport: string;

  homeTeam: string;
  awayTeam: string;

  status: string;

  startTime: string;
  endTime?: string;

  // football scores
  homeScore?: number;
  awayScore?: number;

  // cricket scores
  homeRuns?: number;
  homeWickets?: number;
  homeTotalBalls?: number;

  awayRuns?: number;
  awayWickets?: number;
  awayTotalBalls?: number;

  createdAt?: string;
}

export interface MatchResponse {
  data: Match[];
}


export interface Commentary {
  id: number | string;

  matchId: number | string;

  sport: string;

  // football
  minute?: number;

  // cricket
  over?: number;
  ball?: number;

  sequence: number;

  period?: string;

  eventType: CommentaryEventType;

  actor?: string;

  team?: string;

  message: string;

  scoreDelta?: ScoreDelta;

  metadata?: Record<string, unknown>;

  tags?: string[];

  createdAt?: string;
}


export interface CommentaryResponse {
  data: Commentary[];
}

export interface WSMessageMatchCreated {
  type: "match_created";
  data: Match;
}

// WebSocket Message Types
export interface WSMessageCommentary {
  type: 'commentary';
  data: Commentary;
}

export interface WSMessageCricketScore {
  type: 'score_update_cricket';
  matchId: string | number;
  data: Commentary
}

export interface WSMessageFootballScore {
  type: 'score_update_football';
  matchId: string | number;
  data: Commentary
}

export interface WSMessageWelcome {
  type: 'welcome';
  message?: string;
}

export interface WSMessagePong {
  type: 'pong';
}

export interface WSMessageError {
  type: 'error';
  code: string;
  message: string;
}

export interface WSMessageSubscribed {
  type: 'subscribed';
  matchId: string | number;
}

export interface WSMessageUnsubscribed {
  type: 'unsubscribed';
  matchId: string | number;
}

export interface WSMessageSubscriptions {
  type: 'subscriptions';
  matchIds: Array<string | number>;
}

export interface WSMessageSubscribedAll {
  type: 'subscribed_all';
}

export interface WSMessageUnsubscribedAll {
  type: 'unsubscribed_all';
}

export type WSMessage =
  | WSMessageCommentary
  | WSMessageMatchCreated
  | WSMessageCricketScore
  | WSMessageFootballScore
  | WSMessageWelcome
  | WSMessagePong
  | WSMessageError
  | WSMessageSubscribed
  | WSMessageUnsubscribed
  | WSMessageSubscriptions
  | WSMessageSubscribedAll
  | WSMessageUnsubscribedAll;
