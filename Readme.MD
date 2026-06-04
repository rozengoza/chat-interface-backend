<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ARC Backend</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --arc-bg:#0a0c10;--arc-surface:#111318;--arc-border:#1e2330;
  --arc-text:#e8eaf0;--arc-muted:#7a8099;--arc-accent:#5b8cff;
  --arc-teal:#2dd4bf;--arc-purple:#a78bfa;--arc-green:#4ade80;
  --arc-amber:#fbbf24;--arc-red:#f87171;
  --font-head:'Syne',sans-serif;--font-mono:'JetBrains Mono',monospace;
}
html{scroll-behavior:smooth}
body{background:var(--arc-bg);color:var(--arc-text);font-family:var(--font-mono);padding:0;min-height:100vh}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes blink{0%,100%{opacity:1}49%{opacity:1}50%{opacity:0}}
@keyframes dash{0%{stroke-dashoffset:60}100%{stroke-dashoffset:0}}

/* ── Hero ─────────────────────────────────────── */
.hero{
  position:relative;padding:5rem 2rem 3.5rem;text-align:center;overflow:hidden;
  border-bottom:1px solid var(--arc-border);
  animation:fadeIn .8s ease both;
}
.hero-grid{
  position:absolute;inset:0;
  background-image:linear-gradient(var(--arc-border) 1px,transparent 1px),
    linear-gradient(90deg,var(--arc-border) 1px,transparent 1px);
  background-size:40px 40px;opacity:.4;pointer-events:none;
}
.hero-glow{
  position:absolute;top:-60px;left:50%;transform:translateX(-50%);
  width:600px;height:340px;
  background:radial-gradient(ellipse,rgba(91,140,255,.18) 0%,transparent 70%);
  pointer-events:none;
}
.logo-ring{
  display:inline-flex;align-items:center;justify-content:center;
  width:76px;height:76px;border-radius:50%;
  border:1.5px solid var(--arc-accent);
  position:relative;margin-bottom:1.75rem;
  animation:fadeUp .6s ease .1s both;
}
.logo-ring::before{
  content:'';position:absolute;inset:-7px;border-radius:50%;
  border:1px solid rgba(91,140,255,.3);
  animation:spin 8s linear infinite;
  border-top-color:var(--arc-accent);
}
.logo-ring::after{
  content:'';position:absolute;inset:-14px;border-radius:50%;
  border:1px solid rgba(91,140,255,.12);
  animation:spin 14s linear infinite reverse;
  border-right-color:rgba(91,140,255,.3);
}
.logo-text{font-family:var(--font-head);font-size:26px;font-weight:800;letter-spacing:3px;color:var(--arc-accent)}
.hero h1{font-family:var(--font-head);font-size:clamp(30px,5.5vw,54px);font-weight:800;line-height:1.08;margin-bottom:1.25rem;animation:fadeUp .6s ease .2s both;letter-spacing:-1px}
.hero h1 span{color:var(--arc-accent)}
.hero-sub{color:var(--arc-muted);font-size:13px;line-height:1.75;max-width:520px;margin:0 auto 1.75rem;animation:fadeUp .6s ease .3s both}
.badge-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;animation:fadeUp .6s ease .4s both;margin-bottom:2rem}
.badge{font-size:11px;padding:4px 11px;border-radius:4px;border:1px solid;font-family:var(--font-mono);letter-spacing:.3px}
.badge.blue{background:rgba(91,140,255,.1);border-color:rgba(91,140,255,.4);color:var(--arc-accent)}
.badge.teal{background:rgba(45,212,191,.1);border-color:rgba(45,212,191,.4);color:var(--arc-teal)}
.badge.purple{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.4);color:var(--arc-purple)}
.badge.green{background:rgba(74,222,128,.1);border-color:rgba(74,222,128,.4);color:var(--arc-green)}
.badge.amber{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.4);color:var(--arc-amber)}
.hero-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:fadeUp .6s ease .5s both}
.hero-btn{
  font-family:var(--font-mono);font-size:12px;padding:9px 20px;border-radius:6px;
  text-decoration:none;border:1px solid;cursor:pointer;transition:all .2s;
}
.hero-btn.primary{background:var(--arc-accent);border-color:var(--arc-accent);color:#0a0c10;font-weight:700}
.hero-btn.primary:hover{background:#7aa3ff;border-color:#7aa3ff}
.hero-btn.outline{background:transparent;border-color:var(--arc-border);color:var(--arc-muted)}
.hero-btn.outline:hover{border-color:var(--arc-accent);color:var(--arc-accent)}

/* ── Shared ───────────────────────────────────── */
.section{padding:3rem 2rem;border-bottom:1px solid var(--arc-border);max-width:900px;margin:0 auto}
.section-label{font-size:10px;letter-spacing:2.5px;color:var(--arc-muted);text-transform:uppercase;margin-bottom:.6rem}
.section-title{font-family:var(--font-head);font-size:24px;font-weight:700;margin-bottom:1.75rem;color:var(--arc-text)}

/* ── Features ─────────────────────────────────── */
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.feat{
  background:var(--arc-surface);border:1px solid var(--arc-border);
  border-radius:8px;padding:1.4rem 1.1rem;
  transition:border-color .25s,transform .25s;cursor:default;
}
.feat:hover{border-color:var(--arc-accent);transform:translateY(-3px)}
.feat-icon{font-size:22px;margin-bottom:.8rem}
.feat-title{font-size:13px;font-weight:600;color:var(--arc-text);margin-bottom:.45rem;font-family:var(--font-head)}
.feat-desc{font-size:11px;color:var(--arc-muted);line-height:1.65}

/* ── Architecture SVG ─────────────────────────── */
.arch-wrap{background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;padding:1.75rem;overflow-x:auto}
svg.arch{display:block;min-width:560px;width:100%;height:auto}

/* ── Flow steps ───────────────────────────────── */
.flow-steps{display:flex;flex-direction:column}
.flow-step{display:flex;gap:1.4rem;padding:1.1rem 0;position:relative}
.flow-step:not(:last-child)::after{
  content:'';position:absolute;left:17px;top:46px;bottom:0;width:1px;
  background:linear-gradient(to bottom,rgba(91,140,255,.3),transparent);
}
.step-num{
  flex-shrink:0;width:36px;height:36px;border-radius:50%;
  background:rgba(91,140,255,.12);border:1px solid rgba(91,140,255,.4);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:var(--arc-accent);
}
.step-body{padding-top:5px}
.step-title{font-size:13px;font-weight:600;color:var(--arc-text);margin-bottom:.3rem;font-family:var(--font-head)}
.step-desc{font-size:11px;color:var(--arc-muted);line-height:1.65}

/* ── API table ────────────────────────────────── */
.api-wrap{background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;overflow:hidden}
.api-table{width:100%;border-collapse:collapse;font-size:12px}
.api-table th{text-align:left;padding:10px 14px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--arc-muted);border-bottom:1px solid var(--arc-border)}
.api-table td{padding:9px 14px;border-bottom:1px solid rgba(30,35,48,.6)}
.api-table tr:last-child td{border-bottom:none}
.api-table tr:hover td{background:rgba(91,140,255,.04)}
.method{font-size:10px;padding:3px 8px;border-radius:3px;font-weight:700;letter-spacing:.5px;font-family:var(--font-mono)}
.get{background:rgba(74,222,128,.15);color:var(--arc-green)}
.post{background:rgba(91,140,255,.15);color:var(--arc-accent)}
.patch{background:rgba(251,191,36,.15);color:var(--arc-amber)}
.del{background:rgba(248,113,113,.15);color:var(--arc-red)}
.route{color:var(--arc-teal);font-family:var(--font-mono)}
.note{color:var(--arc-muted);font-size:11px}

/* ── Terminal ─────────────────────────────────── */
.terminal{
  background:#050709;border:1px solid var(--arc-border);border-radius:8px;
  padding:1.4rem;font-size:12px;line-height:1.9;position:relative;overflow:hidden;
}
.terminal::before{
  content:'';position:absolute;left:0;top:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent 0%,var(--arc-accent) 50%,transparent 100%);
  background-size:200% 100%;animation:shimmer 3.5s linear infinite;
}
.terminal-bar{display:flex;gap:6px;margin-bottom:1.1rem}
.dot{width:10px;height:10px;border-radius:50%}
.dot.r{background:#f87171}.dot.y{background:#fbbf24}.dot.g{background:#4ade80}
.t-prompt{color:var(--arc-muted)}
.t-cmd{color:var(--arc-accent)}
.t-out{color:var(--arc-green)}
.t-comment{color:#3d4a5e}
.t-cursor{display:inline-block;width:8px;height:14px;background:var(--arc-accent);vertical-align:text-bottom;animation:blink 1s step-end infinite}
.t-key{color:var(--arc-amber)}
.t-val{color:var(--arc-purple)}

/* ── SSE demo ─────────────────────────────────── */
.sse-demo{background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;padding:1.4rem}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--arc-green);animation:pulse 1.5s ease-in-out infinite;vertical-align:middle;margin-right:6px}
.sse-stream{font-family:var(--font-mono);font-size:11px;line-height:1.85}
.sse-event{color:var(--arc-muted)}
.sse-chunk{color:var(--arc-green);opacity:0;transition:opacity .15s}
.sse-chunk.visible{opacity:1}

