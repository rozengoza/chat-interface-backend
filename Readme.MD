<h1 align="center">
  <img src="https://raw.githubusercontent.com/rozengoza/chat-interface-backend/development/public/assets/arc-logo.svg" alt="ARC Logo" width="80" /><br/>
  ARC Backend
</h1>

<p align="center">
  <strong>Multi‑provider chat API — stream AI completions, manage conversations, and own your data.</strong><br>
  <sub>Node.js · Express · PostgreSQL (Neon) · SSE · JWT · Neon Auth</sub>
</p>

<p align="center">
  <a href="#local-dev"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js" alt="Node version"></a>
  <a href="#api-reference"><img src="https://img.shields.io/badge/dynamic/json?color=blue&label=version&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Frozengoza%2Farc-backend%2Fmain%2Fpackage.json" alt="Version"></a>
  <a href="https://github.com/rozengoza/arc-backend/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://github.com/rozengoza/arc-backend/actions"><img src="https://img.shields.io/github/actions/workflow/status/rozengoza/arc-backend/ci.yml?branch=main" alt="CI status"></a>
  <a href="https://fly.io/"><img src="https://img.shields.io/badge/deploy-Fly.io-purple?logo=flydotio" alt="Deploy on Fly.io"></a>
  <a href="https://render.com/"><img src="https://img.shields.io/badge/deploy-Render-46E3B7?logo=render" alt="Deploy on Render"></a>
  <a href="https://railway.app/"><img src="https://img.shields.io/badge/deploy-Railway-0B0D0E?logo=railway" alt="Deploy on Railway"></a>
</p>

---

## Why ARC Backend?

The [ARC frontend](https://github.com/rozengoza/claude-chat-interface-make-chats-with-your-apikey) gives you a clean chat UI, but **conversation persistence, multi‑user support, and provider abstraction need a backend**. That’s where this API comes in.

ARC Backend is the fast, stateless Node.js server that:
- **Persists your chats** in a Neon PostgreSQL database, so you never lose context.
- **Streams completions** from multiple AI providers (Anthropic, OpenAI, etc.) using Server‑Sent Events.
- **Secures your API keys** — keys live in memory on the server only for the duration of a request, never logged or stored.
- **Scales for zero cost** — deploy on any free‑tier platform (Fly.io, Render, Railway) and only pay for the database and AI tokens.

> 🧠 **You bring the API keys, we handle the rest.**  
> The backend proxies AI requests, adds usage limits, and keeps your conversation history safe.

---

## Architecture at a Glance

```mermaid
graph LR
  A[Frontend - ARC UI] -->|HTTPS + JWT| B[ARC Backend - Express]
  B -->|Pooled connections| C[Neon PostgreSQL]
  B -->|Fetch| D["AI Providers - Anthropic, OpenAI..."]
  B -->|JWKS validation| E[Neon Auth - optional]
  C -->|Schema| F["sql/schema.sql"]
  B -->|Deploy to| G["Render / Railway / Fly.io"]
```

Every component is documented in this README — from local development to production deployment.

---

## Key Features

| Feature | Description |
| --- | --- |
| 🔐 **Two Auth Modes** | Local JWT (bcrypt) or Neon Auth (RS256, OAuth ready). Choose what fits your stack. |
| 💬 **Chat Management** | Full CRUD for chats, each with a message history. Each user sees only their own data. |
| ⚡ **SSE Streaming** | Real‑time token‑by‑token completion streams directly to the frontend. |
| 🤖 **Provider Adapter Layer** | One unified endpoint, multiple AI providers. Easily add new ones without touching routes. |
| 🛡️ **API Key Proxy** | User API keys never touch the database; they're passed in the request and discarded. |
| 📊 **Usage Limits** | Per‑user daily rate limiting, logged to `rate_limit_log`. Prevents free‑tier abuse. |
| 🚀 **Zero‑Config Deploys** | Ready‑to‑use `render.yaml`, `railway.toml`, `fly.toml`, and `Dockerfile`. |
| 🧪 **Health & Models** | Public `/health` and `/models` endpoints for quick status checks. |

---

## How It Works

### 1 · Local Authentication Flow

```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend
  participant BE as ARC Backend
  participant DB as Neon DB

  U->>FE: Enter username & password
  FE->>BE: POST /auth/register (or /auth/login)
  BE->>DB: Insert/verify credentials (bcrypt)
  DB-->>BE: User record
  BE-->>FE: JWT token (HS256, signed with JWT_SECRET)
  FE->>FE: Store JWT in memory
```

--- 

### 2 . Neon Auth

```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend
  participant NA as Neon Auth Service
  participant BE as ARC Backend

  U->>FE: Sign in via Neon Auth widget
  FE->>NA: Authenticate (email/OAuth)
  NA-->>FE: RS256 access token
  FE->>BE: Request with Bearer token
  BE->>NA: Validate token (JWKS endpoint)
  NA-->>BE: Public keys
  BE->>BE: Verify signature, extract user_id
  BE-->>FE: Protected resource (user's chats)
```

---

### 3 . Streaming a Completion (SSE)

```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend
  participant BE as ARC Backend
  participant AI as AI Provider (Anthropic)

  U->>FE: Types message & sends
  FE->>BE: POST /completion { chatId, messages, provider, model, apiKey }
  BE->>BE: Validate JWT, check rate limits
  BE->>DB: Retrieve chat history (if existing)
  BE->>AI: Proxy request with apiKey, stream=true
  AI-->>BE: Token chunks (streamed)
  loop Each chunk
    BE-->>FE: SSE event: chunk { text: "..." }
  end
  AI-->>BE: Stream ends
  BE-->>FE: SSE event: done { messageId, tokens }
  BE->>DB: Save complete message pair
```

---

### 4 . Chat Lifecycle
```mermaid
stateDiagram-v2
  [*] --> CreateChat: POST /chats
  CreateChat --> Active: title set
  Active --> AddMessage: POST /completion
  AddMessage --> Active: messages added
  Active --> Rename: PATCH /chats/:id
  Rename --> Active
  Active --> Delete: DELETE /chats/:id
  Delete --> [*]
```

---

#### 1. Clone and install
git clone https://github.com/rozengoza/chat-interface-backend.git
cd chat-interface-backend
npm install

#### 2. Create environment file
cp .env.example .env
##### Fill in your Neon DATABASE_URL (pooled connection string)

#### Required
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

#### Local auth
USE_NEON_AUTH=false            # set to true for Neon Auth
JWT_SECRET=your-super-secret   # only needed if USE_NEON_AUTH=false

#### Optional
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
PORT=5000

#### 3. Initialize the database
##### Open Neon SQL Editor and paste the contents of sql/schema.sql → Run

#### 4. Start the server
npm run dev
#####→ http://localhost:5000
##### → http://localhost:5000/health   {"ok":true}
##### → http://localhost:5000/models   list of available models

---

## API Reference

> All protected endpoints require the header `Authorization: Bearer <token>`.

### Authentication — Local JWT Mode

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ username, password }` | `{ token }` |
| `POST` | `/auth/login` | `{ username, password }` | `{ token }` |
| `GET` | `/auth/me` | — *(header only)* | `{ user }` |

<details>
<summary><strong>Example — register a new user</strong></summary>

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"s3cret"}' | jq

# {
#   "token": "eyJhbGciOiJIUzI1NiIs..."
# }
```
</details>

