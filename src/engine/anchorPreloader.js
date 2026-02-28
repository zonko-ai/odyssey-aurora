// ─── Odyssey to the Stars v2 — Anchor Preloader ─────────────────────────────
// Background preloads and caches all 11 scene anchor images using Gemini
// image generation. Uses a two-tier cache (in-memory Map + localStorage)
// and a priority queue with semaphore-based concurrency control.

import { generateSceneImage } from './geminiService.js';
import { SCENES } from './sceneRegistry.js';
import { buildImagePrompt } from './storyBible.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'odyssey_anchor_';
const MAX_CONCURRENT = 2;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

// Priority tiers: scene 0 first, then 1-3, then 4-10
const PRIORITY_QUEUE = [[0], [1, 2, 3], [4, 5, 6, 7, 8, 9, 10]];

// ─── Cache State ──────────────────────────────────────────────────────────────

/** @type {Map<number, Blob>} In-memory image cache keyed by scene ID. */
const memoryCache = new Map();

/** Progress tracking. */
let loaded = 0;
let total = SCENES.length;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a Blob to a base64-encoded string.
 * @param {Blob} blob
 * @returns {Promise<string>} Base64 string (without data-URI prefix).
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Result is "data:<mime>;base64,<data>" — extract just the data part
      const result = /** @type {string} */ (reader.result);
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a base64-encoded string to a Blob.
 * @param {string} base64 - Raw base64 data.
 * @param {string} mimeType - MIME type for the Blob.
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
 * Try to load a cached image from localStorage into the memory cache.
 * @param {number} sceneId
 * @returns {boolean} True if a cached image was found and loaded.
 */
function loadFromStorage(sceneId) {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${sceneId}`);
    if (!stored) return false;

    const blob = base64ToBlob(stored, 'image/png');
    memoryCache.set(sceneId, blob);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save an image blob to localStorage. Silently catches QuotaExceededError.
 * @param {number} sceneId
 * @param {Blob} blob
 */
async function saveToStorage(sceneId, blob) {
  try {
    const base64 = await blobToBase64(blob);
    localStorage.setItem(`${STORAGE_PREFIX}${sceneId}`, base64);
  } catch {
    // QuotaExceededError or other storage failures — silently ignore
  }
}

/**
 * Generate a single scene image with retry logic and exponential backoff.
 * @param {number} sceneId
 * @returns {Promise<void>}
 */
async function generateWithRetry(sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) return false;

  const prompt = buildImagePrompt(scene.anchorImagePrompt, scene.camera);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const blob = await generateSceneImage(prompt);
      memoryCache.set(sceneId, blob);
      await saveToStorage(sceneId, blob);
      return true;
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.warn(`[AnchorPreloader] Failed to generate image for scene ${sceneId} after ${MAX_RETRIES} attempts:`, error);
      }
    }
  }
  return memoryCache.has(sceneId);
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Preload all scene anchor images with prioritized generation and caching.
 * Checks localStorage first, then generates uncached images with limited
 * concurrency (max 2 concurrent requests).
 *
 * @param {function({loaded: number, total: number, percent: number}): void} [onProgress]
 *   Optional callback invoked after each image completes.
 * @returns {Promise<void>} Resolves when all images are loaded or attempted.
 */
export async function preloadAll(onProgress) {
  loaded = 0;
  total = SCENES.length;

  // Phase 1: Load everything available from localStorage
  for (const scene of SCENES) {
    if (loadFromStorage(scene.id)) {
      loaded++;
    }
  }

  if (onProgress) {
    onProgress({ loaded, total, percent: Math.round((loaded / total) * 100) });
  }

  // If everything was cached, we're done
  if (loaded >= total) return;

  // Phase 2: Build ordered queue of uncached scene IDs
  const uncached = [];
  for (const tier of PRIORITY_QUEUE) {
    for (const sceneId of tier) {
      if (!memoryCache.has(sceneId)) {
        uncached.push(sceneId);
      }
    }
  }

  // Phase 3: Process queue with semaphore-limited concurrency
  let index = 0;

  async function processNext() {
    while (index < uncached.length) {
      const sceneId = uncached[index++];

      const success = await generateWithRetry(sceneId);
      if (success) loaded++;

      if (onProgress) {
        onProgress({ loaded, total, percent: Math.round((loaded / total) * 100) });
      }
    }
  }

  // Launch up to MAX_CONCURRENT workers
  const workers = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENT, uncached.length); i++) {
    workers.push(processNext());
  }

  await Promise.all(workers);
}

/**
 * Get a cached anchor image for a scene.
 * @param {number} sceneId - The scene ID.
 * @returns {Blob | null} The image blob, or null if not yet cached.
 */
export function getImage(sceneId) {
  return memoryCache.get(sceneId) || null;
}

/**
 * Get the current preload progress.
 * @returns {{ loaded: number, total: number, percent: number }}
 */
export function getProgress() {
  return {
    loaded,
    total,
    percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
  };
}

/**
 * Check whether a specific scene's anchor image is cached and ready.
 * @param {number} sceneId
 * @returns {boolean}
 */
export function isReady(sceneId) {
  return memoryCache.has(sceneId);
}

/**
 * Clear all cached images from both memory and localStorage.
 */
export function clearCache() {
  memoryCache.clear();

  for (const scene of SCENES) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${scene.id}`);
    } catch {
      // Ignore storage errors during cleanup
    }
  }

  loaded = 0;
}