/* ── Deploy ───────────────────────────────────── */
.deploy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:1.5rem}
.deploy-card{
  background:var(--arc-surface);border:1px solid var(--arc-border);
  border-radius:8px;padding:1.25rem;text-align:center;
  transition:border-color .25s,transform .25s;cursor:pointer;text-decoration:none;display:block;
}
.deploy-card:hover{transform:translateY(-3px)}
.deploy-card.fly:hover{border-color:var(--arc-purple)}
.deploy-card.render:hover{border-color:var(--arc-teal)}
.deploy-card.railway:hover{border-color:var(--arc-green)}
.deploy-name{font-size:14px;font-weight:600;margin:.6rem 0 .3rem;font-family:var(--font-head)}
.deploy-note{font-size:10px;color:var(--arc-muted)}

/* ── Stats ────────────────────────────────────── */
.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.stat{background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;padding:1.1rem;text-align:center}
.stat-num{font-family:var(--font-head);font-size:30px;font-weight:800;color:var(--arc-accent);display:block}
.stat-label{font-size:10px;color:var(--arc-muted);letter-spacing:1px;text-transform:uppercase;margin-top:.3rem}

/* ── FAQ ──────────────────────────────────────── */
.faq{display:flex;flex-direction:column;gap:8px}
details{background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;overflow:hidden;transition:border-color .2s}
details[open]{border-color:rgba(91,140,255,.4)}
summary{
  padding:1rem 1.25rem;font-size:13px;font-weight:600;cursor:pointer;
  list-style:none;display:flex;align-items:center;justify-content:space-between;
  font-family:var(--font-head);color:var(--arc-text);
}
summary::after{content:'+';color:var(--arc-accent);font-size:18px;font-weight:300;transition:transform .2s}
details[open] summary::after{content:'-'}
.faq-body{padding:0 1.25rem 1.1rem;font-size:12px;color:var(--arc-muted);line-height:1.7;border-top:1px solid var(--arc-border)}
.faq-body p{padding-top:.9rem}
code{background:rgba(91,140,255,.1);color:var(--arc-accent);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:11px}

