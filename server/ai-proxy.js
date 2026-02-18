// ai-proxy removed. File kept as placeholder to avoid startup errors.
// Original proxy removed when messaging app was deleted.
export {};
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import config from '../messaging-reproducible/config.json';

// Load environment variables from project-root .env.local if present
dotenv.config({ path: new URL('../.env.local', import.meta.url).pathname });

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = config.ai.apiEndpoint || 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY not set in environment. Proxy will fail until provided.');
}

app.post('/api/ai/correct', async (req, res) => {
  const { text, temperature = 0.7, maxTokens = 1024 } = req.body;

  if (!text) return res.status(400).json({ error: 'Missing `text` in request body' });
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });

  const prompt = `You are an English teacher. Find ALL grammar mistakes in this text. Return ONLY a JSON object with one property:\n\n\"corrections\": an array of objects, each with:\n   - \"original\": the exact wrong word/phrase from the text\n   - \"corrected\": the fixed version\n   - \"explanation\": why it's wrong (one sentence)\n\nFind as many errors as you can in the text.\n\nText to check:\n${text}\n\nReturn ONLY the JSON object, no markdown, no code blocks, no extra text.`;

  try {
    const resp = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await resp.json();

    // Pass through the API response
    return res.status(resp.ok ? 200 : 502).json(data);
  } catch (err) {
    console.error('AI proxy error', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`AI proxy listening on http://localhost:${port}`);
});

export default app;
