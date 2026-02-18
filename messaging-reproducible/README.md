# Messaging Reproducible Bundle

Self-contained package to recreate the messaging system with AI corrections. Includes API config, prompts, schema, and logic to set up anywhere.

## Contents

- **config.json** – API endpoint, model, auth, and defaults
- **prompt-template.json** – Exact prompt used for AI corrections (Groq + llama-3.3-70b-versatile)
- **message-schema.json** – JSON schema for all message fields (validation & reference)
- **tags-reference.json** – All available message tags (gameplay, moderation, pedagogy, etc.)
- **ai-service.js** – Core service: AI initialization, message building, backend sending
- **example-usage.js** – Full flow example: input → correction → backend submission
- **README.md** – This file

## Quick Start

### 1. Set Environment Variables

```bash
export GROQ_API_KEY="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"
export BACKEND_AUTH_TOKEN="your-service-token-here"
```

### 2. Update config.json

Edit `config.json` to set your backend endpoint:

```json
"messaging": {
  "backendEndpoint": "https://your-actual-backend.com/api/messages"
}
```

### 3. Run Example (Node.js)

```bash
node example-usage.js
```

Expected output:
```
Initializing AI service...
Requesting AI corrections for: Ths is teh best gam ever!
Original: Ths is teh best gam ever!
Corrected: This is the best game ever!
Changes applied: ["Missing the letter 'i'.", "Letters are transposed; should be 'the'.", "Missing the letter 'e' at the end."]
Message payload: { ... }
Sending message to backend...
✓ Message sent successfully: { message_id: "...", status: "queued", ... }
```

## API Reference

### `initializeAIService(config)`

Initializes the Groq AI service. Returns an object with `checkLetterWithAI()` method.

**Params:**
- `config.apiKey` (string) – Groq API key (or `process.env.GROQ_API_KEY`)
- `config.model` (string, optional) – Model name (default: `llama-3.3-70b-versatile`)
- `config.endpoint` (string, optional) – Groq endpoint URL

**Example:**
```javascript
const aiService = initializeAIService({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions'
});

const result = await aiService.checkLetterWithAI('Ths is teh test');
// Returns: { corrections: [{ original, corrected, explanation }, ...] }
```

### `buildMessagePayload(params)`

Builds a complete message object ready for backend submission.

**Params:**
- `senderId` (string, required)
- `gameId` (string, required)
- `sessionId` (string, required)
- `originalText` (string, required)
- `correctedText` (string, required)
- `tags` (array, optional)
- `audience` (string, optional) – 'child' | 'teacher' | 'mixed'
- `locale` (string, optional) – Language code
- `style` (string, optional) – Tone
- `aiModel` (string, optional)
- `aiMeta` (object, optional) – Confidence, applied changes
- `preserveTokens` (array, optional)
- `status` (string, optional) – 'queued' | 'sent' | 'flagged' | 'blocked'
- `senderRole` (string, optional) – 'player' | 'system' | 'ai' | 'teacher'
- `channel` (string, optional) – 'global' | 'team' | 'private'
- `recipientId` (string, optional)

**Example:**
```javascript
const payload = buildMessagePayload({
  senderId: 'player_123',
  gameId: 'word-runner',
  sessionId: 'sess_456',
  originalText: 'Ths is teh test',
  correctedText: 'This is the test',
  tags: ['chat', 'auto_corrected', 'grammar'],
  aiModel: 'llama-3.3-70b-versatile',
  aiMeta: {
    confidence: 0.92,
    applied_changes: ['spelling']
  }
});
```

### `sendMessageToBackend(messagePayload, backendUrl, authToken)`

Sends corrected message to backend API.

**Params:**
- `messagePayload` (object) – Message object from `buildMessagePayload()`
- `backendUrl` (string) – Backend endpoint URL
- `authToken` (string) – Bearer token for authentication