---

### Chat Management

| Method | Endpoint | Auth | Body / Notes | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/chats` | JWT | Returns list with message counts | `[{ id, title, ... }]` |
| `POST` | `/chats` | JWT | `{ provider, model, title? }` | `{ id, title, ... }` |
| `GET` | `/chats/:id` | JWT | Full chat + messages | `{ id, messages: [...] }` |
| `PATCH` | `/chats/:id` | JWT | `{ title }` | `{ id, title }` |
| `DELETE` | `/chats/:id` | JWT | Cascades to messages | `{ success: true }` |

---

## FAQ

<details>
<summary><strong>When should I use Neon Auth vs. local JWT?</strong></summary>

Local JWT is perfect for quick prototyping and when you don't need social login.

Neon Auth gives you passwordless/OAuth flows, a hosted sign‑in widget, and stronger RS256 tokens. Ideal for production apps that want a polished auth UX without extra code.

</details>

<details>
<summary><strong>Can I add more AI providers?</strong></summary>

Absolutely. The adapter pattern in `src/adapters/index.js` makes it easy. Just implement a function that accepts the same arguments and returns a stream or response object, then register it in the catalogue.

</details>

<details>
<summary><strong>Do I still need an Anthropic API key?</strong></summary>

Yes, ARC Backend proxies your key to the provider. The frontend sends the key with each completion request, or you can configure a default key server‑side (not recommended for multi‑user deployments).

</details>

<details>
<summary><strong>Why SSE instead of WebSockets?</strong></summary>

SSE is simpler, works over HTTP/1.1 and HTTP/2, and is perfect for one‑way streaming of tokens. For a chat completion, you only need server‑to‑client streaming.

</details>

---

## Contributing

1. **Fork** the repository on GitHub.
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Make** your changes and test with `npm run dev`.
4. **Run** the migration if you add new tables: `node src/db/migrate.js`.
5. **Submit** a Pull Request with a clear description.

Check the [open issues](https://github.com/rozengoza/chat-interface-backend/issues) for ways to help.

---

## License

[MIT](https://github.com/rozengoza/chat-interface-backend/blob/main/LICENSE) — see `LICENSE` for details.

---

<p align="center">
  <sub>By <a href="https://github.com/rozengoza">rozengoza</a> · Deployed on <a href="https://railway.app/">Railway</a> for zero‑cost global latency.</sub>
</p>
