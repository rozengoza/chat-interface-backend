import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const USE_NEON_AUTH = process.env.USE_NEON_AUTH === 'true';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (USE_NEON_AUTH) {
    return res.status(400).json({ error: 'Server is configured for Neon Auth; do not use /auth/register' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'username must be 3–32 characters' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [username.toLowerCase(), hash]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: { id: user.id, username: user.username } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (USE_NEON_AUTH) {
    return res.status(400).json({ error: 'Server is configured for Neon Auth; do not use /auth/login' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, username, password_hash FROM users WHERE username = $1`,
      [username.toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: signToken(user), user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me — verify token and return current user
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /auth/usage — free-tier token consumption for the current user
authRouter.get('/usage', requireAuth, async (req, res) => {
  const dailyLimit = parseInt(process.env.FREE_TIER_DAILY_TOKEN_LIMIT ?? '50000', 10);
  try {
    const { rows } = await db.query(
      `SELECT provider, model, tokens
       FROM rate_limit_log
       WHERE user_id = $1 AND day = CURRENT_DATE`,
      [req.user.id]
    );
    const today_tokens = rows.reduce((sum, r) => sum + r.tokens, 0);
    res.json({
      today_tokens,
      daily_limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - today_tokens),
      by_model: rows,
    });
  } catch (err) {
    console.error('[usage]', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});