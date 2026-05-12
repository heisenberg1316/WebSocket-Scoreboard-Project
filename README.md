# 🏏 Real-Time WebSocket Scoreboard

A real-time sports scoreboard application built with WebSockets that streams live match updates, commentary, and score changes instantly to connected clients.

This project was built while learning WebSocket architecture and real-time communication systems. It demonstrates how low-latency broadcasting works between a backend server and multiple frontend clients.

---

# 🚀 Features

- ⚡ Real-time score updates using WebSockets
- 📡 Instant broadcast to all connected clients
- 📝 Live commentary feed
- 🔄 Ball-by-ball updates
- 🧩 Separate frontend and backend architecture
- ✅ Input validation using Zod
- 🗄️ PostgreSQL + Drizzle ORM integration
- 🌐 CORS-enabled Express server
- 🛡️ Arcjet integration
- ⚙️ Built with modern TypeScript tooling

---

# 🏗️ Project Structure

```bash
root/
│
├── Backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── Frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── ...
```

---

# 🛠️ Tech Stack

## Frontend

- React 19
- TypeScript
- Vite

## Backend

- Node.js
- Express.js
- WebSockets (`ws`)
- PostgreSQL
- Drizzle ORM
- Zod
- Arcjet

---

# 📦 Installation

## 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

---

# ⚙️ Backend Setup

```bash
cd Backend
npm install
```

## Create `.env`

Create a `.env` file inside the `Backend` folder and copy the following:

```env
PORT = 8000
HOST = 0.0.0.0

ARCJET_KEY = ""
# Options: "development", "staging", "production"
ARCJET_ENV = "development"

DATABASE_URL = ''

# API URL
API_URL="http://localhost:8000"
# API_URL="YOUR_REAL_PRODUCTION_URL"

BROADCAST="1"
DELAY_MS="250"
MATCH_COUNT="0"
```

## Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

## Seed Database (Optional)

```bash
npm run seed
```

## Start Backend Server

```bash
npm run dev
```

---

# 💻 Frontend Setup

```bash
cd Frontend
npm install
```

## Create `.env`

Create a `.env` file inside the `Frontend` folder and copy the following:

```env
VITE_API_BASE_URL = http://localhost:8000
VITE_WS_BASE_URL = ws://localhost:8000/ws

# change ws → wss in production

# Production
# VITE_API_BASE_URL=""
```

## Start Frontend

```bash
npm run dev
```

---

# 🔌 WebSocket Architecture

```text
Admin/API Updates
        ↓
 WebSocket Server
        ↓
 Broadcast Engine
        ↓
 Connected Clients
```

The backend maintains persistent WebSocket connections and pushes live updates to all connected clients instantly without requiring polling.

---

# 📚 What I Learned

- WebSocket fundamentals and connection lifecycle
- Real-time event broadcasting
- Handling multiple concurrent socket connections
- Building low-latency update systems
- Structuring frontend/backend communication
- Using Drizzle ORM with PostgreSQL
- Input validation with Zod

---

# ⚠️ Scalability Note

This project was built primarily for learning and experimentation with real-time systems.

While the architecture demonstrates broadcasting concepts used in large-scale systems, real-world support for **100,000+ simultaneous users** would typically require additional infrastructure and optimizations such as:

- Horizontal scaling
- Load balancers
- Redis Pub/Sub
- Message queues
- Distributed WebSocket gateways
- Rate limiting
- Dedicated deployment infrastructure

---

# 🧠 Inspiration

Built while learning real-time systems and WebSocket architecture from a tutorial-based project, with additional exploration into scalable broadcast patterns and backend architecture.

---

# 📄 License

This project is for educational and learning purposes.