/* ── Scroll reveal ────────────────────────────── */
.scroll-reveal{opacity:0;transform:translateY(22px);transition:opacity .55s ease,transform .55s ease}
.scroll-reveal.visible{opacity:1;transform:translateY(0)}

/* ── Footer ───────────────────────────────────── */
.footer{padding:2.5rem 2rem;text-align:center;color:var(--arc-muted);font-size:11px;line-height:2;border-top:1px solid var(--arc-border)}
.footer a{color:var(--arc-accent);text-decoration:none}
.footer a:hover{text-decoration:underline}
.footer-divider{color:var(--arc-border)}

/* ── Mermaid-style sequence (static) ─────────── */
.seq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;text-align:center;font-size:10px;color:var(--arc-muted);font-family:var(--font-mono)}
.seq-actor{padding:8px 4px;border:1px solid var(--arc-border);border-radius:4px;background:var(--arc-surface);font-weight:600;font-size:11px;color:var(--arc-text);margin-bottom:8px}
.seq-msg{padding:5px 2px;position:relative;font-size:10px}
.seq-arrow{color:var(--arc-accent)}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════
     HERO
═══════════════════════════════════════════ -->
<div class="hero">
  <div class="hero-grid"></div>
  <div class="hero-glow"></div>

  <div class="logo-ring"><span class="logo-text">ARC</span></div>
  <h1>Multi‑provider<br><span>Chat API</span></h1>
  <p class="hero-sub">
    Stream AI completions, manage conversations, and own your data.<br>
    Node.js · Express · PostgreSQL (Neon) · SSE · JWT · Neon Auth
  </p>

  <div class="badge-row">
    <span class="badge blue">node ≥ 18</span>
    <span class="badge teal">PostgreSQL · Neon</span>
    <span class="badge purple">SSE streaming</span>
    <span class="badge green">MIT license</span>
    <span class="badge amber">zero-cost deploy</span>
  </div>

  <div class="hero-links">
    <a class="hero-btn primary" href="https://github.com/rozengoza/chat-interface-backend">View on GitHub</a>
    <a class="hero-btn outline" href="#api">API Reference</a>
    <a class="hero-btn outline" href="#quickstart">Quick Start</a>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     WHY ARC
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// overview</div>
  <div class="section-title">Why ARC Backend?</div>
  <p style="font-size:13px;color:var(--arc-muted);line-height:1.8;max-width:680px;margin-bottom:1.5rem">
    The ARC frontend gives you a clean chat UI, but <span style="color:var(--arc-text)">conversation persistence, multi‑user support, and provider abstraction need a backend</span>. ARC Backend is the fast, stateless Node.js server that persists your chats in Neon PostgreSQL, streams completions from multiple AI providers via SSE, and keeps your API keys in memory only for the duration of each request — never logged or stored.
  </p>
  <div style="background:rgba(91,140,255,.07);border:1px solid rgba(91,140,255,.25);border-radius:8px;padding:1rem 1.25rem;font-size:12px;color:var(--arc-muted);line-height:1.7">
    🧠 &nbsp;<span style="color:var(--arc-accent);font-weight:600">You bring the API keys, we handle the rest.</span><br>
    The backend proxies AI requests, adds usage limits, and keeps your conversation history safe.
  </div>
