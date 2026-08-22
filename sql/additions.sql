-- =============================================================
-- Additions — incremental changes for existing deployments
-- Run with: npm run db:migrate -- --additions
-- =============================================================

-- Add Gemini 2.5 Flash to the free tier (backend-keyed) catalogue
INSERT INTO models (provider_slug, model_id, display_name, context_k, is_free, sort_order)
VALUES ('gemini-free', 'gemini-2.5-flash', 'Gemini 2.5 Flash ✦', 1000, TRUE, 20)
ON CONFLICT (provider_slug, model_id) DO NOTHING;
