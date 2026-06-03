-- =============================================================
-- ARC — Complete Database Schema (Fresh Install)
-- Run this after dropping the public schema
-- PostgreSQL (Neon / Supabase)
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- CHATS
-- =============================================================
CREATE TABLE chats (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL DEFAULT 'New chat',
  provider      TEXT        NOT NULL,
  model         TEXT        NOT NULL,
  is_free_tier  BOOLEAN     NOT NULL DEFAULT FALSE,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

-- =============================================================
-- MESSAGES
-- =============================================================
CREATE TABLE messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       UUID        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT        NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- =============================================================
-- USER PROVIDERS
-- =============================================================
CREATE TABLE user_providers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider   TEXT        NOT NULL,
  label      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);

-- =============================================================
-- RATE LIMITS
-- =============================================================
CREATE TABLE rate_limit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider   TEXT        NOT NULL,
  model      TEXT        NOT NULL,
  tokens     INTEGER     NOT NULL DEFAULT 0,
  day        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, model, day)
);

CREATE INDEX idx_rate_limit_user_day ON rate_limit_log(user_id, day);

-- =============================================================
-- TRIGGERS
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- PROVIDERS
-- =============================================================
CREATE TABLE providers (
  slug         TEXT    PRIMARY KEY,
  display_name TEXT    NOT NULL,
  base_url     TEXT    NOT NULL,
  api_style    TEXT    NOT NULL CHECK (api_style IN ('openai', 'anthropic', 'google')),
  is_free      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO providers (slug, display_name, base_url, api_style, is_free) VALUES
  ('anthropic',   'Anthropic',   'https://api.anthropic.com',                 'anthropic', FALSE),
  ('openai',      'OpenAI',      'https://api.openai.com/v1',                 'openai',    FALSE),
  ('google',      'Google',      'https://generativelanguage.googleapis.com', 'google',    FALSE),
  ('deepseek',    'DeepSeek',    'https://api.deepseek.com/v1',               'openai',    FALSE),
  ('mistral',     'Mistral',     'https://api.mistral.ai/v1',                 'openai',    FALSE),
  ('groq',        'Groq',        'https://api.groq.com/openai/v1',            'openai',    FALSE),
  ('xai',         'xAI',         'https://api.x.ai/v1',                       'openai',    FALSE),
  ('openrouter',  'OpenRouter',  'https://openrouter.ai/api/v1',              'openai',    FALSE),
  ('ollama',      'Ollama',      'http://localhost:11434/v1',                 'openai',    FALSE),
  ('gemini-free', 'Gemini Free', 'https://generativelanguage.googleapis.com', 'google',    TRUE);

-- =============================================================
-- MODELS
-- =============================================================
CREATE TABLE models (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug TEXT    NOT NULL REFERENCES providers(slug),
  model_id      TEXT    NOT NULL,
  display_name  TEXT    NOT NULL,
  context_k     INTEGER,
  is_free       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (provider_slug, model_id)
);

INSERT INTO models (provider_slug, model_id, display_name, context_k, is_free, sort_order) VALUES
  -- Anthropic
  ('anthropic',   'claude-sonnet-4-6',                        'Claude Sonnet 4.6',             200,  FALSE, 10),
  ('anthropic',   'claude-haiku-4-5-20251001',                'Claude Haiku 4.5',              200,  FALSE, 20),
  
  -- OpenAI
  ('openai',      'gpt-4o',                                   'GPT-4o',                        128,  FALSE, 10),
  ('openai',      'gpt-4o-mini',                              'GPT-4o mini',                   128,  FALSE, 20),
  
  -- Google (user-keyed)
  ('google',      'gemini-2.0-flash',                         'Gemini 2.0 Flash',              1000, FALSE, 10),
  ('google',      'gemini-2.5-pro',                           'Gemini 2.5 Pro',                1000, FALSE, 20),
  
  -- DeepSeek
  ('deepseek',    'deepseek-chat',                            'DeepSeek V3',                   64,   FALSE, 10),
  ('deepseek',    'deepseek-reasoner',                        'DeepSeek R1',                   64,   FALSE, 20),
  
  -- Mistral
  ('mistral',     'mistral-large-latest',                     'Mistral Large',                 32,   FALSE, 10),
  ('mistral',     'mistral-small-latest',                     'Mistral Small',                 32,   FALSE, 20),
  
  -- Groq
  ('groq',        'llama-3.3-70b-versatile',                  'Llama 3.3 70B',                 128,  FALSE, 10),
  ('groq',        'gemma2-9b-it',                             'Gemma 2 9B',                    8,    FALSE, 20),
  
  -- xAI
  ('xai',         'grok-3',                                   'Grok 3',                        131,  FALSE, 10),
  ('xai',         'grok-3-mini',                              'Grok 3 Mini',                   131,  FALSE, 20),
  
  -- OpenRouter
  ('openrouter',  'anthropic/claude-3.5-sonnet',              'Claude 3.5 Sonnet (OR)',        200,  FALSE, 10),
  ('openrouter',  'google/gemini-2.0-flash',                  'Gemini 2.0 Flash (OR)',         1000, FALSE, 20),
  ('openrouter',  'meta-llama/llama-3.3-70b-instruct',        'Llama 3.3 70B (OR)',            128,  FALSE, 30),
  
  -- Ollama (local)
  ('ollama',      'llama3.2',                                 'Llama 3.2 (local)',             128,  FALSE, 10),
  ('ollama',      'qwen2.5-coder:7b',                         'Qwen2.5 Coder 7B (local)',      32,   FALSE, 20),
  ('ollama',      'mistral',                                  'Mistral 7B (local)',            32,   FALSE, 30),
  
  -- Gemini Free Tier (backend key)
  ('gemini-free', 'gemini-2.0-flash',                         'Gemini 2.0 Flash ✦',            1000, TRUE,  10);

-- ✦ = Backend-managed API key, rate-limited per user

-- =============================================================
-- Verification Query
-- =============================================================
-- Run this to verify everything is set up correctly:
-- SELECT p.slug, p.display_name, p.is_free as provider_free,
--        m.model_id, m.display_name as model_name, m.is_free as model_free
-- FROM providers p
-- LEFT JOIN models m ON m.provider_slug = p.slug
-- WHERE p.is_active = TRUE AND (m.is_active = TRUE OR m.is_active IS NULL)
-- ORDER BY p.slug, m.sort_order;
