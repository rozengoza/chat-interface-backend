# ARC Backend

Node.js / Express API for the ARC multi-provider chat interface.
Connects to Neon PostgreSQL. Supports Neon Auth or local JWT auth.

---

## Project structure

```
arc-backend/
├── src/
│   ├── index.js                 ← Express app, middleware, route wiring
│   ├── routes/
│   │   ├── auth.js              ← POST /auth/register, /auth/login, GET /auth/me
│   │   ├── chats.js             ← CRUD  /chats, /chats/:id
│   │   ├── completion.js        ← POST /completion  (SSE streaming)
│   │   └── models.js            ← GET  /models  (public catalogue)
│   ├── adapters/
│   │   └── index.js             ← Provider adapter layer (all AI providers)
│   ├── db/
│   │   ├── index.js             ← Neon connection pool + transaction helper
│   │   └── migrate.js           ← Schema migration runner
│   └── middleware/
│       └── auth.js              ← requireAuth (Neon Auth or local JWT)
├── sql/
│   └── schema.sql               ← Full DB schema + seed data
├── .env.example                 ← All env vars documented
├── .gitignore
├── render.yaml                  ← Render.com free deploy config
├── railway.toml                 ← Railway free deploy config
├── fly.toml                     ← Fly.io free deploy config (best for Nepal)
├── Dockerfile                   ← For Fly.io / any container host
└── package.json
```

---

## Quick start (local dev)

```bash
# 1. Clone and install
npm install

# 2. Copy env file and fill in your Neon DATABASE_URL
cp .env.example .env

# 3. Run the schema in Neon's SQL Editor (paste sql/schema.sql and run)

# 4. Start dev server with auto-restart
npm run dev
# → http://localhost:3001
# → http://localhost:3001/health  should return { ok: true }
# → http://localhost:3001/models  should return all providers
```

---

## Auth modes

### Option A — Local JWT (simpler, no extra setup)

Keep `USE_NEON_AUTH=false` in `.env`. Users register and log in via:
- `POST /auth/register` — creates account, returns JWT
- `POST /auth/login` — verifies password, returns JWT

The JWT is signed with your `JWT_SECRET` (HS256). Store it in the frontend
however you like (memory, sessionStorage). Never localStorage for JWTs.

### Option B — Neon Auth (recommended for production)

Neon Auth (powered by Stack Auth) handles the full auth flow — sign up,
sign in, OAuth providers — and issues RS256 JWTs that this backend validates.

**Setup:**
1. In Neon dashboard → **Auth** tab → Enable Auth for your project
2. Copy the **JWKS URL** (looks like `https://your-project.neon.tech/.well-known/jwks.json`)
3. Set in `.env`:
   ```
   USE_NEON_AUTH=true
   NEON_AUTH_JWKS_URL=https://your-project.neon.tech/.well-known/jwks.json
   ```
4. In your frontend, install `@stackauth/core` or the Neon Auth JS SDK
5. After sign-in, get the access token and send it as `Authorization: Bearer <token>`

With Neon Auth you don't need `JWT_SECRET` or the `/auth/*` routes at all.

---

## API reference

### Auth (local mode only)
| Method | Path            | Auth | Body                     |
|--------|-----------------|------|--------------------------|
| POST   | /auth/register  | —    | `{ username, password }` |
| POST   | /auth/login     | —    | `{ username, password }` |
| GET    | /auth/me        | JWT  | —                        |

### Chats
| Method | Path        | Auth | Notes                          |
|--------|-------------|------|--------------------------------|
| GET    | /chats      | JWT  | List with message counts       |
| POST   | /chats      | JWT  | `{ provider, model, title? }`  |
| GET    | /chats/:id  | JWT  | Chat + full message history    |
| PATCH  | /chats/:id  | JWT  | `{ title }`                    |
| DELETE | /chats/:id  | JWT  | Cascades to messages           |

### Completion (SSE)
| Method | Path        | Auth | Body                                            |
|--------|-------------|------|-------------------------------------------------|
| POST   | /completion | JWT  | `{ chatId, messages, provider, model, apiKey? }`|

SSE events streamed back:
- `event: chunk` — `{ text: "..." }` — one per streamed token chunk
- `event: done`  — `{ messageId, tokens }` — fires when stream ends
- `event: error` — `{ message }` — provider error or rate limit hit

### Models (public)
| Method | Path    | Auth | Notes                        |
|--------|---------|------|------------------------------|
| GET    | /models | —    | All active models by provider|

---

## Deployment — free tier options

### Option 1: Render.com (easiest, zero config)

Best for: getting online fast. Spins down after 15 min idle (free tier).

```bash
# 1. Push your code to GitHub
# 2. Go to render.com → New → Web Service → connect your repo
# 3. Render auto-detects render.yaml and pre-fills build/start commands
# 4. Add env vars in the Render dashboard (DATABASE_URL, JWT_SECRET, etc.)
# 5. Deploy
```

The `render.yaml` in this repo is the Blueprint config — Render reads it
automatically. `JWT_SECRET` is set to `generateValue: true` so Render creates
a secure random value for you.

Free tier URL: `https://arc-backend.onrender.com`

---

### Option 2: Railway (no sleep, $5 free credit/month)

Best for: always-on API that doesn't cold-start. $5/month credit covers
a small Node app with no issues.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init          # links to your Railway project
railway up            # deploys

# Set environment variables
railway variables set DATABASE_URL="your-neon-url"
railway variables set JWT_SECRET="your-secret"
# ... etc
```

The `railway.toml` in this repo is picked up automatically.

---

### Option 3: Fly.io (best for Nepal — Singapore region)

Best for: lowest latency from Nepal (sin = Singapore, ~80ms vs ~200ms for US).
Never sleeps. 3 free shared VMs.

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# First deploy (reads fly.toml)
fly launch --no-deploy   # sets up app without deploying yet

# Set secrets (env vars for production)
fly secrets set DATABASE_URL="your-neon-pooled-url"
fly secrets set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
fly secrets set ALLOWED_ORIGINS="https://arc-lime.vercel.app"
fly secrets set NODE_ENV="production"

# Deploy
fly deploy
```

Check it: `fly status` and `fly logs`

---

## Security notes

- **User API keys are never stored.** The `apiKey` field in `/completion` is used
  once to proxy the request and never written anywhere.
- Passwords use bcryptjs (cost 12).
- In Neon Auth mode, tokens are RS256-signed by Neon — no secret to manage.
- Rate limiting: 200 req/15min globally, 20 req/15min on `/auth`.
- Free-tier AI usage is capped per user per day via `rate_limit_log`.
