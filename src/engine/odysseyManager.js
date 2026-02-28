// ─── Odyssey to the Stars v2 — Odyssey Manager ──────────────────────────────
// Singleton WebRTC video stream manager using the Odyssey SDK.
// Handles connection lifecycle, scene streaming, interaction rate-limiting,
// and frame capture for the live video canvas.

import { Odyssey } from '@odysseyml/odyssey';

const API_KEY = (import.meta.env.VITE_ODYSSEY_API_KEY || '').trim();
if (!API_KEY) console.error('[OdysseyManager] VITE_ODYSSEY_API_KEY not set in .env');
const INTERACT_COOLDOWN_MS = 1500;

// ─── Singleton State ──────────────────────────────────────────────────────────

let client = null;
let videoElement = null;
let connected = false;
let streaming = false;
let lastInteractTime = 0;

// ─── Manager Object ──────────────────────────────────────────────────────────

const odysseyManager = {
  /**
   * Whether the client is currently connected to the Odyssey service.
   * @type {boolean}
   */
  get isConnected() {
    return connected;
  },

  /**
   * Whether a scene stream is currently active.
   * @type {boolean}
   */
  get isStreaming() {
    return streaming;
  },

  /**
   * Connect to the Odyssey service and bind the video stream to an element.
   * @param {HTMLVideoElement} element - The video element to receive the stream.
   * @returns {Promise<void>}
   */
  async connect(element) {
    // Clean up any stale connection first
    if (client) {
      this.disconnect();
    }

    videoElement = element;

    client = new Odyssey({ apiKey: API_KEY });

    const connectPromise = client.connect({
      onConnected: (stream) => {
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play().catch(() => {});
        }
        connected = true;
      },
      onError: (error, isFatal) => {
        console.error('[OdysseyManager] Error:', error?.message, isFatal ? '(fatal)' : '');
      },
      onStatusChange: (status, message) => {
        if (status === 'connected') {
          connected = true;
        } else if (status === 'disconnected' || status === 'failed') {
          connected = false;
          streaming = false;
        }
      },
      onDisconnected: () => {
        connected = false;
        streaming = false;
        if (videoElement) {
          videoElement.srcObject = null;
        }
      },
    });

    // Race against a 30s timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OdysseyManager: connection timed out after 30s')), 30000)
    );

    const success = await Promise.race([connectPromise, timeout]);

    if (!success) {
      throw new Error('OdysseyManager: connection failed');
    }

    connected = true;
  },

  /**
   * Start streaming a scene with a prompt.
   * Includes retry logic to work around SDK race condition where connect()
   * resolves before the WebRTC data channel is fully open.
   * @param {string} streamPrompt - The stative-verb prompt describing the scene.
   * @returns {Promise<void>}
   */
  async startScene(streamPrompt) {
    if (!client || !connected) {
      throw new Error('OdysseyManager: not connected. Call connect() first.');
    }

    // End any existing stream before starting a new one
    if (streaming) {
      await this.endCurrentStream();
    }

    // Retry loop: SDK race condition — connect() resolves before the
    // WebRTC clientToStreamerChannel.readyState becomes "open".
    // startStream → sendEvent throws "Client to streamer channel not open".
    const MAX_RETRIES = 10;
    const RETRY_DELAY_MS = 300;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await client.startStream(streamPrompt, false); // false = landscape
        streaming = true;
        return;
      } catch (err) {
        const isChannelNotOpen =
          err?.message?.includes('channel not open') ||
          err?.message?.includes('Channel not open');

        if (isChannelNotOpen && attempt < MAX_RETRIES) {
          console.warn(
            `[OdysseyManager] Data channel not ready, retry ${attempt}/${MAX_RETRIES}...`
          );
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }

        throw err;
      }
    }
  },

  /**
   * Send an interaction prompt to the active stream.
   * Rate-limited to one call per 1500ms; excess calls are silently dropped.
   * @param {string} prompt - The interaction prompt.
   */
  interact(prompt) {
    if (!client || !streaming) {
      return;
    }

    const now = Date.now();
    if (now - lastInteractTime < INTERACT_COOLDOWN_MS) {
      return;
    }

    lastInteractTime = now;
    client.interact(prompt).catch((err) => {
      console.warn('[OdysseyManager] Interact error:', err?.message);
    });
  },

  /**
   * End the currently active scene stream, if any.
   */
  async endCurrentStream() {
    if (client && streaming) {
      try {
        await client.endStream();
      } catch {
        // Best-effort cleanup
      }
      streaming = false;
    }
  },

  /**
   * Capture the current video frame and return it as an HTMLCanvasElement.
   * @returns {HTMLCanvasElement} Canvas with the current video frame drawn on it.
   */
  captureCurrentFrame() {
    if (!videoElement || !videoElement.videoWidth) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || videoElement.clientWidth;
      canvas.height = videoElement.videoHeight || videoElement.clientHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      return canvas;
    } catch {
      return null;
    }
  },

  /**
   * Fully disconnect from the Odyssey service and clean up all state.
   * Always call this when leaving a session — stale connections block new ones
   * until the server's 40-second timeout expires.
   */
  disconnect() {
    if (client) {
      try {
        client.disconnect();
      } catch {
        // Best-effort cleanup
      }
    }

    client = null;
    videoElement = null;
    connected = false;
    streaming = false;
    lastInteractTime = 0;
  },
};

export default odysseyManager;
