/**
 * Example: Full Message Correction & Send Flow
 * Shows how to use the AI service to correct a message and send it to the backend
 */

import { initializeAIService, buildMessagePayload, sendMessageToBackend } from './ai-service.js';
import config from './config.json';
import promptTemplate from './prompt-template.json';

/**
 * Complete flow: input text → AI correction → backend submission
 */
async function processAndSendMessage({
  userText,
  senderId,
  gameId,
  sessionId,
  backendAuthToken
}) {
  // Step 1: Initialize AI service
  console.log('Initializing AI service...');
  const aiService = initializeAIService({
    apiKey: process.env.GROQ_API_KEY,
    model: config.ai.model,
    endpoint: config.ai.apiEndpoint
  });

  // Step 2: Get AI corrections
  console.log('Requesting AI corrections for:', userText);
  let aiResponse;
  try {
    aiResponse = await aiService.checkLetterWithAI(userText);
  } catch (error) {
    console.error('AI service failed:', error.message);
    // Fallback: use original text if AI fails
    aiResponse = { corrections: [] };
  }

  // Step 3: Apply corrections to build corrected text
  let correctedText = userText;
  const appliedChanges = [];

  if (aiResponse.corrections && aiResponse.corrections.length > 0) {
    // Sort by position (longest first to avoid index shifting)
    const sorted = aiResponse.corrections.sort((a, b) => b.original.length - a.original.length);

    for (const correction of sorted) {
      if (correctedText.includes(correction.original)) {
        correctedText = correctedText.replace(correction.original, correction.corrected);
        appliedChanges.push(correction.explanation);
      }
    }
  }

  console.log('Original:', userText);
  console.log('Corrected:', correctedText);
  console.log('Changes applied:', appliedChanges);

  // Step 4: Determine tags based on corrections
  const tags = ['chat', 'auto_corrected'];
  if (aiResponse.corrections.length > 0) {
    tags.push('grammar');
  }

  // Step 5: Build message payload
  const messagePayload = buildMessagePayload({
    senderId: senderId,
    senderRole: 'player',
    channel: 'global',
    gameId: gameId,
    sessionId: sessionId,
    originalText: userText,
    correctedText: correctedText,
    tags: tags,
    audience: config.messageDefaults.audience,
    locale: config.messageDefaults.locale,
    style: config.messageDefaults.style,
    aiModel: config.ai.model,
    aiMeta: {
      confidence: aiResponse.corrections.length === 0 ? 1.0 : 0.85,
      applied_changes: appliedChanges
    },
    preserveTokens: config.preserveTokens,
    status: 'queued'
  });

  console.log('Message payload:', JSON.stringify(messagePayload, null, 2));

  // Step 6: Send to backend
  console.log('Sending message to backend...');
  try {
    const backendResponse = await sendMessageToBackend(
      messagePayload,
      config.messaging.backendEndpoint,
      backendAuthToken
    );

    console.log('✓ Message sent successfully:', backendResponse);
    return backendResponse;
  } catch (error) {
    console.error('✗ Failed to send message:', error.message);
    throw error;
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const result = await processAndSendMessage({
        userText: 'Ths is teh best gam ever!',
        senderId: 'player_12345',
        gameId: 'word-runner',
        sessionId: 'sess_abc123',
        backendAuthToken: process.env.BACKEND_AUTH_TOKEN || 'your-service-token-here'
      });

      console.log('\nFinal result:', result);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

export { processAndSendMessage };
