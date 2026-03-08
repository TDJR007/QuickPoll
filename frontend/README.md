# QuickPoll — Frontend

React + TypeScript frontend for QuickPoll. Single-question polls with real-time results, httpOnly cookie auth, and a minimal voting UI.

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **State:** Zustand (auth + theme)
- **Server State:** TanStack Query
- **HTTP:** Axios
- **UI:** shadcn/ui + Tailwind CSS
- **Routing:** React Router v6

## Prerequisites

- Node.js 18+
- Backend running on `http://localhost:3000`

## Getting Started

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Set up environment**
```bash
cp .env.example .env
```

`.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

**3. Start the dev server**
```bash
npm run dev
```

App runs on `http://localhost:5173`.

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/login` | ❌ | Login page |
| `/register` | ❌ | Register page |
| `/dashboard` | ✅ | Create a poll |
| `/poll/:id` | ❌ | View poll, vote, see results |

## Project Structure

```
src/
  pages/          # LoginPage, RegisterPage, DashboardPage, PollPage
  components/     # shadcn/ui components
  store/          # Zustand stores (auth, theme)
  api/            # Axios client
  lib/            # shadcn utils
```

## Key Design Decisions

- **httpOnly cookie auth** — token never touches JS, set and cleared server-side only. Zustand only stores non-sensitive user info (id, email) in sessionStorage
- **sessionStorage for user** — survives page refresh, dies when tab closes
- **localStorage for theme** — dark/light preference persists across sessions
- **TanStack Query for server state** — polls and results are server state, Zustand is for client state (auth, UI)
- **Axios interceptor removed** — no need to manually attach Authorization header, cookies are sent automatically by the browser with `withCredentials: true`
- **`refetchInterval: 10000`** on poll results — poor man's real-time, refetches every 10 seconds
- **`invalidateQueries` after vote** — tells TanStack Query results are stale, triggers immediate refetch

## State Architecture

```
Zustand (client state)
  authStore     → user object, setAuth, clearAuth (sessionStorage)
  themeStore    → isDark, toggle (localStorage)

TanStack Query (server state)
  ['poll', id]  → poll results, cached, auto-refetched
```

## Auth Flow

```
Register/Login → backend sets httpOnly cookie
              → frontend stores user in Zustand (sessionStorage)
              → ProtectedRoute checks Zustand for user
              → Axios sends cookie automatically on every request

Logout        → POST /auth/logout (backend clears cookie)
              → clearAuth() (Zustand clears user)
              → redirect to /login
```

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The backend serves this in production mode — no separate deployment needed.

## Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```