</div>

<!-- ═══════════════════════════════════════════
     FEATURES
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// capabilities</div>
  <div class="section-title">Key Features</div>
  <div class="feature-grid">
    <div class="feat">
      <div class="feat-icon">🔐</div>
      <div class="feat-title">Two Auth Modes</div>
      <div class="feat-desc">Local JWT (bcrypt) or Neon Auth (RS256, OAuth ready). Choose what fits your stack.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">💬</div>
      <div class="feat-title">Chat Management</div>
      <div class="feat-desc">Full CRUD for chats with isolated per-user message history. Each user sees only their own data.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">⚡</div>
      <div class="feat-title">SSE Streaming</div>
      <div class="feat-desc">Real-time token-by-token completion streams directly to the frontend. No polling.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">🤖</div>
      <div class="feat-title">Provider Adapters</div>
      <div class="feat-desc">One unified endpoint, multiple AI providers. Add new ones without touching routes.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">🛡️</div>
      <div class="feat-title">API Key Proxy</div>
      <div class="feat-desc">User API keys never touch the database. Passed per-request, then discarded.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">📊</div>
      <div class="feat-title">Usage Limits</div>
      <div class="feat-desc">Per-user daily rate limiting logged to <code>rate_limit_log</code>. Prevents free-tier abuse.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">🚀</div>
      <div class="feat-title">Zero-Config Deploy</div>
      <div class="feat-desc">Ready-to-use <code>render.yaml</code>, <code>railway.toml</code>, <code>fly.toml</code>, and <code>Dockerfile</code>.</div>
    </div>
    <div class="feat">
      <div class="feat-icon">🧪</div>
      <div class="feat-title">Health &amp; Models</div>
      <div class="feat-desc">Public <code>/health</code> and <code>/models</code> endpoints for quick status checks.</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     ARCHITECTURE
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// architecture</div>
  <div class="section-title">System Overview</div>
  <div class="arch-wrap">
    <svg class="arch" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#5b8cff" opacity=".8"/>
        </marker>
        <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#2dd4bf" opacity=".8"/>
        </marker>
        <marker id="arr3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" opacity=".8"/>
        </marker>
        <marker id="arr4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#4ade80" opacity=".8"/>
        </marker>
      </defs>

      <!-- Frontend -->
      <rect x="20" y="85" width="110" height="50" rx="6" fill="rgba(91,140,255,.12)" stroke="rgba(91,140,255,.5)" stroke-width="1"/>
      <text x="75" y="107" text-anchor="middle" fill="#a0aec0" font-size="9" font-family="JetBrains Mono,monospace">Frontend</text>
      <text x="75" y="123" text-anchor="middle" fill="#5b8cff" font-size="8" font-family="JetBrains Mono,monospace">ARC UI</text>

      <!-- Backend -->
      <rect x="240" y="80" width="130" height="60" rx="6" fill="rgba(167,139,250,.12)" stroke="rgba(167,139,250,.5)" stroke-width="1"/>
      <text x="305" y="104" text-anchor="middle" fill="#a0aec0" font-size="9" font-family="JetBrains Mono,monospace">ARC Backend</text>
      <text x="305" y="119" text-anchor="middle" fill="#a78bfa" font-size="8" font-family="JetBrains Mono,monospace">Express · Node.js</text>
      <text x="305" y="132" text-anchor="middle" fill="#7a8099" font-size="7" font-family="JetBrains Mono,monospace">stateless · JWT</text>

      <!-- Neon DB -->
      <rect x="500" y="20" width="120" height="44" rx="6" fill="rgba(45,212,191,.12)" stroke="rgba(45,212,191,.5)" stroke-width="1"/>
      <text x="560" y="38" text-anchor="middle" fill="#a0aec0" font-size="9" font-family="JetBrains Mono,monospace">Neon DB</text>
      <text x="560" y="54" text-anchor="middle" fill="#2dd4bf" font-size="8" font-family="JetBrains Mono,monospace">PostgreSQL</text>

      <!-- AI Providers -->
      <rect x="500" y="82" width="120" height="44" rx="6" fill="rgba(251,191,36,.12)" stroke="rgba(251,191,36,.5)" stroke-width="1"/>
      <text x="560" y="100" text-anchor="middle" fill="#a0aec0" font-size="9" font-family="JetBrains Mono,monospace">AI Providers</text>
      <text x="560" y="116" text-anchor="middle" fill="#fbbf24" font-size="8" font-family="JetBrains Mono,monospace">Anthropic / OpenAI</text>

      <!-- Neon Auth -->
      <rect x="500" y="144" width="120" height="44" rx="6" fill="rgba(74,222,128,.12)" stroke="rgba(74,222,128,.5)" stroke-width="1"/>
      <text x="560" y="162" text-anchor="middle" fill="#a0aec0" font-size="9" font-family="JetBrains Mono,monospace">Neon Auth</text>
      <text x="560" y="178" text-anchor="middle" fill="#4ade80" font-size="8" font-family="JetBrains Mono,monospace">JWKS · RS256</text>

      <!-- Frontend → Backend -->
      <line x1="132" y1="110" x2="238" y2="110" stroke="#5b8cff" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arr)" opacity=".8">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2s" repeatCount="indefinite"/>
      </line>
      <text x="185" y="103" text-anchor="middle" fill="#5b8cff" font-size="8" font-family="JetBrains Mono,monospace">HTTPS+JWT</text>

      <!-- Backend → DB -->
      <line x1="370" y1="96" x2="498" y2="44" stroke="#2dd4bf" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arr2)" opacity=".8">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2.3s" repeatCount="indefinite"/>
      </line>

      <!-- Backend → AI -->
      <line x1="372" y1="110" x2="498" y2="105" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arr3)" opacity=".8">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.7s" repeatCount="indefinite"/>
      </line>

      <!-- Backend → Auth -->
      <line x1="370" y1="124" x2="498" y2="162" stroke="#4ade80" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#arr4)" opacity=".8">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2.6s" repeatCount="indefinite"/>
      </line>

      <!-- Labels -->
      <text x="446" y="78" text-anchor="middle" fill="#2dd4bf" font-size="7.5" font-family="JetBrains Mono,monospace">pooled</text>
      <text x="446" y="109" text-anchor="middle" fill="#fbbf24" font-size="7.5" font-family="JetBrains Mono,monospace">fetch+stream</text>
      <text x="446" y="151" text-anchor="middle" fill="#4ade80" font-size="7.5" font-family="JetBrains Mono,monospace">JWKS verify</text>

      <!-- Pulse dot on backend -->
      <circle cx="305" cy="110" r="3.5" fill="#a78bfa">
        <animate attributeName="opacity" values="1;0.25;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     SSE LIVE DEMO
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// live demo</div>
  <div class="section-title">SSE Completion Stream</div>
  <div class="sse-demo">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;font-size:11px;color:var(--arc-muted)">
      <span class="live-dot"></span>
      POST /completion &nbsp;→&nbsp; streaming response
    </div>
    <div class="sse-stream" id="sse-stream">
      <div class="sse-event">event: chunk</div>
      <div id="chunks"></div>
      <div class="sse-event" id="sse-done" style="opacity:0;transition:opacity .5s">event: done &nbsp;·&nbsp; tokens: 24 &nbsp;·&nbsp; saved ✓</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     HOW IT WORKS — AUTH
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// auth flow</div>
  <div class="section-title">How It Works</div>

  <p style="font-size:12px;color:var(--arc-muted);margin-bottom:1.5rem;line-height:1.7">Two modes — local JWT for quick prototyping, Neon Auth for production OAuth.</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:2rem">
    <div style="background:var(--arc-surface);border:1px solid var(--arc-border);border-radius:8px;padding:1.25rem">
      <div style="font-size:11px;font-weight:600;color:var(--arc-accent);margin-bottom:.75rem;letter-spacing:.5px">LOCAL JWT MODE</div>
      <div class="flow-steps" style="gap:0">
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px">01</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">POST /auth/login</div><div class="step-desc">username + password (bcrypt)</div></div>
        </div>
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px">02</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">HS256 token issued</div><div class="step-desc">Signed with JWT_SECRET</div></div>
        </div>
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px">03</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">Bearer on every request</div><div class="step-desc">Middleware validates + extracts user_id</div></div>
        </div>
      </div>
    </div>
    <div style="background:var(--arc-surface);border:1px solid rgba(74,222,128,.3);border-radius:8px;padding:1.25rem">
      <div style="font-size:11px;font-weight:600;color:var(--arc-green);margin-bottom:.75rem;letter-spacing:.5px">NEON AUTH MODE</div>
      <div class="flow-steps" style="gap:0">
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px;background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.4);color:var(--arc-green)">01</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">Sign in via Neon Auth widget</div><div class="step-desc">email / OAuth providers</div></div>
        </div>
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px;background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.4);color:var(--arc-green)">02</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">RS256 token returned</div><div class="step-desc">Signed by Neon Auth service</div></div>
        </div>
        <div class="flow-step" style="padding:.6rem 0">
          <div class="step-num" style="width:28px;height:28px;font-size:10px;background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.4);color:var(--arc-green)">03</div>
          <div class="step-body" style="padding-top:2px"><div class="step-title" style="font-size:12px">JWKS validation</div><div class="step-desc">Backend fetches public keys, verifies signature</div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="section-label" style="margin-top:2rem">// completion lifecycle</div>
  <div style="font-family:var(--font-head);font-size:18px;font-weight:600;margin:.5rem 0 1.25rem;color:var(--arc-text)">Streaming a Completion</div>
  <div class="flow-steps">
    <div class="flow-step">
      <div class="step-num">01</div>
      <div class="step-body"><div class="step-title">Client sends POST /completion</div><div class="step-desc">Payload: <code>{ chatId, messages, provider, model, apiKey }</code></div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">02</div>
      <div class="step-body"><div class="step-title">JWT validated, rate limit checked</div><div class="step-desc">Middleware verifies per-user daily quota against <code>rate_limit_log</code> before proceeding.</div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">03</div>
      <div class="step-body"><div class="step-title">Chat history retrieved from DB</div><div class="step-desc">Previous messages fetched from Neon and prepended to context.</div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">04</div>
      <div class="step-body"><div class="step-title">Provider adapter streams tokens</div><div class="step-desc">API key used in-memory only. Each chunk emitted as <code>event: chunk</code> SSE to the frontend.</div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">05</div>
      <div class="step-body"><div class="step-title">Message pair persisted</div><div class="step-desc">Full response saved to Neon after stream ends. <code>event: done</code> sent with token count.</div></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     API REFERENCE
