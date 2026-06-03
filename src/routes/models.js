import { Router } from 'express';
import { db } from '../db/index.js';

export const modelsRouter = Router();

// GET /models — return all active models grouped by provider
// Public endpoint — no auth required (client needs this before login)
modelsRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         m.id, m.model_id, m.display_name, m.context_k,
         m.is_free, m.sort_order,
         p.slug      AS provider_slug,
         p.display_name AS provider_name,
         p.api_style
       FROM models m
       JOIN providers p ON p.slug = m.provider_slug
       WHERE m.is_active = TRUE AND p.is_active = TRUE
       ORDER BY p.slug, m.sort_order`
    );

    // Group by provider for easy consumption in the frontend
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.provider_slug]) {
        acc[row.provider_slug] = {
          slug: row.provider_slug,
          name: row.provider_name,
          api_style: row.api_style,
          models: [],
        };
      }
      acc[row.provider_slug].models.push({
        id: row.id,
        model_id: row.model_id,
        display_name: row.display_name,
        context_k: row.context_k,
        is_free: row.is_free,
      });
      return acc;
    }, {});

    res.json({ providers: Object.values(grouped) });
  } catch (err) {
    console.error('[models:list]', err);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});
