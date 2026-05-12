  import { useCallback, useEffect, useRef, useState } from "react";
  import { fetchMatchCommentary, fetchMatches } from "../services/api";
  import { Commentary, Match, WSMessage } from "../types";
  import { useWebSocket } from "./useWebSocket";

  interface UseMatchData {
      matches: Match[];
      isLoading: boolean;
      error: string | null;
      commentary: Commentary[];
      isCommentaryLoading: boolean;
      wsError: string | null;
      status: ReturnType < typeof useWebSocket > ["status"];
      activeMatchId: string | number | null;
      newMatchesCount: number;
      dismissNewMatches: () => void;
      watchMatch: (id: string | number) => void;
      unwatchMatch: (id: string | number) => void;
      reloadMatches: () => void;
  }

  export const useMatchData = (): UseMatchData => {
      //states
      const [matches, setMatches] = useState < Match[] > ([]);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState < string | null > (null);
      const [commentary, setCommentary] = useState < Commentary[] > ([]);
      const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
      const [wsError, setWsError] = useState < string | null > (null);
      const [activeMatchId, setActiveMatchId] = useState < string | number | null > (null);
      const [newMatchesCount, setNewMatchesCount] = useState(0);

      //refs
      const latestMatchIdRef = useRef < string | number | null > (null);
      const subscribedMatchIdsRef = useRef(new Set < string > ());
      const hasLoadedRef = useRef(false);
      const knownMatchIdsRef = useRef(new Set < string > ());
      const newMatchesTimeoutRef = useRef < ReturnType < typeof setTimeout > | null > (null);


      const handleWSMessage = useCallback((msg: WSMessage) => {
          switch (msg.type) {
              case "score_update_cricket":

                    setMatches((prevMatches) =>
                        prevMatches.map((m) => {

                            if (m.id == msg.matchId && msg.data.eventType !== "match_start" && msg.data.eventType !== "match_end") {

                                let isHome = msg.data.team.toLowerCase() === m.homeTeam.toLowerCase();
                                const event = msg.data.eventType;

                                let runs = msg.data.scoreDelta?.runs ?? 0;

                                let balls = 1;

                                if (msg.data.eventType === "wide" || msg.data.eventType === "no_ball") {
                                    balls = 0; // extra ball
                                    isHome = !isHome; //because from backend we are returning the team whose bowler bowl that ball
                                }

                                return {
                                    ...m,

                                    homeRuns: isHome ? (m.homeRuns ?? 0) + runs : m.homeRuns,
                                    awayRuns: !isHome ? (m.awayRuns ?? 0) + runs : m.awayRuns,
                                    
                                    homeWickets:
                                        !isHome && msg.data.eventType === "wicket"
                                        ? (m.homeWickets ?? 0) + 1
                                        : m.homeWickets,

                                    awayWickets:
                                        isHome && msg.data.eventType === "wicket"
                                        ? (m.awayWickets ?? 0) + 1
                                        : m.awayWickets,


                                    homeTotalBalls:
                                        ((isHome && (event==="run" || event==="four" || event==="six")) || (event === "wicket" && !isHome)) ? (m.homeTotalBalls ?? 0) + balls : m.homeTotalBalls,

                                    awayTotalBalls:
                                        ((!isHome && (event==="run" || event==="four" || event==="six")) || (event === "wicket" && isHome)) ? (m.awayTotalBalls ?? 0) + balls : m.awayTotalBalls,
                                };
                            }

                            return m;
                        })
                    );

                    break;

              case "score_update_football":
                    setMatches((prevMatches) =>
                        prevMatches.map((m) => {
                            if (m.id == msg.matchId && msg.data.eventType !== "period_start" && msg.data.eventType !== "period_end") {
                                if (msg.data.eventType === "goal") {
                                    console.log("msg is ", msg);
                                    const isHome = msg.data.team.toLowerCase() === m.homeTeam.toLowerCase();
                                    return {
                                        ...m,
                                        homeScore: isHome ? m.homeScore + (msg.data.scoreDelta.homeScore ?? 0) : m.homeScore,
                                        awayScore: !isHome ? m.awayScore + (msg.data.scoreDelta.awayScore ?? 0) : m.awayScore
                                    };
                                }
                                return m;
                            }
                            return m;
                        })
                    );
                    break;

              case "match_created": {
                  const match = msg.data;

                  setMatches((prev) => {
                      const exists = prev.some((m) => String(m.id) === String(match.id));
                      if (exists) return prev;
                      return [match, ...prev];
                    });
                    
                  setNewMatchesCount((prev) => prev + 1);
                  break;
              }
              case "commentary": {
                  if ( latestMatchIdRef.current == null || msg.data.matchId != latestMatchIdRef.current ) {
                      return;
                  }
                  const normalized = {
                      ...msg.data,
                      createdAt: msg.data.createdAt ?? new Date().toISOString(),
                  };
                  setCommentary((prev) => [normalized, ...prev]);
                  break;
              }
              case "error":
                  setWsError(`${msg.code}: ${msg.message}`);
                  break;
              case "subscribed":
              case "unsubscribed":
              case "subscribed_all":
              case "unsubscribed_all":
              case "subscriptions":
              case "welcome":
              case "pong":
                  break;
              default:
                  break;
          }
      }, []);

      const {
          status,
          connectGlobal,
          subscribeMatch,
          unsubscribeMatch
      } =
      useWebSocket(handleWSMessage);

      const loadMatches = useCallback(async () => {
          if (!hasLoadedRef.current) {
              setIsLoading(true);
          }
          setError(null);
          try {
              const data = await fetchMatches(100);
              const nextMatches = data.data || [];
              const nextMatchIds = new Set(
                  nextMatches.map((match) => String(match.id)),
              );
              setMatches((prevMatches) => {
                  const prevById = new Map<string, Match>(
                      prevMatches.map((match) => [String(match.id), match]),
                  );
                  return nextMatches.map((match) => {
                      const matchId = String(match.id);
                      const prev  = prevById.get(matchId);
                      if (prev && !subscribedMatchIdsRef.current.has(matchId)) {
                          return {
                              ...match,
                              homeScore: prev.homeScore,
                              homeRuns : prev.homeRuns,
                              homeWickets : prev.homeWickets,
                              homeTotalBalls : prev.homeTotalBalls,
                              awayScore: prev.awayScore,
                              awayRuns : prev.awayRuns,
                              awayWickets : prev.awayWickets,
                              awayTotalBalls : prev.awayTotalBalls,
                          };
                      }
                      return match;
                  });
              });
              if (knownMatchIdsRef.current.size > 0) {
                  let newCount = 0;
                  nextMatchIds.forEach((matchId) => {
                      if (!knownMatchIdsRef.current.has(matchId)) {
                          newCount += 1;
                      }
                  });
                  if (newCount > 0) {
                      setNewMatchesCount((prev) => prev + newCount);
                      if (newMatchesTimeoutRef.current) {
                          clearTimeout(newMatchesTimeoutRef.current);
                      }
                      newMatchesTimeoutRef.current = setTimeout(() => {
                          setNewMatchesCount(0);
                          newMatchesTimeoutRef.current = null;
                      }, 5000);
                  }
              }
              knownMatchIdsRef.current = nextMatchIds;

              nextMatches.forEach((match) => {
                  const matchId = String(match.id);
                  if ( subscribedMatchIdsRef.current.has(matchId) && match.status.toLowerCase() === "finished" ) {
                      subscribedMatchIdsRef.current.delete(matchId);
                      unsubscribeMatch(match.id);
                      if (latestMatchIdRef.current == match.id) {
                          setActiveMatchId(null);
                          latestMatchIdRef.current = null;
                          setCommentary([]);
                          setIsCommentaryLoading(false);
                      }
                  }
              });
          }
          catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to load matches";
              setError(msg);
          }
          finally {
              if (!hasLoadedRef.current) {
                  setIsLoading(false);
                  hasLoadedRef.current = true;
              }
          }
      }, [unsubscribeMatch]);

      useEffect(() => {
          loadMatches();
      }, [loadMatches]);

      // useEffect(() => {
      //   polling for new match created after every 60 seconds, instead we are using websocket
      //   const interval = setInterval(() => {
      //     loadMatches();
      //   }, 60000);
      //   return () => clearInterval(interval);
      // }, [loadMatches]);

      useEffect(() => {
          connectGlobal();
      }, [connectGlobal]);

      useEffect(() => {
          latestMatchIdRef.current = activeMatchId;
      }, [activeMatchId]);

      useEffect(() => {
          return () => {
              if (newMatchesTimeoutRef.current) {
                  clearTimeout(newMatchesTimeoutRef.current);
              }
          };
      }, []);

      const dismissNewMatches = useCallback(() => {
          if (newMatchesTimeoutRef.current) {
              clearTimeout(newMatchesTimeoutRef.current);
              newMatchesTimeoutRef.current = null;
          }
          setNewMatchesCount(0);
      }, []);

      const watchMatch = useCallback(
          (id: string | number) => {
              setCommentary([]);
              setIsCommentaryLoading(true);
              setWsError(null);
              latestMatchIdRef.current = id;
              if (activeMatchId != null && activeMatchId != id) {
                  const previousId = String(activeMatchId);
                  subscribedMatchIdsRef.current.delete(previousId);
                  unsubscribeMatch(activeMatchId);
              }
              setActiveMatchId(id);
              const matchId = String(id);
              subscribedMatchIdsRef.current.add(matchId);
              subscribeMatch(id);
              fetchMatchCommentary(id)
                  .then((data) => {
                      if (latestMatchIdRef.current == id) {
                          setCommentary(data.data || []);
                      }
                  })
                  .catch(() => {
                      if (latestMatchIdRef.current == id) {
                          setCommentary([]);
                      }
                  })
                  .finally(() => {
                      if (latestMatchIdRef.current == id) {
                          setIsCommentaryLoading(false);
                      }
                  });
          },
          [activeMatchId, subscribeMatch, unsubscribeMatch],
      );

      const unwatchMatch = useCallback(
          (id: string | number) => {
              unsubscribeMatch(id);
              const matchId = String(id);
              subscribedMatchIdsRef.current.delete(matchId);
              if (activeMatchId == id) {
                  setActiveMatchId(null);
                  latestMatchIdRef.current = null;
                  setCommentary([]);
                  setIsCommentaryLoading(false);
              }
          },
          [activeMatchId, unsubscribeMatch],
      );

      return {
          matches,
          isLoading,
          error,
          commentary,
          isCommentaryLoading,
          wsError,
          status,
          activeMatchId,
          newMatchesCount,
          dismissNewMatches,
          watchMatch,
          unwatchMatch,
          reloadMatches: loadMatches,
      };
  };