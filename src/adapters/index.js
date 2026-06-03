/**
 * Provider Adapter Layer
 *
 * Every provider adapter exports two functions:
 *   buildRequest(messages, model, apiKey)  → fetch-compatible { url, options }
 *   parseStream(response)                  → async generator yielding text chunks
 *
 * All adapters accept the same internal message format:
 *   [{ role: 'user' | 'assistant' | 'system', content: string }]
 */

// =============================================================
// OpenAI-compatible adapter (OpenAI, DeepSeek, Mistral, Groq)
// =============================================================
export function makeOpenAIAdapter(baseUrl) {
  return {
    buildRequest(messages, model, apiKey) {
      return {
        url: `${baseUrl}/chat/completions`,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, stream: true }),
        },
      };
    },

    async *parseStream(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const chunk = json.choices?.[0]?.delta?.content;
            if (chunk) yield chunk;
          } catch { /* skip malformed chunks */ }
        }
      }
    },
  };
}

// =============================================================
// Anthropic adapter
// =============================================================
export const anthropicAdapter = {
  buildRequest(messages, model, apiKey) {
    // Anthropic separates system messages from the messages array
    const system = messages.find(m => m.role === 'system')?.content;
    const filtered = messages.filter(m => m.role !== 'system');

    return {
      url: 'https://api.anthropic.com/v1/messages',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 8096,
          stream: true,
          ...(system ? { system } : {}),
          messages: filtered,
        }),
      },
    };
  },

  async *parseStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            yield json.delta.text;
          }
        } catch { /* skip */ }
      }
    }
  },
};

// =============================================================
// Google Gemini adapter
// =============================================================
export const googleAdapter = {
  buildRequest(messages, model, apiKey) {
    // Convert to Gemini's contents format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const system = messages.find(m => m.role === 'system')?.content;

    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: { maxOutputTokens: 8192 },
        }),
      },
    };
  },

  async *parseStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch { /* skip */ }
      }
    }
  },
};

// =============================================================
// OpenRouter adapter
// OpenAI-compatible but requires extra site-identification headers
// =============================================================
export function makeOpenRouterAdapter() {
  return {
    buildRequest(messages, model, apiKey) {
      return {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://localhost',
            'X-Title': process.env.OPENROUTER_SITE_NAME ?? 'ARC',
          },
          body: JSON.stringify({ model, messages, stream: true }),
        },
      };
    },

    async *parseStream(response) {
      yield* makeOpenAIAdapter('').parseStream(response);
    },
  };
}

// =============================================================
// Provider registry — maps provider slug → adapter + base URL
// =============================================================
export const ADAPTERS = {
  anthropic:    anthropicAdapter,
  openai:       makeOpenAIAdapter('https://api.openai.com/v1'),
  google:       googleAdapter,
  'gemini-free': googleAdapter,
  deepseek:     makeOpenAIAdapter('https://api.deepseek.com/v1'),
  mistral:      makeOpenAIAdapter('https://api.mistral.ai/v1'),
  groq:         makeOpenAIAdapter('https://api.groq.com/openai/v1'),
  xai:          makeOpenAIAdapter('https://api.x.ai/v1'),
  openrouter:   makeOpenRouterAdapter(),
  ollama:       makeOpenAIAdapter(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1'),
};

/**
 * Resolve the API key for a request.
 * - Free-tier providers: use backend env key
 * - Premium providers: use the key passed in from the client (never stored)
 */
export function resolveApiKey(provider, clientKey) {
  const FREE_KEYS = {
    'gemini-free': process.env.GEMINI_FREE_API_KEY,
    // Backend-held keys for optional server-side proxying
    xai:           process.env.XAI_API_KEY,
    openrouter:    process.env.OPENROUTER_API_KEY,
    // Ollama is local — no key needed; pass a dummy so the check passes
    ollama:        'ollama',
  };
  return FREE_KEYS[provider] ?? clientKey;
}