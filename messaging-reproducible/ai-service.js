/**
 * AI Service for Message Corrections
 * Connects to Groq API for grammar and spell checking
 * Can be used standalone or integrated into a larger system
 */

/**
 * Initialize the AI service with config
 * @param {Object} config - Configuration object with api keys and endpoints
 * @returns {Object} - Initialized service with methods
 */
export function initializeAIService(config) {
  const GROQ_API_KEY = config.apiKey || process.env.GROQ_API_KEY;
  const GROQ_MODEL = config.model || 'llama-3.3-70b-versatile';
  const GROQ_ENDPOINT = config.endpoint || 'https://api.groq.com/openai/v1/chat/completions';

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required');
  }

  return {
    /**
     * Check text for grammar and spelling mistakes
     * @param {string} letterText - Text to check
     * @param {Object} options - Optional overrides (temperature, maxTokens, etc.)
     * @returns {Promise<Object>} - Response with corrections array
     */
    async checkLetterWithAI(letterText, options = {}) {
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 1024;

      const prompt = `You are an English teacher. Find ALL grammar mistakes in this text. Return ONLY a JSON object with one property:

"corrections": an array of objects, each with:
   - "original": the exact wrong word/phrase from the text
   - "corrected": the fixed version
   - "explanation": why it's wrong (one sentence)

Find as many errors as you can in the text.

Text to check:
${letterText}

Return ONLY the JSON object, no markdown, no code blocks, no extra text.`;

      try {
        const response = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: temperature,
            max_tokens: maxTokens
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Groq API Error:', errorData);

          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait and try again.');
          } else if (response.status === 403) {
            throw new Error('API key error or insufficient permissions.');
          } else if (response.status === 400) {
            throw new Error('Invalid request format.');
          } else {
            throw new Error(`Groq API error: ${response.status}`);
          }
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse the JSON response
        const result = JSON.parse(content);

        return result;
      } catch (error) {
        console.error('Error in checkLetterWithAI:', error);
        throw error;
      }
    },

    /**
     * Get service configuration
     * @returns {Object} - Current configuration
     */
    getConfig() {
      return {
        model: GROQ_MODEL,
        endpoint: GROQ_ENDPOINT,
        apiKeyPrefix: GROQ_API_KEY.substring(0, 10) + '...'
      };
    }
  };
}

/**
 * Build a complete message object for backend submission
 * @param {Object} params - Message parameters
 * @returns {Object} - Complete message object matching schema
 */
export function buildMessagePayload(params) {
  const {
    senderId,
    senderRole = 'player',
    recipientId = null,
    channel = 'global',
    gameId,
    sessionId,
    originalText,
    correctedText,
    tags = [],
    audience = 'child',
    locale = 'en-US',
    style = 'friendly',
    aiModel = 'llama-3.3-70b-versatile',
    aiMeta = {},
    preserveTokens = [],
    status = 'queued'
  } = params;

  return {
    sender_id: senderId,
    sender_role: senderRole,
    recipient_id: recipientId,
    channel: channel,
    game_id: gameId,
    session_id: sessionId,
    original_text: originalText,
    corrected_text: correctedText,
    tags: tags,
    audience: audience,
    locale: locale,
    style: style,
    ai_model: aiModel,
    ai_response_meta: aiMeta,
    timestamp: new Date().toISOString(),
    preserve_tokens: preserveTokens,
    status: status
  };
}

/**
 * Send message to backend
 * @param {Object} messagePayload - Message object matching schema
 * @param {string} backendUrl - Backend endpoint URL
 * @param {string} authToken - Authorization token
 * @returns {Promise<Object>} - Backend response
 */
export async function sendMessageToBackend(messagePayload, backendUrl, authToken) {
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message to backend:', error);
    throw error;
  }
}
