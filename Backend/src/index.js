import express from "express";
import { matchRouter } from "./routes/matches.js";
import http from "http";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";
import cors from "cors";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend-domain.com"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(securityMiddleware());

//cors issue remaning i think

app.use("/matches", matchRouter); 
app.use("/matches/:id/commentary", commentaryRouter)

app.get("/", (req, res) => {
    return res.send("Hello from express server");
})

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;


server.listen(PORT, HOST, () => {
    const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`Websocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`)
}) 