═══════════════════════════════════════════ -->
<div class="section scroll-reveal" id="api">
  <div class="section-label">// endpoints</div>
  <div class="section-title">API Reference</div>
  <p style="font-size:12px;color:var(--arc-muted);margin-bottom:1.25rem">All protected endpoints require <code>Authorization: Bearer &lt;token&gt;</code>.</p>

  <div style="font-size:11px;color:var(--arc-muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.5rem">Authentication</div>
  <div class="api-wrap" style="margin-bottom:1.5rem">
    <table class="api-table">
      <thead><tr><th style="width:80px">Method</th><th>Endpoint</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><span class="method post">POST</span></td><td class="route">/auth/register</td><td class="note">{ username, password } → { token }</td></tr>
        <tr><td><span class="method post">POST</span></td><td class="route">/auth/login</td><td class="note">{ username, password } → { token }</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="route">/auth/me</td><td class="note">Bearer header only → { user }</td></tr>
      </tbody>
    </table>
  </div>

  <div style="font-size:11px;color:var(--arc-muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.5rem">Chat Management</div>
  <div class="api-wrap" style="margin-bottom:1.5rem">
    <table class="api-table">
      <thead><tr><th style="width:80px">Method</th><th>Endpoint</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><span class="method get">GET</span></td><td class="route">/chats</td><td class="note">Returns list with message counts</td></tr>
        <tr><td><span class="method post">POST</span></td><td class="route">/chats</td><td class="note">{ provider, model, title? } → { id, title }</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="route">/chats/:id</td><td class="note">Full chat + messages array</td></tr>
        <tr><td><span class="method patch">PATCH</span></td><td class="route">/chats/:id</td><td class="note">{ title } — rename</td></tr>
        <tr><td><span class="method del">DELETE</span></td><td class="route">/chats/:id</td><td class="note">Cascades to messages</td></tr>
      </tbody>
    </table>
  </div>

  <div style="font-size:11px;color:var(--arc-muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.5rem">Streaming &amp; Public</div>
  <div class="api-wrap">
    <table class="api-table">
      <thead><tr><th style="width:80px">Method</th><th>Endpoint</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><span class="method post">POST</span></td><td class="route">/completion</td><td class="note">SSE stream · { chatId, messages, provider, model, apiKey }</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="route">/health</td><td class="note">{ ok: true } — public</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="route">/models</td><td class="note">Available model catalogue — public</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     QUICK START
