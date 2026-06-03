import { Router } from 'express';
import { db } from '../db/index.js';
import { encrypt, decrypt } from '../lib/encryption.js';
import { requireAuth } from '../middleware/auth.js';

export const chatsRouter = Router();
chatsRouter.use(requireAuth);

// GET /chats — list all chats for the current user
chatsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.title, c.provider, c.model, c.is_free_tier,
              c.created_at, c.updated_at,
              COUNT(m.id)::int AS message_count,
              MAX(m.created_at) AS last_message_at
       FROM chats c
       LEFT JOIN messages m ON m.chat_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json({ chats: rows });
  } catch (err) {
    console.error('[chats:list]', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// POST /chats — create a new chat
// POST /chats — create a new chat (optionally with initial messages)
chatsRouter.post('/', async (req, res) => {
  const { title, provider, model, system_prompt, messages } = req.body ?? {};
  if (!provider || !model) return res.status(400).json({ error: 'provider and model are required' });

  // Use a dedicated client so we can transactionally insert chat + messages
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // validate model and determine is_free_tier
    const { rows: modelRows } = await client.query(
      `SELECT is_free FROM models WHERE provider_slug = $1 AND model_id = $2 AND is_active = TRUE`,
      [provider, model]
    );
    if (!modelRows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or inactive provider/model' });
    }
    const is_free_tier = modelRows[0].is_free;

    // create chat
    const { rows: chatRows } = await client.query(
      `INSERT INTO chats (user_id, title, provider, model, is_free_tier, system_prompt)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, title ?? 'New chat', provider, model, is_free_tier, system_prompt ?? null]
    );
    const chat = chatRows[0];

    // insert messages if provided
    const inserted = [];
    if (Array.isArray(messages) && messages.length > 0) {
      const insertMsgSql = `INSERT INTO messages (chat_id, role, content, created_at)
                             VALUES ($1,$2,$3,$4) RETURNING id, role, content, input_tokens, output_tokens, created_at`;
      for (const m of messages) {
        const role = m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user');
        const content = typeof m.content === 'string' ? m.content : '';
        const createdAt = m.created_at ? new Date(m.created_at) : new Date();
        const mr = await client.query(insertMsgSql, [chat.id, role, encrypt(content), createdAt.toISOString()]);
        inserted.push(mr.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ chat, messages: inserted });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[chats:create-with-messages]', err);
    res.status(500).json({ error: 'Failed to create chat' });
  } finally {
    client.release();
  }
});

// GET /chats/:id — get a chat with its full message history
chatsRouter.get('/:id', async (req, res) => {
  try {
    const { rows: chatRows } = await db.query(
      `SELECT * FROM chats WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!chatRows[0]) return res.status(404).json({ error: 'Chat not found' });

    const { rows: messages } = await db.query(
      `SELECT id, role, content, input_tokens, output_tokens, created_at
       FROM messages
       WHERE chat_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    // Decrypt message contents before returning
    const decMessages = messages.map(m => ({
      ...m,
      content: decrypt(m.content),
    }));

    res.json({ chat: chatRows[0], messages: decMessages });
  } catch (err) {
    console.error('[chats:get]', err);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// PATCH /chats/:id — update title and/or system_prompt
chatsRouter.patch('/:id', async (req, res) => {
  const { title, system_prompt } = req.body ?? {};
  if (title === undefined && system_prompt === undefined) {
    return res.status(400).json({ error: 'At least one of title or system_prompt is required' });
  }

  try {
    // Build update dynamically to only touch provided fields
    const sets = [];
    const params = [];
    if (title !== undefined)         { params.push(title);         sets.push(`title = $${params.length}`); }
    if (system_prompt !== undefined) { params.push(system_prompt); sets.push(`system_prompt = $${params.length}`); }
    params.push(req.params.id, req.user.id);

    const { rows } = await db.query(
      `UPDATE chats SET ${sets.join(', ')}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Chat not found' });
    res.json({ chat: rows[0] });
  } catch (err) {
    console.error('[chats:update]', err);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// DELETE /chats/:id
chatsRouter.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM chats WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Chat not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[chats:delete]', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// DELETE /chats/:id/messages/:msgId — delete a single message
chatsRouter.delete('/:id/messages/:msgId', async (req, res) => {
  try {
    // Verify the chat belongs to this user before touching its messages
    const { rows: chatRows } = await db.query(
      `SELECT id FROM chats WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!chatRows[0]) return res.status(404).json({ error: 'Chat not found' });

    const { rowCount } = await db.query(
      `DELETE FROM messages WHERE id = $1 AND chat_id = $2`,
      [req.params.msgId, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[chats:deleteMessage]', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
