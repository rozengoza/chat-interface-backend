import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for @neondatabase/serverless in Node.js (not needed in edge runtimes)
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL — the serverless driver handles this automatically
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

export const db = {
  async query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[db] ${Date.now() - start}ms — ${text.slice(0, 80)}`);
    }
    return res;
  },

  async getClient() {
    return pool.connect();
  },

  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
