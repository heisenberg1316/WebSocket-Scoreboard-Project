import { WebSocketServer, WebSocket } from "ws";
import {wsArcjet} from "../arcjet.js";

const matchSubscribers = new Map();

function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;
    try {
        // stringify can throw for circular references — catch it
        const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
        socket.send(msg);
    }
    catch (err) {
        console.error('Failed to send websocket message', err);
    }
} 
 
function subscribe(matchId, socket){
    if(!matchSubscribers.has(matchId)){
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket){
    const subscribers = matchSubscribers.get(matchId);

    if(!subscribers) return;

    subscribers.delete(socket);

    if(subscribers.size === 0){
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket){
    for(const matchId of socket.subscriptions){
        unsubscribe(matchId, socket);
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if(!subscribers || subscribers.size === 0) return;

    for(const client of subscribers) {
        sendJson(client, payload);
    }
}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients)  {
        sendJson(client, payload);
    }
}

function handleMessage(socket, data) {
    let message;

    try {
        message = JSON.parse(data.toString());
    }
    catch {
        sendJson(socket, { type: 'error', message: 'Invalid JSON' });
        return;
    }

    if(message?.type === "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: 'subscribed', matchId: message.matchId });
        return;
    }

    if(message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: 'unsubscribed', matchId: message.matchId });
    }
}


export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ noServer : true, path: '/ws', maxPayload: 1024 * 1024 });

    server.on('upgrade', async (req, socket, head) => {
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);

        if (pathname !== '/ws') {
            socket.destroy();
            return;
        } 

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    if (decision.reason.isRateLimit()) {
                        socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
                    } else {
                        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                    }
                    socket.destroy();
                    return;
                }
            }
            catch (e) {
                console.error('WS upgrade protection error', e);
                socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', async (socket, req) => {

        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });

        socket.subscriptions = new Set();

        sendJson(socket, { type: 'welcome' });

        socket.on('message', (data) => {
            handleMessage(socket, data);
        });

        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
            socket.terminate();
        });

        socket.on('close', () => {
            cleanupSubscriptions(socket);
        })

    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false){
                ws.terminate();
                return;
            } 

            ws.isAlive = false;
            ws.ping();
        })}, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        console.log("inside braodcast match");
        broadcastToAll(wss, { type: 'match_created', data: match });
    }

    function broadcastCommentary(matchId, comment) {
        broadcastToMatch(matchId, { type: 'commentary', data: comment });
    }

    return { broadcastMatchCreated, broadcastCommentary };
}