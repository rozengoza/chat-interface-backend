import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { authRouter }       from './routes/auth.js';
import { chatsRouter }      from './routes/chats.js';
import { completionRouter } from './routes/completion.js';
import { modelsRouter }     from './routes/models.js';
import { db }               from './db/index.js';

const app  = express();
const PORT = process.env.PORT ?? 5001;

// --- CORS ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) in dev
    if (!origin || process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// --- Body parsing ---
app.use(express.json({ limit: '1mb' }));

// --- Global rate limiter (against brute force / scraping) ---
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down' },
}));

// --- Stricter limiter on auth endpoints ---
app.use('/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts — try again in 15 minutes' },
}));

// --- Routes ---
app.use('/auth',       authRouter);
app.use('/chats',      chatsRouter);
app.use('/completion', completionRouter);
app.use('/models',     modelsRouter);

// --- Ping (lightweight, no DB — for frontend keepalive to prevent Render spin-down) ---
app.get('/ping', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// --- Health check (used by Render / Railway for uptime monitoring) ---
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString(), db: 'connected' });
  } catch {
    res.status(503).json({ ok: false, ts: new Date().toISOString(), db: 'error' });
  }
});

// --- 404 catch-all ---
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ARC backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});