**Example:**
```javascript
const response = await sendMessageToBackend(
  payload,
  'https://your-game.example/api/messages',
  process.env.BACKEND_AUTH_TOKEN
);

console.log(response);
// { message_id: "msg_789", status: "queued", delivered_at: null, ... }
```

## Message Schema Reference

All messages follow this schema (see `message-schema.json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sender_id` | string | ✓ | Player/user identifier |
| `game_id` | string | ✓ | Game identifier (e.g., 'word-runner', 'hangman') |
| `session_id` | string | ✓ | Session identifier |
| `original_text` | string | ✓ | Raw user input |
| `corrected_text` | string | ✓ | AI-corrected version |
| `tags` | array | ✓ | Tags from `tags-reference.json` |
| `ai_model` | string | | Model used (e.g., 'llama-3.3-70b-versatile') |
| `ai_response_meta` | object | | `{ confidence: 0-1, applied_changes: [...] }` |
| `timestamp` | string (ISO 8601) | ✓ | Message timestamp |
| `status` | string | | 'queued' \| 'sent' \| 'flagged' \| 'blocked' \| 'delivered' |
| `audience` | string | | 'child' \| 'teacher' \| 'mixed' |
| `locale` | string | | Language code (e.g., 'en-US') |
| `style` | string | | Tone: 'friendly' \| 'encouraging' \| 'neutral' \| 'instructional' |
| `preserve_tokens` | array | | Special tokens to keep unchanged |
| `sender_role` | string | | 'player' \| 'system' \| 'ai' \| 'teacher' |
| `channel` | string | | 'global' \| 'team' \| 'private' |

## Tag Reference

See `tags-reference.json` for full taxonomy:

- **Gameplay:** `hint`, `clue`, `instruction`, `system`
- **Communication:** `chat`, `reply`, `announcement`, `notification`
- **Moderation:** `profanity`, `spam`, `pii_redacted`, `needs_review`, `harassment`
- **Pedagogy:** `vocab`, `grammar`, `difficulty_easy`, `difficulty_medium`, `difficulty_hard`
- **Meta:** `ai_suggestion`, `auto_corrected`, `human_reviewed`, `system_generated`

## Integration Steps

### Step 1: Copy Files
Copy all files from this folder into your new project/environment.

### Step 2: Install Dependencies
No external dependencies required for Node.js (uses native `fetch`). For browser use, ensure `fetch` is available (most modern browsers).

### Step 3: Set Secrets
Set `GROQ_API_KEY` and `BACKEND_AUTH_TOKEN` as environment variables or in a `.env` file.

### Step 4: Update Endpoints
Edit `config.json` to point to your actual backend and Firestore settings.

### Step 5: Import & Use
```javascript
import { processAndSendMessage } from './example-usage.js';

const result = await processAndSendMessage({
  userText: 'Ths is a test',
  senderId: 'player_123',
  gameId: 'word-runner',
  sessionId: 'sess_456',
  backendAuthToken: process.env.BACKEND_AUTH_TOKEN
});
```

## AI Model & API Details

- **Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Temperature:** 0.7 (flexible, can override)
- **Max Tokens:** 1024
- **Prompt Style:** JSON-only response, strict grammar checking

The prompt expects a text input and returns a JSON object with an array of corrections:

```json
{
  "corrections": [
    {
      "original": "teh",
      "corrected": "the",
      "explanation": "Letters are transposed."
    }
  ]
}
```

## Troubleshooting

### "GROQ_API_KEY is required"
Ensure the API key is set:
```bash
export GROQ_API_KEY="your-key-here"
```

### "Rate limit exceeded"
Groq has rate limits. Wait and retry, or reduce request frequency.

### "Invalid request format"
Check that the `original_text` is a valid string and not too long (>10k chars).

### Backend returns 403
Check that `BACKEND_AUTH_TOKEN` is correct and hasn't expired.

## Files Used in Original App

This bundle is based on and compatible with:
- `/js/ai-service.js` – Core AI logic
- `/js/messages-module.js` – Message sending (if it exists)
- Firestore backend for message storage

## License

Same as the parent game application.
