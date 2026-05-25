# HealthGuard Uganda

Offline-first health misinformation screening for community members, health workers, and administrators in Uganda.

## Quick start

### Mobile / Web app

```bash
cd HealthGuardUganda
npm install
npm start
```

- Press **w** for web (recommended for development)
- Press **a** for Android emulator

### National backend (optional)

```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Server runs at `http://localhost:3000`. The app uses this URL on web by default.

### Demo login (works offline)

| Role | Phone | Password |
|------|-------|----------|
| Admin | `0700000000` | `password123` |
| Health Worker | `0701000001` | `healthworker` |
| Community | `0702000002` | `community123` |

## Configuration

- **Settings → National Server URL** — override API base (e.g. `http://192.168.1.5:3000/api` on a physical phone)
- **Android emulator** default: `http://10.0.2.2:3000/api`
- **Web** default: `http://localhost:3000/api`

## Architecture

- **Client:** Expo React Native (web, iOS, Android)
- **Storage:** `expo-sqlite` (claims, knowledge, patients, session, settings)
- **AI:** Rule engine + logistic regression (`ml/model_weights.json`) + semantic assist
- **Server:** Express + Prisma (SQLite)

## Project layout

```
App.tsx                 # Navigation & role-based routes
src/db/                 # SQLite persistence
src/ai/                 # Classification pipeline
src/screens/            # UI screens
src/services/           # Auth, sync, connectivity
server/                 # National backend API
portal/                 # Static admin portal
archive/native-android/ # Legacy Java app (not wired to Expo)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run web` | Web only |
| `npm run android` | Native Android build |

## Status indicators

The sidebar shows connection mode:

- **Offline · Local data** — no server reachability
- **Online · Demo session** — logged in with offline demo token
- **Online · National server** — server reachable and JWT session
