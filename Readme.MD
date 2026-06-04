<h1 align="center">
  <img src="https://raw.githubusercontent.com/rozengoza/chat-interface-backend/public/assets/arc-logo.svg" alt="ARC Logo" width="80" /><br/>
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
