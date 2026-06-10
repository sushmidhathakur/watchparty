# 🎬 WatchParty

**Watch movies together, anywhere.** A real-time collaborative movie watching platform with YouTube sync, live chat, and emoji reactions.

![WatchParty Banner](https://via.placeholder.com/1200x400/E50914/FFFFFF?text=WatchParty)

---

## ✨ Features

- 🔴 **Real-time video sync** — Play, pause, seek synced within ~100ms for all viewers
- 🎥 **YouTube integration** — Paste any YouTube URL, watch together
- 💬 **Live chat** — Real-time messages with avatars and timestamps
- 🎉 **Emoji reactions** — Floating emoji animations across the screen
- 👥 **Member presence** — See who's watching in real time
- 🔒 **Rooms** — Public (browseable) or private (invite code only)
- 👤 **Auth** — Register, login, or join as a guest instantly
- 👑 **Host controls** — Only the host controls video; guests chat and react

---

## 🏗 Architecture

```
Client (React + Vite)
  └── Socket.io Client ──────────┐
  └── REST (Axios)               │
                                 ▼
                        Express Server (Node.js)
                          ├── REST API (/api/auth, /api/rooms, /api/messages)
                          ├── Socket.io Server ← SYNC ENGINE
                          └── MongoDB (Mongoose)
```

### How sync works

1. Host presses Play → client emits `video:play` with `{ currentTime, clientTimestamp }`
2. Server updates DB and broadcasts to all room members with `serverTimestamp`
3. Each client calculates: `adjustedTime = currentTime + (Date.now() - serverTimestamp) / 1000`
4. Client seeks to `adjustedTime` and starts playing
5. Result: everyone is within ~100ms of each other — imperceptible lag

---

## 📁 Project Structure

```
watchparty/
├── server/
│   ├── index.js                 # Express + Socket.io server
│   ├── models/
│   │   ├── User.js              # User schema (auth, guest support)
│   │   ├── Room.js              # Room schema (playback state, invite code)
│   │   └── Message.js           # Chat message schema
│   ├── routes/
│   │   ├── auth.js              # POST /register /login /guest, GET /me
│   │   ├── rooms.js             # CRUD rooms, GET by invite code
│   │   └── messages.js          # GET chat history
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── socket/
│   │   └── handlers.js          # ALL real-time logic ⚡
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── App.jsx              # Router
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # Login / Register / Guest
│   │   │   ├── HomePage.jsx     # Browse public rooms
│   │   │   ├── LobbyPage.jsx    # Create room
│   │   │   └── RoomPage.jsx     # Main watch party view
│   │   ├── components/
│   │   │   ├── Room/
│   │   │   │   ├── VideoPlayer.jsx   # YouTube IFrame + sync hooks
│   │   │   │   ├── VideoUrlInput.jsx # Host URL input
│   │   │   │   ├── RoomHeader.jsx    # Top bar + invite code
│   │   │   │   └── MemberList.jsx    # Who's watching
│   │   │   └── Chat/
│   │   │       ├── ChatPanel.jsx     # Real-time chat UI
│   │   │       └── EmojiReactions.jsx # Floating reactions
│   │   ├── hooks/
│   │   │   ├── useSocket.js     # Socket.io connection + events
│   │   │   └── useRoom.js       # Room state + all sync actions
│   │   └── store/
│   │       └── index.js         # Zustand (auth + room stores)
│   └── vite.config.js
└── package.json                 # Monorepo root
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 1. Clone & install
```bash
git clone https://github.com/yourusername/watchparty.git
cd watchparty
npm install
```

### 2. Configure environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env:
#   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/watchparty
#   JWT_SECRET=your_random_secret_here_make_it_long
#   CLIENT_URL=http://localhost:5173

# Client
cp client/.env.example client/.env
# Edit client/.env:
#   VITE_API_URL=http://localhost:5000
#   VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run development servers
```bash
npm run dev
# → Backend: http://localhost:5000
# → Frontend: http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Railway (free tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → GitHub repo
3. Add service: **Node.js** (point to `/server`)
4. Add service: **MongoDB** (Railway provides it, or use Atlas)
5. Set environment variables in Railway dashboard:
   ```
   MONGODB_URI=<from Railway MongoDB or Atlas>
   JWT_SECRET=<long random string>
   CLIENT_URL=https://yourapp.vercel.app
   NODE_ENV=production
   ```
6. Your backend URL: `https://yourapp.up.railway.app`

### Frontend → Vercel (free tier)

1. Go to [vercel.com](https://vercel.com) → New Project → GitHub repo
2. Set root directory to `client`
3. Set environment variables:
   ```
   VITE_API_URL=https://yourapp.up.railway.app
   VITE_SOCKET_URL=https://yourapp.up.railway.app
   ```
4. Deploy → Your app is live! 🎉

---

## 🔌 Socket Events Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `room:join` | Client→Server | `{ roomId, username, avatarColor }` | Join a room |
| `room:state` | Server→Client | `{ videoUrl, playbackState, isHost }` | Current room state on join |
| `room:users` | Server→Client | `{ users[] }` | Updated member list |
| `video:play` | Both | `{ roomId, currentTime, clientTimestamp }` | Play video |
| `video:pause` | Both | `{ roomId, currentTime }` | Pause video |
| `video:seek` | Both | `{ roomId, currentTime }` | Seek to timestamp |
| `video:change` | Client→Server | `{ roomId, videoUrl, videoType }` | Host changes video |
| `chat:send` | Client→Server | `{ roomId, text, emoji }` | Send chat message |
| `chat:message` | Server→Client | `{ username, text, type, createdAt }` | Received message |
| `reaction:send` | Client→Server | `{ roomId, emoji }` | Send emoji reaction |
| `reaction:broadcast` | Server→Client | `{ emoji, username, id }` | Floating reaction |

---

## 🗄 Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| username | String | Unique display name |
| email | String | Unique email |
| passwordHash | String | bcrypt hash |
| avatarColor | String | Hex color for avatar |
| isGuest | Boolean | Temp guest account |

### Rooms
| Field | Type | Description |
|-------|------|-------------|
| title | String | Room display name |
| hostId | ObjectId | Room creator (ref: User) |
| videoUrl | String | Current YouTube URL |
| videoType | Enum | youtube/direct/none |
| isPublic | Boolean | Discoverable on home page |
| inviteCode | String | 6-char invite code |
| playbackState | Object | isPlaying, currentTime, lastUpdatedAt |
| members | Array | List of joined users |

### Messages
| Field | Type | Description |
|-------|------|-------------|
| roomId | ObjectId | Room (ref: Room) |
| userId | ObjectId | Sender (ref: User) |
| username | String | Display name (denormalized) |
| text | String | Message content |
| emoji | String | Emoji reaction |
| type | Enum | text/emoji/system |

---

## 🛣 Roadmap

- [ ] Screen sharing (WebRTC)
- [ ] Private messaging between users
- [ ] Watch history
- [ ] AI movie recommendations (Claude API)
- [ ] Support for direct video URLs (.mp4)
- [ ] Mobile app (React Native)
- [ ] Rooms with password protection

---

## 📄 License

MIT — free to use, modify, and deploy.
