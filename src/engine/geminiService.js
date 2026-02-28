// ─── Odyssey to the Stars v2 — Gemini Service ────────────────────────────────
// Wraps all Google Gemini API calls (text generation, image generation,
// structured JSON output, and multi-turn chat) via fetch().

import {
  NARRATIVE_SYSTEM_PROMPT,
  buildNarrativePrompt,
  buildChoicesPrompt,
} from './storyBible.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/';
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

if (!API_KEY) console.error('[GeminiService] VITE_GEMINI_API_KEY not set in .env');

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Convert a base64-encoded string to a Blob.
 * @param {string} base64 - Raw base64 data (no data-URI prefix).
 * @param {string} mimeType - MIME type for the resulting Blob.
 * @returns {Blob}
 */
function base64ToBlob(base64, mimeType) {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Shared fetch wrapper for Gemini API calls.
 * @param {string} model - Model name (e.g. "gemini-2.5-flash").
 * @param {object} body - JSON request body.
 * @returns {Promise<object>} Parsed JSON response.
 */
async function callGemini(model, body, timeoutMs = 30000) {
  const url = `${BASE_URL}models/${model}:generateContent?key=${API_KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini API timeout after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract the first text part from a Gemini response.
 * @param {object} response - Parsed Gemini API response.
 * @returns {string} The extracted text content.
 */
function extractText(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No content parts in Gemini response');
  }

  const textPart = parts.find((p) => typeof p.text === 'string');
  if (!textPart) {
    throw new Error('No text part found in Gemini response');
  }

  return textPart.text.trim();
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Generate a scene anchor image from a text prompt.
 * @param {string} prompt - Fully constructed image generation prompt.
 * @returns {Promise<Blob>} The generated image as a Blob.
 */
export async function generateSceneImage(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await callGemini(IMAGE_MODEL, body);

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No parts in image generation response');
  }

  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) {
    throw new Error('No image data in Gemini response');
  }

  const { data, mimeType } = imagePart.inlineData;
  return base64ToBlob(data, mimeType);
}

/**
 * Generate narrative text for a scene.
 * @param {string} sceneName - Display name of the scene.
 * @param {string} context - Narrative context describing the scene.
 * @param {string} [previousChoice] - Text of the player's previous choice, if any.
 * @returns {Promise<string>} Generated narrative passage.
 */
export async function generateNarrative(sceneName, context, previousChoice) {
  const userPrompt = buildNarrativePrompt(sceneName, context, previousChoice);

  const body = {
    systemInstruction: {
      parts: [{ text: NARRATIVE_SYSTEM_PROMPT }],
    },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  };

  const response = await callGemini(TEXT_MODEL, body);
  return extractText(response);
}

/**
 * Generate player choices for a scene.
 * @param {string} sceneName - Display name of the scene.
 * @param {string} context - Narrative context for the scene.
 * @param {string} choiceContext - Guidance on what kind of choices to generate.
 * @returns {Promise<Array<{id: string, text: string, tone: string}>>} Array of 3 choice objects.
 */
export async function generateChoices(sceneName, context, choiceContext) {
  const userPrompt = buildChoicesPrompt(sceneName, context, choiceContext);

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await callGemini(TEXT_MODEL, body);
  let text = extractText(response);

  // Strip markdown fences if Gemini wraps the JSON
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

  let choices;
  try {
    choices = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse choices JSON: ${text.slice(0, 200)}`);
  }

  // Validate structure
  if (!Array.isArray(choices) || choices.length !== 3) {
    throw new Error(`Expected 3 choices, got ${Array.isArray(choices) ? choices.length : typeof choices}`);
  }

  for (const choice of choices) {
    if (!choice.id || !choice.text || !choice.tone) {
      throw new Error(`Invalid choice object — missing id, text, or tone: ${JSON.stringify(choice)}`);
    }
  }

  return choices;
}

/**
 * Generate an NPC chat response with emotion detection.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} messages - Conversation
 *   history in Gemini format (role: 'user'|'model', parts: [{ text }]).
 * @param {string} systemPrompt - NPC character system prompt.
 * @returns {Promise<{text: string, emotion: string}>} Response text and detected emotion.
 */
export async function generateNpcResponse(messages, systemPrompt) {
  // Messages arrive pre-formatted for Gemini from useNpcChat
  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: messages,
  };

  const response = await callGemini(TEXT_MODEL, body);
  const text = extractText(response);

  // Detect emotion from response content
  const emotion = detectEmotion(text);

  return { text, emotion };
}

/**
 * Simple keyword-based emotion detection from response text.
 * @param {string} text - The NPC response text.
 * @returns {string} Detected emotion: excited | concerned | surprised | thoughtful | neutral.
 */
function detectEmotion(text) {
  const lower = text.toLowerCase();

  const patterns = {
    excited: [
      'exciting', 'incredible', 'amazing', 'fantastic', 'wonderful',
      'thrilling', 'remarkable', 'extraordinary', 'brilliant', 'magnificent',
      '!', 'can you believe', 'look at this', 'you won\'t believe',
    ],
    concerned: [
      'worried', 'concerning', 'dangerous', 'careful', 'warning',
      'risk', 'threat', 'caution', 'afraid', 'trouble',
      'unfortunately', 'problem', 'issue', 'alarming',
    ],
    surprised: [
      'impossible', 'unexpected', 'what the', 'no way', 'unbelievable',
      'never seen', 'how is this', 'can\'t be', 'shocked', 'astonishing',
      'didn\'t expect', 'out of nowhere',
    ],
    thoughtful: [
      'perhaps', 'consider', 'wonder', 'interesting', 'theory',
      'hypothesis', 'contemplate', 'ponder', 'reflect', 'curious',
      'think about', 'what if', 'imagine', 'suggests',
    ],
  };

  // Score each emotion by counting keyword matches
  let bestEmotion = 'neutral';
  let bestScore = 0;

  for (const [emotion, keywords] of Object.entries(patterns)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEmotion = emotion;
    }
  }

  return bestEmotion;
}
