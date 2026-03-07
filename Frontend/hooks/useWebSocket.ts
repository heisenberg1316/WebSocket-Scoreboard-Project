import { useState, useEffect, useRef, useCallback } from "react";
import {
    WS_BASE_URL,
    INITIAL_RECONNECT_DELAY,
    MAX_RECONNECT_DELAY,
} from "../constants";
import { ConnectionStatus, WSMessage } from "../types";

interface UseWebSocketReturn {
    status: ConnectionStatus;
    connectGlobal: () => void;
    subscribeMatch: (matchId: string | number) => void;
    unsubscribeMatch: (matchId: string | number) => void;
    disconnect: () => void;
}

const normalizeId = (matchId: string | number) => String(matchId);

export const useWebSocket = ( onMessage: (msg: WSMessage) => void): UseWebSocketReturn => {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");

    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef(0);
    const isIntentionalClose = useRef(false);
    const subscribedMatchIdsRef = useRef(new Set<string>());

    const sendMessage = useCallback(
        (message: WSMessage | Record<string, unknown>) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            try {
            ws.current.send(JSON.stringify(message));
            } catch (e) {
            console.warn("[WebSocket] send failed", e);
            }
        }
        },
        [],
    );

    // Core connect function
    const initConnection = useCallback(() => {
        // If there's an existing socket, detach handlers and close it so its onclose won't fire our reconnect logic
        if (ws.current) {
            try {
                // detach all handlers from the old socket to avoid its onclose firing reconnection logic
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;
                ws.current.close();
            }
            catch (e) {
                console.warn("[WebSocket] error closing previous socket", e);
            }
            ws.current = null;
        }

        setStatus(reconnectAttempts.current > 0 ? "reconnecting" : "connecting");
        // NOTE: do NOT flip isIntentionalClose here — only disconnect() should set it true

        const socketUrl = `${WS_BASE_URL}?all=1`;
        try {
            const socket = new WebSocket(socketUrl);
            ws.current = socket;

            socket.onopen = () => {
                setStatus("connected");
                reconnectAttempts.current = 0;

                // restore subscriptions if any
                subscribedMatchIdsRef.current.forEach((matchId) => {
                    socket.send(
                        JSON.stringify({
                        type: "subscribe",
                        matchId: Number(matchId),
                        }),
                    );
                });
                console.log("[WebSocket] Connected", socketUrl);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                }
                catch (e) {
                    console.error("[WebSocket] Failed to parse message:", e);
                }
            };

            socket.onerror = (event) => {
                console.warn("[WebSocket] error event", event);
                // let onclose handle reconnection; optionally set 'error' if you want to show it only when connected before
            };

            socket.onclose = (event) => {
                // if the user intentionally closed, don't attempt to reconnect
                if (isIntentionalClose.current) {
                    setStatus("disconnected");
                    console.log("[WebSocket] closed intentionally", event.code);
                    return;
                }

                setStatus("disconnected");

                // Exponential backoff
                const delay = Math.min(
                    INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempts.current,
                    MAX_RECONNECT_DELAY,
                );

                console.log(`[WebSocket] Disconnected (code=${event.code}). Reconnecting in ${delay}ms...`);
                reconnectTimeout.current = setTimeout(() => {
                    reconnectAttempts.current += 1;
                    initConnection();
                }, delay);
            };
        }
        catch (e) {
            console.error("[WebSocket] Connection creation failed:", e);
            setStatus("error");
        }
    }, [onMessage]);

    // Public connect method
    const connectGlobal = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
        reconnectAttempts.current = 0;

        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            return;
        }
        initConnection();
    }, [initConnection]);

    const subscribeMatch = useCallback((matchId: string | number) => {
            const normalized = normalizeId(matchId);
            subscribedMatchIdsRef.current.add(normalized);
            sendMessage({ type: "subscribe", matchId: Number(matchId) });
        },
    [sendMessage]);

    const unsubscribeMatch = useCallback((matchId: string | number) => {
            const normalized = normalizeId(matchId);
            subscribedMatchIdsRef.current.delete(normalized);
            sendMessage({ type: "unsubscribe", matchId: Number(matchId) });
        },
    [sendMessage]);

    // Public disconnect method
    const disconnect = useCallback(() => {
        isIntentionalClose.current = true;

        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        if (ws.current) {
            // detach handlers and close cleanly
            try {
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;
                ws.current.close();
            }
            catch (e) {
                console.warn("[WebSocket] error during disconnect", e);
            }
            ws.current = null;
        }

        setStatus("disconnected");

        // keep isIntentionalClose true briefly to avoid race; you can reset if you want future connectGlobal to reconnect
        setTimeout(() => {
            isIntentionalClose.current = false;
        }, 100); // small delay to clear intentional flag
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isIntentionalClose.current = true;
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                try {
                    ws.current.onopen = null;
                    ws.current.onmessage = null;
                    ws.current.onerror = null;
                    ws.current.onclose = null;
                    ws.current.close();
                }
                catch (e) {
                    /* ignore */
                }
                ws.current = null;
            }
        };
    }, []);

    return {
        status,
        connectGlobal,
        subscribeMatch,
        unsubscribeMatch,
        disconnect,
    };
};