═══════════════════════════════════════════ -->
<div class="section scroll-reveal" id="quickstart">
  <div class="section-label">// local dev</div>
  <div class="section-title">Quick Start</div>
  <div class="terminal">
    <div class="terminal-bar"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>

    <div><span class="t-comment"># 1 · clone & install</span></div>
    <div><span class="t-prompt">$ </span><span class="t-cmd">git clone https://github.com/rozengoza/chat-interface-backend.git</span></div>
    <div><span class="t-prompt">$ </span><span class="t-cmd">cd chat-interface-backend</span></div>
    <div><span class="t-prompt">$ </span><span class="t-cmd">npm install</span></div>
    <br>
    <div><span class="t-comment"># 2 · configure environment</span></div>
    <div><span class="t-prompt">$ </span><span class="t-cmd">cp .env.example .env</span></div>
    <br>
    <div style="font-size:11px;padding-left:12px">
      <div><span class="t-comment"># Required</span></div>
      <div><span class="t-key">DATABASE_URL</span>=<span class="t-val">postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require</span></div>
      <br>
      <div><span class="t-comment"># Local auth (default)</span></div>
      <div><span class="t-key">USE_NEON_AUTH</span>=<span class="t-val">false</span></div>
      <div><span class="t-key">JWT_SECRET</span>=<span class="t-val">your-super-secret</span></div>
      <br>
      <div><span class="t-comment"># Optional</span></div>
      <div><span class="t-key">ALLOWED_ORIGINS</span>=<span class="t-val">http://localhost:5173,https://your-frontend.vercel.app</span></div>
      <div><span class="t-key">PORT</span>=<span class="t-val">5000</span></div>
    </div>
    <br>
    <div><span class="t-comment"># 3 · run schema in Neon SQL Editor → paste sql/schema.sql</span></div>
    <br>
    <div><span class="t-comment"># 4 · start the dev server</span></div>
    <div><span class="t-prompt">$ </span><span class="t-cmd">npm run dev</span></div>
    <div><span class="t-out">  ✓  Server running on http://localhost:5000</span></div>
    <div><span class="t-out">  ✓  GET /health  →  {"ok":true}</span></div>
    <div><span class="t-out">  ✓  GET /models  →  [...]  </span><span class="t-cursor"></span></div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     DEPLOY
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// deploy</div>
  <div class="section-title">Zero-Cost Platforms</div>
  <div class="deploy-grid">
    <a class="deploy-card fly" href="https://fly.io" target="_blank">
      <div style="font-size:30px">🚀</div>
      <div class="deploy-name" style="color:var(--arc-purple)">Fly.io</div>
      <div class="deploy-note">fly.toml included · global edge · low latency</div>
    </a>
    <a class="deploy-card render" href="https://render.com" target="_blank">
      <div style="font-size:30px">⚡</div>
      <div class="deploy-name" style="color:var(--arc-teal)">Render</div>
      <div class="deploy-note">render.yaml included · auto-deploy on push</div>
    </a>
    <a class="deploy-card railway" href="https://railway.app" target="_blank">
      <div style="font-size:30px">🛤️</div>
      <div class="deploy-name" style="color:var(--arc-green)">Railway</div>
      <div class="deploy-note">railway.toml included · one-click deploy</div>
    </a>
  </div>
  <div class="stat-row">
    <div class="stat"><span class="stat-num">0¢</span><div class="stat-label">hosting cost</div></div>
    <div class="stat"><span class="stat-num">5</span><div class="stat-label">min to deploy</div></div>
    <div class="stat"><span class="stat-num">3</span><div class="stat-label">deploy targets</div></div>
    <div class="stat"><span class="stat-num">∞</span><div class="stat-label">chat history</div></div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     FAQ
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// faq</div>
  <div class="section-title">Frequently Asked Questions</div>
  <div class="faq">
    <details>
      <summary>When should I use Neon Auth vs. local JWT?</summary>
      <div class="faq-body"><p>Local JWT is perfect for quick prototyping and when you don't need social login. Neon Auth gives you passwordless/OAuth flows, a hosted sign-in widget, and stronger RS256 tokens — ideal for production apps that want a polished auth UX without extra code.</p></div>
    </details>
    <details>
      <summary>Can I add more AI providers?</summary>
      <div class="faq-body"><p>Absolutely. The adapter pattern in <code>src/adapters/index.js</code> makes it straightforward. Implement a function that accepts the same arguments and returns a stream or response object, then register it in the catalogue. No route changes needed.</p></div>
    </details>
    <details>
      <summary>Do I still need an Anthropic API key?</summary>
      <div class="faq-body"><p>Yes. ARC Backend proxies your key to the provider. The frontend sends the key with each completion request. You can configure a default key server-side, but this isn't recommended for multi-user deployments.</p></div>
    </details>
    <details>
      <summary>Why SSE instead of WebSockets?</summary>
      <div class="faq-body"><p>SSE is simpler, works over HTTP/1.1 and HTTP/2, and is perfect for one-way streaming of tokens. For a chat completion you only need server-to-client streaming — WebSockets add bidirectional complexity that isn't necessary here.</p></div>
    </details>
    <details>
      <summary>Is my API key ever stored?</summary>
      <div class="faq-body"><p>No. API keys are passed in the request body and held in memory only for the duration of that request. They are never written to the database, logged to disk, or persisted in any form.</p></div>
    </details>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     CONTRIBUTING
