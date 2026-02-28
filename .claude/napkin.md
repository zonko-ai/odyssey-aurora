# Napkin - Odyssey Aurora (formerly Odyssey to the Stars v2)

## Project Context
- React + Vite + Tailwind interactive adventure game
- Odyssey-2 Pro SDK (`@odysseyml/odyssey`) for real-time WebRTC video streaming
- Gemini Flash Image 3.1 for anchor image generation (all scenes preloaded)
- Gemini 3 Pro for narrative text, choices, NPC chat
- Predefined 11-scene storyline with light branching and 3-4 endings
- API key format: `ody_xxxxx` for Odyssey, `AIzaSy...` for Gemini

## Key SDK Patterns (from v1 project + docs)
- Singleton Odyssey manager — only 1 concurrent session allowed
- Lifecycle: connect(handlers) → startStream(prompt, portrait) → interact(prompt) → endStream() → disconnect()
- connect() takes handlers: { onConnected(stream), onError(err, fatal), onStatusChange(status, msg), onDisconnected() }
- startStream(prompt, portrait=true) — text prompt + orientation boolean, NO image parameter in current SDK
- interact(prompt) — plain string, NOT { prompt } object
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
- Image model: `gemini-2.5-flash-image` (confirmed working 2026-02-28; `gemini-2.0-flash-preview-image-generation` was removed)
- Text model: `gemini-2.5-flash` (for narrative/chat)
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

## Lessons from v1
- Error recovery: need graceful reconnect, not just page reload
- Narrative fallback: have meaningful hardcoded fallback choices per scene
- Stream cleanup: always endCurrentStream() before starting new scenes
- Latency: parallel operations (image gen + narrative gen) reduce perceived wait
- No interrupt handling during ACTING phase — queue or block choices
- Always start local server from project root
- THREE.js ACES tone mapping crushes dark values — avoid if using glowing elements
