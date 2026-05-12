import React, { useEffect, useRef, useState } from 'react';
import { Match } from '../types';

interface MatchCardProps {
    match: Match;
    isActive: boolean;
    onWatch: (id: string | number) => void;
    onUnwatch: (id: string | number) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, isActive, onWatch, onUnwatch }) => {

    const statusLower = match.status.toLowerCase();
    const isLive = statusLower === 'live';
    const isCricket = match.sport.toLowerCase() === 'cricket';

    /* -----------------------------
       Convert balls → overs
       ----------------------------- */
    function getOvers(totalBalls?: number) {
        if (totalBalls == null) return "0.0";

        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;

        return `${overs}.${balls}`;
    }

    /* -----------------------------
       Dynamic score fields
       ----------------------------- */
    const homeScore = isCricket ? match.homeRuns : match.homeScore;
    const awayScore = isCricket ? match.awayRuns : match.awayScore;

    const homeWickets = isCricket ? match.homeWickets : undefined;
    const awayWickets = isCricket ? match.awayWickets : undefined;

    const homeOvers = isCricket ? getOvers(match.homeTotalBalls) : undefined;
    const awayOvers = isCricket ? getOvers(match.awayTotalBalls) : undefined;

    /* -----------------------------
       Score pulse animation
       ----------------------------- */
    const [homePulse, setHomePulse] = useState(false);
    const [awayPulse, setAwayPulse] = useState(false);

    const prevScoreRef = useRef({
        home: homeScore,
        away: awayScore
    });

    const pulseTimeoutRef = useRef<{ home?: any; away?: any }>({});

    useEffect(() => {

        const prev = prevScoreRef.current;

        if (prev.home !== homeScore) {
            setHomePulse(true);
            clearTimeout(pulseTimeoutRef.current.home);
            pulseTimeoutRef.current.home = setTimeout(() => setHomePulse(false), 1000);
        }

        if (prev.away !== awayScore) {
            setAwayPulse(true);
            clearTimeout(pulseTimeoutRef.current.away);
            pulseTimeoutRef.current.away = setTimeout(() => setAwayPulse(false), 1000);
        }

        prevScoreRef.current = {
            home: homeScore,
            away: awayScore
        };

    }, [homeScore, awayScore]);

    /* -----------------------------
       Score Display Component
       ----------------------------- */
    const ScoreDisplay = ({
        score,
        wickets,
        overs,
        pulse
    }: {
        score: number | undefined;
        wickets?: number;
        overs?: string;
        pulse: boolean;
    }) => {

        if (isCricket) {
            return (
                <div className={`flex flex-col transition-all duration-300 ${pulse ? 'scale-110' : ''}`}>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${pulse ? 'text-red-600' : 'text-black'}`}>
                            {score ?? 0}
                        </span>

                        <span className="text-lg font-bold text-gray-500">
                            /{wickets ?? 0}
                        </span>
                    </div>

                    {overs && (
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                            ({overs} ov)
                        </span>
                    )}
                </div>
            );
        }

        return (
            <span className={`text-3xl font-black transition-all ${pulse ? 'text-red-600 scale-125' : 'text-black'}`}>
                {score ?? 0}
            </span>
        );
    };

    return (
        <div
            className={`
            relative overflow-hidden rounded-xl border-[3px] border-black bg-white transition-all
            ${isActive
                    ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1'
                    : 'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
        `}
        >

            {/* Top Bar */}
            <div className={`flex justify-between items-center px-4 py-2 border-b-[3px] border-black ${isLive ? 'bg-red-50' : 'bg-gray-50'}`}>

                <div className="flex items-center gap-2">

                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase">
                        {match.sport}
                    </span>

                    {isLive && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white uppercase animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Live
                        </span>
                    )}
                </div>

                <span className="text-[11px] font-bold text-gray-600 uppercase italic">
                    {match.status}
                </span>
            </div>

            <div className="p-4">

                {/* Score Section */}
                <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 ${isCricket ? "mb-4" : "mb-6"}`}>

                    {/* Home Team */}
                    <div className="flex flex-col gap-1">

                        <span className="text-sm font-black leading-tight uppercase line-clamp-2">
                            {match.homeTeam}
                        </span>

                        <ScoreDisplay
                            score={homeScore}
                            wickets={homeWickets}
                            overs={homeOvers}
                            pulse={homePulse}
                        />

                    </div>

                    {/* VS Badge */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-brand-yellow flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[10px] font-black">VS</span>
                        </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-end gap-1 text-right">

                        <span className="text-sm font-black leading-tight uppercase line-clamp-2">
                            {match.awayTeam}
                        </span>

                        <ScoreDisplay
                            score={awayScore}
                            wickets={awayWickets}
                            overs={awayOvers}
                            pulse={awayPulse}
                        />

                    </div>

                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-black border-dashed">

                    <div className="flex flex-col">

                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            Start Time
                        </span>

                        <span className="text-xs font-black">
                            {new Date(match.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>

                    </div>

                    <div className="flex gap-2">

                        {isActive && (
                            <button
                                onClick={() => onUnwatch(match.id)}
                                className="px-3 py-1.5 rounded border-2 border-black bg-white text-[11px] font-black hover:bg-gray-100 active:translate-y-0.5 transition-all"
                            >
                                CLOSE
                            </button>
                        )}

                        <button
                            onClick={() => onWatch(match.id)}
                            disabled={isActive}
                            className={`
                                px-4 py-1.5 rounded border-2 border-black text-[11px] font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                ${isActive
                                    ? 'bg-brand-blue cursor-default'
                                    : 'bg-brand-yellow hover:bg-yellow-300 active:translate-y-0.5 active:shadow-none'
                                }
                            `}
                        >
                            {isActive ? 'WATCHING' : 'WATCH MATCH'}
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
};