═══════════════════════════════════════════ -->
<div class="section scroll-reveal">
  <div class="section-label">// contributing</div>
  <div class="section-title">Contributing</div>
  <div class="flow-steps">
    <div class="flow-step">
      <div class="step-num">1</div>
      <div class="step-body"><div class="step-title">Fork the repository</div><div class="step-desc">Fork on GitHub and clone your fork locally.</div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">2</div>
      <div class="step-body"><div class="step-title">Create a feature branch</div><div class="step-desc"><code>git checkout -b feature/my-feature</code></div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">3</div>
      <div class="step-body"><div class="step-title">Make your changes</div><div class="step-desc">Test with <code>npm run dev</code>. Run migrations if you add new tables: <code>node src/db/migrate.js</code>.</div></div>
    </div>
    <div class="flow-step">
      <div class="step-num">4</div>
      <div class="step-body"><div class="step-title">Submit a pull request</div><div class="step-desc">Open a PR with a clear description. Check the open issues for ways to help.</div></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     FOOTER
═══════════════════════════════════════════ -->
<div class="footer scroll-reveal">
  <div>
    By <a href="https://github.com/rozengoza">rozengoza</a>
    <span class="footer-divider"> · </span>
    <a href="https://github.com/rozengoza/chat-interface-backend/blob/main/LICENSE">MIT License</a>
    <span class="footer-divider"> · </span>
    Deployed on <a href="https://railway.app">Railway</a>
  </div>
  <div style="margin-top:.5rem;color:#3d4a5e">ARC Backend · Stream · Persist · Own your data</div>
</div>

<script>
/* ── SSE token stream simulation ── */
const chunks = [
  'The ','quick ','brown ','fox ','streams ',
  'token ','by ','token—\n','real-time, ','no ',
  'polling, ','just ','pure ','SSE ','magic ✓'
];
const el = document.getElementById('chunks');
const done = document.getElementById('sse-done');
let i = 0;
function addChunk(){
  if(i >= chunks.length){ done.style.opacity='1'; return; }
  const span = document.createElement('span');
  span.className = 'sse-chunk';
  span.textContent = 'data: {"text":"' + chunks[i] + '"}\n';
  el.appendChild(span);
  requestAnimationFrame(()=> span.classList.add('visible'));
  i++;
  setTimeout(addChunk, 250 + Math.random()*180);
}
setTimeout(addChunk, 900);

/* ── Scroll reveal ── */
const reveals = document.querySelectorAll('.scroll-reveal');
const obs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }});
},{threshold:.1});
reveals.forEach(r=> obs.observe(r));
</script>

</body>
</html>
