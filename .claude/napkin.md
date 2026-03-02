# Napkin - Odyssey Aurora v2

## Project Context
- Vite + vanilla TypeScript MVP — world model playground
- Odyssey-2 Pro SDK (`@odysseyml/odyssey`) for real-time WebRTC video streaming
- Gemini Flash for prompt refinement (WorldBuilder system prompt)
- Minimal UI: black page, Instrument Serif font, input box + stop button
- API key format: `ody_xxxxx` for Odyssey, `AIzaSy...` for Gemini

## Key SDK Patterns (from v1 project + docs)
- Singleton Odyssey manager — only 1 concurrent session allowed
- Lifecycle: connect(handlers) → startStream(opts) → interact(opts) → endStream() → disconnect()
- connect() takes handlers: { onConnected(stream), onError(err, fatal), onStatusChange(status, msg), onDisconnected(), onStreamStarted(), onStreamEnded(), onStreamError(), onInteractAcknowledged(prompt) }
- **SDK v1.0.0**: startStream({ prompt?, portrait?, image?: File|Blob }) — options object, supports image-to-video (max 25MB, JPEG/PNG/WebP/GIF/BMP/HEIC/HEIF/AVIF)
- **SDK v1.0.0**: interact({ prompt }) — options object, NOT plain string
- **BREAKING from v0.3.0**: positional args `startStream(prompt, portrait)` and `interact(prompt)` no longer work
- React hook: `useOdyssey` from `@odysseyml/odyssey/react`
- **CRITICAL: Stative language in prompts** — "is walking toward" not "walks to" (causes animation loops)
- Rate limit interactions (~1500ms between calls)
- Use ref pattern for interact in React to avoid stale closures
- Connection reuse: maintain WebRTC connection, only end/start streams for scene transitions
- Frame capture cross-fade: capture video frame to canvas before ending stream for smooth transitions
- Always call disconnect() on cleanup (stale connections block new ones, 40s server timeout)

## Anchor Image System (NEW for v2)
- Pre-generate all 11 scene images on first load via Gemini Flash Image 3.1
- Cache as base64/blob URLs in memory + localStorage
- When entering scene: use cached image → startStream({ prompt, image }) for instant visual
- Removes runtime latency for image generation

## Gemini API Details
- Image model: `gemini-3.1-flash-image-preview` (updated 2026-02-28; previous models deprecated)
- Text model: `gemini-3-flash-preview` (for prompt refinement; upgraded from gemini-2.0-flash)
- Use `responseMimeType: "application/json"` for structured narrative output
- Image generation: responseModalities includes "image", get base64 from response

## Mistakes & Corrections
- SDK exports `Odyssey`, not `OdysseyClient` — named export mismatch
- `startStream` does NOT accept image Blob — napkin v1 info was outdated/wrong for current SDK version
- `connect()` uses handlers object, NOT `.on('event')` pattern
- `generateNpcResponse` message format: useNpcChat sends pre-formatted Gemini messages `{ role, parts }`, not `{ role, content }`
- Always verify SDK exports against actual node_modules, not documentation/memory
- Playwright skill wrapper at `$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh` may not be executable in this repo environment; run with `bash "$PWCLI"` instead of executing directly.
- Playwright `run-code` in this environment expects a function expression (e.g., `async function run(page){...}`), not raw statements.
- `rg --files` without excluding `node_modules` explodes output and slows review; always scope to `src/` or filter with `rg -v '/node_modules/'`.
- For API-dependent E2E on this project, route-mocking Gemini endpoints + patching `odysseyManager` methods in browser context enables deterministic full-flow validation when real keys are unavailable.
- **Gemini model IDs deprecate quickly** — `gemini-2.0-flash-preview-image-generation` returned 404 by 2026-02-28. Always test with curl before committing model ID changes.
- **Odyssey SDK WebRTC race condition (v0.3.0 only)** — `connect()` resolved before data channel opened. Fixed in v1.0.0: `connect()` now waits for both video track AND data channel open. `startStream()` also falls back to WebSocket if data channel isn't ready.
- **Anchor images are NOT regenerated on every Begin click** — `preloadAll()` caches in memory Map + localStorage. Subsequent visits load from cache instantly. Only first visit (or cleared cache) triggers Gemini image generation.
- **Vercel env vars can have trailing newlines** — when piping values via CLI or pasting in dashboard, a `\n` can sneak into the value. Always `.trim()` env vars before use, especially API keys. This caused a 401 "Invalid API key" from Odyssey auth that was invisible without inspecting the raw request body.
- **Vite dep optimizer caches stale SDK versions** — after `npm install` upgrades a package (e.g. `@odysseyml/odyssey` v0.3.0 → v1.0.0), `node_modules/.vite/deps/` may still serve the old version. Fix: `rm -rf node_modules/.vite` and restart the dev server. Symptom: API shape mismatch (old positional args vs new options object) causing silent failures where the server ignores malformed messages.
- **Odyssey SDK v1.0.0 constructor ignores `dev` config** — `createConfig(config.apiKey)` only takes `apiKey`, discards everything else. To enable debug logging: `(odyssey as any).config.dev.debug = true` after construction.
- **Deepgram streaming STT** — `detect_language` is not supported for WebSocket streaming; including it can cause handshake failure (`WebSocket closed code=1006`). Remove `detect_language` and/or use a multilingual model. For browser auth, use `new WebSocket(url, ["token", apiKey])` (Sec-WebSocket-Protocol) instead of trying to set headers.

## TV Channel System (v2 Feature)
- Dual Odyssey instances are fully independent — separate WebRTC/WebSocket connections
- `SessionSlot` abstraction wraps each Odyssey instance with its own video element, role (active/staging), and state tracking
- Cross-fade: z-index swap + CSS opacity transition (1500ms), then role swap + end old stream
- Auto-play: preload next scene on staging slot while current plays, timer fires → crossFade → schedule next
- Single-session fallback: capture frame to canvas, end stream, static burst, start new stream, fade frozen frame out
- Channel switching: stopAutoPlay → static burst → end both streams → reset roles → start new channel
- `staticNoise` canvas uses 160x90 buffer with `image-rendering: pixelated` for performance
- Bandpass-filtered white noise (3kHz, Q=0.5) for static sound effect

## Lessons from v1
- Error recovery: need graceful reconnect, not just page reload
- Narrative fallback: have meaningful hardcoded fallback choices per scene
- Stream cleanup: always endCurrentStream() before starting new scenes
- Latency: parallel operations (image gen + narrative gen) reduce perceived wait
- No interrupt handling during ACTING phase — queue or block choices
- Always start local server from project root
- THREE.js ACES tone mapping crushes dark values — avoid if using glowing elements
