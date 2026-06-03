import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { ADAPTERS, resolveApiKey } from '../adapters/index.js';

export const completionRouter = Router();
completionRouter.use(requireAuth);

const FREE_DAILY_TOKEN_LIMIT = parseInt(process.env.FREE_TIER_DAILY_TOKEN_LIMIT ?? '50000', 10);

/**
 * Trim the messages array so it fits within a model's context window.
 * Keeps the system message (if any) and the most recent turns.
 * Uses a rough estimate of 1 token ≈ 4 characters; reserves 20 % headroom.
 */
function trimToContext(messages, contextK) {
  if (!contextK) return messages;
  const maxChars = contextK * 1000 * 4 * 0.8;
  const total = messages.reduce((s, m) => s + m.content.length, 0);
  if (total <= maxChars) return messages;

  const system = messages.filter(m => m.role === 'system');
  let conversation = messages.filter(m => m.role !== 'system');

  // Drop oldest turns until it fits, but always keep the last user message
  while (conversation.length > 1) {
    const chars = [...system, ...conversation].reduce((s, m) => s + m.content.length, 0);
    if (chars <= maxChars) break;
    conversation.shift();
  }

  return [...system, ...conversation];
}

// POST /completion
// Body: { chatId, messages, provider, model, apiKey? }
// Streams SSE back to the client.
completionRouter.post('/', async (req, res) => {
  const { chatId, messages, provider, model, apiKey: clientKey } = req.body ?? {};

  if (!chatId || !messages || !provider || !model) {
    return res.status(400).json({ error: 'chatId, messages, provider, and model are required' });
  }

  // Verify the chat belongs to this user (also grab system_prompt and context_k)
  const { rows: chatRows } = await db.query(
    `SELECT c.id, c.is_free_tier, c.system_prompt,
            m.context_k
     FROM chats c
     LEFT JOIN models m ON m.provider_slug = c.provider AND m.model_id = c.model
     WHERE c.id = $1 AND c.user_id = $2`,
    [chatId, req.user.id]
  );
  if (!chatRows[0]) return res.status(404).json({ error: 'Chat not found' });

  const { is_free_tier: isFree, system_prompt: chatSystemPrompt, context_k: contextK } = chatRows[0];

  // Rate-limit check for free-tier models
  if (isFree) {
    const { rows } = await db.query(
      `SELECT tokens FROM rate_limit_log
       WHERE user_id = $1 AND model = $2 AND day = CURRENT_DATE`,
      [req.user.id, model]
    );
    const used = rows[0]?.tokens ?? 0;
    if (used >= FREE_DAILY_TOKEN_LIMIT) {
      return res.status(429).json({
        error: `Daily free-tier limit reached (${FREE_DAILY_TOKEN_LIMIT.toLocaleString()} tokens). Add your own API key to continue.`,
      });
    }
  }

  const adapter = ADAPTERS[provider];
  if (!adapter) return res.status(400).json({ error: `Unknown provider: ${provider}` });

  const apiKey = resolveApiKey(provider, clientKey);
  if (!apiKey) {
    if (isFree) {
      return res.status(500).json({ error: 'Free tier is not configured on this server' });
    }
    return res.status(400).json({ error: 'No API key provided for this provider' });
  }

  // --- Set up SSE ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Abort upstream fetch if the client disconnects mid-stream
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let fullContent = '';
  let estimatedTokens = 0;

  try {
    // Save the user's message first
    const userMsg = messages[messages.length - 1];
    await db.query(
      `INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)`,
      [chatId, userMsg.role, userMsg.content]
    );

    // Inject chat system_prompt if no system message was provided by the client
    let finalMessages = [...messages];
    if (chatSystemPrompt && !finalMessages.some(m => m.role === 'system')) {
      finalMessages = [{ role: 'system', content: chatSystemPrompt }, ...finalMessages];
    }

    // Trim history to fit the model's context window
    finalMessages = trimToContext(finalMessages, contextK);

    // Call the provider
    const { url, options } = adapter.buildRequest(finalMessages, model, apiKey);
    const upstream = await fetch(url, { ...options, signal: abortController.signal });

    if (!upstream.ok) {
      const errText = await upstream.text();
      sendEvent('error', { message: `Provider error: ${upstream.status} — ${errText.slice(0, 200)}` });
      return res.end();
    }

    // Stream chunks to client
    for await (const chunk of adapter.parseStream(upstream)) {
      fullContent += chunk;
      estimatedTokens += Math.ceil(chunk.length / 4); // rough estimate
      sendEvent('chunk', { text: chunk });
    }

    // Save the completed assistant message
    const { rows: msgRows } = await db.query(
      `INSERT INTO messages (chat_id, role, content, output_tokens)
       VALUES ($1, 'assistant', $2, $3)
       RETURNING id`,
      [chatId, fullContent, estimatedTokens]
    );

    // Update chat updated_at and title if it's the first exchange
    await db.query(`UPDATE chats SET updated_at = NOW() WHERE id = $1`, [chatId]);

    // Auto-title: if this is the first user message, use its first 60 chars
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM messages WHERE chat_id = $1`,
      [chatId]
    );
    if (countRows[0].cnt <= 2) {
      const autoTitle = userMsg.content.slice(0, 60).replace(/\n/g, ' ');
      await db.query(`UPDATE chats SET title = $1 WHERE id = $2`, [autoTitle, chatId]);
    }

    // Update rate limit log for free tier
    if (isFree) {
      await db.query(
        `INSERT INTO rate_limit_log (user_id, provider, model, tokens, day)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)
         ON CONFLICT (user_id, model, day)
         DO UPDATE SET tokens = rate_limit_log.tokens + EXCLUDED.tokens`,
        [req.user.id, provider, model, estimatedTokens]
      );
    }

    sendEvent('done', { messageId: msgRows[0].id, tokens: estimatedTokens });
  } catch (err) {
    if (err.name === 'AbortError') {
      // Client disconnected — nothing to do, just end cleanly
      return res.end();
    }
    console.error('[completion]', err);
    sendEvent('error', { message: 'Streaming failed — please try again' });
  } finally {
    res.end();
  }
});
