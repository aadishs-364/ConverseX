# ConverseX

A community-based real-time chat platform built on the MERN stack — users create or join communities, talk in channels, and schedule meetings, with messages delivered live over Socket.IO.

**Live demo:** https://converse-x-rouge.vercel.app
*(The backend runs on Render's free tier, so the first request after a while can take ~30–60 seconds to wake up.)*

## Features
- **Accounts** — register/login with JWT authentication; passwords hashed with bcrypt; protected routes via auth middleware
- **Communities & channels** — create, join, leave and delete communities; create and manage channels inside them
- **Real-time messaging** — send, edit and delete messages instantly with Socket.IO, plus typing indicators
- **Meetings** — schedule meetings in a channel with start/end times, join them, and track their status
- **Profiles & preferences** — update your profile and per-section UI preferences

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite, Axios, Socket.IO client |
| Backend | Node.js, Express, Socket.IO, JWT, bcrypt |
| Database | MongoDB Atlas with Mongoose |
| Deployment | Vercel (frontend), Render (backend) |

## Architecture
```
React (Vite) ──REST (Axios)──▶ Express API ──Mongoose──▶ MongoDB
      │                          │
      └──── Socket.IO ◀──────────┘  live messages, edits, deletes, typing
```

## API overview
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` |
| Communities | `GET/POST /api/communities`, `POST /api/communities/:id/join`, `POST /api/communities/:id/leave` |
| Channels | `POST /api/channels`, `GET /api/channels/community/:communityId` |
| Messages | `GET /api/messages/channel/:channelId`, `POST /api/messages`, `PUT/DELETE /api/messages/:id` |
| Meetings | `POST /api/meetings`, `GET /api/meetings/community/:communityId`, `POST /api/meetings/:id/join` |

## Run locally
```bash
git clone https://github.com/aadishs-364/ConverseX.git
cd ConverseX
npm run install:all          # installs frontend + backend dependencies
```
Create the environment files from the examples (never commit them):
```bash
cp .env.example .env               # VITE_API_URL, VITE_SOCKET_URL
cp server/.env.example server/.env # PORT, MONGODB_URI, JWT_SECRET, CLIENT_URLS
```
Then start both servers:
```bash
npm start                    # Vite on :5173, API on :5000
```

## Project structure
```
ConverseX/
├── src/        React app — pages, components, AuthContext, api.js, socket.js
├── public/     static assets
└── server/     Express API — routes, Mongoose models, auth middleware, server.js
```