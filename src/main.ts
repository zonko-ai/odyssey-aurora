import { Odyssey } from "@odysseyml/odyssey";
import { GoogleGenAI } from "@google/genai";

// ── Types ──────────────────────────────────────────────
type AppState = "off" | "connecting" | "connected" | "streaming" | "stopping";

// ── Elements ───────────────────────────────────────────
const app = document.getElementById("app") as HTMLDivElement;
const video = document.getElementById("world") as HTMLVideoElement;
const form = document.getElementById("prompt-form") as HTMLFormElement;
const input = document.getElementById("prompt-input") as HTMLTextAreaElement;
const btnExecute = document.getElementById("btn-execute") as HTMLButtonElement;
const btnAttach = document.getElementById("btn-attach") as HTMLButtonElement;
const imageInput = document.getElementById("image-input") as HTMLInputElement;
const imagePreview = document.getElementById("image-preview") as HTMLDivElement;
const imageThumb = document.getElementById("image-thumb") as HTMLImageElement;
const imageRemove = document.getElementById("image-remove") as HTMLButtonElement;
const powerBtn = document.getElementById("power-btn") as HTMLButtonElement;
const btnNewWorld = document.getElementById("btn-new-world") as HTMLButtonElement;
const newWorldBar = document.getElementById("new-world-bar") as HTMLDivElement;
const powerLed = document.getElementById("power-led") as HTMLDivElement;
const powerLedGlow = document.getElementById("power-led-glow") as HTMLDivElement;
const chatHistory = document.getElementById("chat-history") as HTMLDivElement;
const errorToast = document.getElementById("error-toast") as HTMLDivElement;
const screenContent = document.getElementById("screen-content") as HTMLDivElement;
const screenIdle = document.getElementById("screen-idle") as HTMLDivElement;
const screenBoot = document.getElementById("screen-boot") as HTMLDivElement;
const bootStatus = document.getElementById("boot-status") as HTMLDivElement;
const crtScreen = document.getElementById("crt-screen") as HTMLDivElement;
const ambientGlow = document.getElementById("ambient-glow") as HTMLDivElement;
const hudBar = document.getElementById("hud-bar") as HTMLDivElement;
const hudOverlay = document.getElementById("hud-overlay") as HTMLDivElement;
const hudDuration = document.getElementById("hud-duration") as HTMLSpanElement;
const hudFps = document.getElementById("hud-fps") as HTMLSpanElement;
const engineStatusDot = document.getElementById("engine-status-dot") as HTMLSpanElement;
const engineStatusText = document.getElementById("engine-status-text") as HTMLSpanElement;
const powerHint = document.getElementById("power-hint") as HTMLDivElement;

// ── Clients ────────────────────────────────────────────
const odyssey = new Odyssey({
  apiKey: (import.meta.env.VITE_ODYSSEY_API_KEY as string)?.trim(),
});

const gemini = new GoogleGenAI({
  apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string)?.trim(),
});

// ── State ──────────────────────────────────────────────
let state: AppState = "off";
let errorTimer: ReturnType<typeof setTimeout> | null = null;
let lastInteractTime = 0;
const INTERACT_COOLDOWN = 1500;

// Stream duration timer
let streamStartTime = 0;
let durationInterval: ReturnType<typeof setInterval> | null = null;

// Track pending interact messages for acknowledgement
const pendingInteracts = new Map<string, HTMLDivElement>();

// Attached image
let attachedImage: File | null = null;

// ── Image attach helpers ───────────────────────────────
btnAttach.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    flashError("Image must be under 25MB.");
    imageInput.value = "";
    return;
  }
  attachedImage = file;
  imageThumb.src = URL.createObjectURL(file);
  imagePreview.classList.remove("hidden");
});

imageRemove.addEventListener("click", () => {
  clearAttachedImage();
});

function clearAttachedImage() {
  if (imageThumb.src.startsWith("blob:")) {
    URL.revokeObjectURL(imageThumb.src);
  }
  attachedImage = null;
  imageInput.value = "";
  imagePreview.classList.add("hidden");
}

// ── Duration timer helpers ─────────────────────────────
function startDurationTimer() {
  streamStartTime = Date.now();
  hudDuration.textContent = "00:00";
  durationInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    hudDuration.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  hudDuration.textContent = "00:00";
}

// ── FPS counter ──────────────────────────────────────
let fpsRaf: number | null = null;
let lastFpsTime = 0;
let frameCount = 0;

function startFpsCounter() {
  lastFpsTime = performance.now();
  frameCount = 0;
  hudFps.textContent = "FPS: --";

  function tick() {
    if (video.readyState >= 2) frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
      hudFps.textContent = `FPS: ${frameCount}`;
      frameCount = 0;
      lastFpsTime = now;
    }
    fpsRaf = requestAnimationFrame(tick);
  }
  fpsRaf = requestAnimationFrame(tick);
}

function stopFpsCounter() {
  if (fpsRaf !== null) {
    cancelAnimationFrame(fpsRaf);
    fpsRaf = null;
  }
  hudFps.textContent = "FPS: --";
}

// ── Gemini prompt refinement ───────────────────────────
const SYSTEM_PROMPT = `You are WorldBuilder, a master prompt engineer for Odyssey-2 Pro — the frontier world model that creates continuous, interactive 720p@22fps video simulations from a single starting description.

Your ONLY job: turn the user's casual idea into ONE highly optimized starting prompt (60-140 words) that produces the most stable, visually rich, and physically plausible world.

Odyssey-2 Pro loves prompts that are:
- Cinematic and vivid (describe lighting, atmosphere, camera angle, materials, time of day)
- Concrete and specific (exact colors, textures, scale, weather, mood)
- Balanced: 60% scene description + 20% style/mood + 20% subtle physics/behavior hints
- Present tense, active voice, no meta words like "generate", "simulate", "in the style of"
- Ready for long continuous simulation (include subtle ongoing motion and physics cues)
- Use STATIVE language ("is walking toward" not "walks to") to avoid animation loops

Structure the prompt like this (use all parts in one smooth flowing paragraph):
1. Opening wide establishing shot + main subject
2. Environment + time of day + weather + lighting
3. Key objects, characters, materials, colors
4. Overall mood and subtle motion hints (e.g. "gentle wind", "flickering firelight", "leaves slowly drifting")
5. Camera style (cinematic, 35mm lens, shallow depth of field, etc.)

Output ONLY the final prompt as one smooth paragraph. No quotes, no explanations, no extra text.`;

const INTERACT_SYSTEM_PROMPT = `You are ActionMaster, an expert real-time simulation engineer for Odyssey O2 Pro — the frontier world model that runs continuous 720p@22fps interactive video simulations.

Your ONLY job is to convert the user's natural language request into ONE or TWO short, precise, imperative action strings that will be fed directly to Odyssey O2 Pro via the interact() API.

Odyssey O2 Pro best practices for actions:
- Keep every action 5–18 words max (ideally 8–12)
- Use present tense, active voice, vivid visual language
- Be concrete and specific about what physically happens next
- Describe visible changes, object behaviors, physics, camera moves, lighting, weather, or character actions
- Never explain, never add "the user wants", never say "simulate" or "now"
- Never break the current world consistency
- Prefer natural emergent behavior over forced outcomes

Good action examples:
- "A massive red dragon swoops down and lands on the castle roof"
- "Heavy rain starts pouring, lightning flashes in the dark sky"
- "The black cat leaps onto the table and knocks the vase over"
- "Camera slowly zooms in on the warrior's determined face"
- "Golden sunlight breaks through the clouds at sunrise"

Bad actions (never output these):
- "Make a dragon appear" → too vague
- "User punches the wall" → meta, not visual
- "Simulate a fight scene" → too abstract
- "The character feels angry" → internal, not visible

Special rules:
- Camera instructions are allowed and encouraged: "camera pans left", "slow dolly zoom on the horizon"
- For impossible or contradictory requests, adapt to something visually plausible while staying faithful to the intent
- You can output TWO actions separated by " || " only when they are independent and simultaneous (rare)

Output ONLY the action string(s). No quotes, no explanations, no extra text.`;

async function refinePrompt(raw: string): Promise<string> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: raw,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });
    return response.text?.trim() || raw;
  } catch {
    return raw;
  }
}

async function refineInteractPrompt(raw: string): Promise<string> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: raw,
      config: {
        systemInstruction: INTERACT_SYSTEM_PROMPT,
        temperature: 0.5,
        maxOutputTokens: 100,
      },
    });
    return response.text?.trim() || raw;
  } catch {
    return raw;
  }
}

// ── LED helpers ────────────────────────────────────────
function setLed(color: "red" | "green" | "amber", blink = false) {
  const colors = {
    red: {
      bg: "bg-red-500",
      shadow: "shadow-[0_0_8px_rgba(239,68,68,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]",
      border: "border-red-700",
      glow: "bg-red-500/20",
    },
    green: {
      bg: "bg-green-500",
      shadow: "shadow-[0_0_8px_rgba(34,197,94,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]",
      border: "border-green-700",
      glow: "bg-green-500/20",
    },
    amber: {
      bg: "bg-amber-500",
      shadow: "shadow-[0_0_8px_rgba(245,158,11,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)]",
      border: "border-amber-700",
      glow: "bg-amber-500/20",
    },
  };
  const c = colors[color];
  powerLed.className = `w-2.5 h-2.5 rounded-full ${c.bg} ${c.shadow} border ${c.border} transition-colors duration-300${blink ? " animate-pulse" : ""}`;
  powerLedGlow.className = `absolute -inset-1 ${c.glow} rounded-full blur-sm transition-colors duration-300`;
}

// ── Engine status helpers ──────────────────────────────
function setEngineStatus(text: string, color: "red" | "green" | "amber") {
  engineStatusText.textContent = text;
  const dotColors = { red: "bg-red-500", green: "bg-green-500", amber: "bg-amber-500" };
  engineStatusDot.className = `w-1.5 h-1.5 rounded-full ${dotColors[color]}${color === "green" ? " animate-pulse" : ""}`;
}

// ── Chat history ───────────────────────────────────────
function addChatMessage(
  role: "director" | "engine" | "system",
  text: string,
  opts?: { loading?: boolean; hasImage?: boolean }
) {
  const spacer = chatHistory.querySelector(".h-2:last-child");
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-2 transition-all duration-300 opacity-0 translate-y-2";

  const imageTag = opts?.hasImage
    ? `<span class="text-orange-400/60 text-[10px] font-sans tracking-widest uppercase ml-2">+ image</span>`
    : "";

  if (role === "system") {
    wrapper.innerHTML = `<div class="flex flex-col gap-1">
      <div class="text-zinc-500 text-xs italic">${escapeHtml(text)}</div>
    </div>`;
  } else if (role === "director") {
    wrapper.innerHTML = `<div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-zinc-500">
        <iconify-icon icon="lucide:user" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">Director</span>${imageTag}
      </div>
      <p class="text-sm leading-relaxed text-zinc-300 font-serif">"${escapeHtml(text)}"</p>
    </div>`;
  } else {
    const borderClass = opts?.loading ? "border-orange-500/30" : "border-white/10";
    const iconName = opts?.loading ? "lucide:loader-2" : "lucide:cpu";
    const iconClass = opts?.loading ? "text-[10px] animate-spin" : "text-[10px]";
    const labelText = opts?.loading ? "Processing" : "World Engine";
    wrapper.innerHTML = `<div class="flex flex-col gap-2 pl-3 border-l ${borderClass}">
      <div class="flex items-center gap-2 text-orange-400/80">
        <iconify-icon icon="${iconName}" class="${iconClass}"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">${labelText}</span>
      </div>
      <p class="text-zinc-400 text-sm font-serif italic">${escapeHtml(text)}</p>
    </div>`;
  }

  if (spacer) chatHistory.insertBefore(wrapper, spacer);
  else chatHistory.appendChild(wrapper);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrapper.classList.remove("opacity-0", "translate-y-2");
    });
  });

  setTimeout(() => {
    chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
  }, 50);

  return wrapper;
}

/** Update a loading message to show acknowledged checkmark */
function markAcknowledged(wrapper: HTMLDivElement) {
  wrapper.innerHTML = `<div class="flex flex-col gap-2 pl-3 border-l border-green-500/20">
    <div class="flex items-center gap-2 text-green-400/80">
      <iconify-icon icon="lucide:check" class="text-[10px]"></iconify-icon>
      <span class="text-[10px] tracking-widest uppercase">Acknowledged</span>
    </div>
    <p class="text-zinc-400 text-sm font-serif italic">Update applied to world.</p>
  </div>`;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── State transitions ──────────────────────────────────
function setState(next: AppState) {
  state = next;
  app.className = `state-${next} relative z-10 w-full h-screen flex`;

  // Power hint visibility
  powerHint.style.opacity = next === "off" ? "1" : "0";

  // New World button only visible during streaming
  newWorldBar.classList.toggle("hidden", next !== "streaming");

  switch (next) {
    case "off":
      setLed("red");
      setEngineStatus("Engine Offline", "red");
      screenContent.style.opacity = "0";
      screenIdle.style.opacity = "0";
      screenBoot.style.opacity = "0";
      crtScreen.classList.remove("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0";
      hudBar.style.opacity = "0";
      hudOverlay.style.opacity = "0";
      video.style.opacity = "0";
      video.srcObject = null;
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      stopDurationTimer();
      stopFpsCounter();
      clearAttachedImage();
      break;

    case "connecting":
      setLed("amber", true);
      setEngineStatus("Connecting…", "amber");
      screenContent.style.opacity = "0";
      screenIdle.style.opacity = "0";
      screenBoot.style.opacity = "1";
      bootStatus.textContent = "Initializing systems…";
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0.3";
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      break;

    case "connected":
      setLed("green");
      setEngineStatus("Connected", "green");
      screenContent.style.opacity = "1";
      screenIdle.style.opacity = "1";
      screenBoot.style.opacity = "0";
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0.5";
      hudBar.style.opacity = "0";
      hudOverlay.style.opacity = "0";
      video.style.opacity = "0";
      input.disabled = false;
      btnExecute.disabled = false;
      btnAttach.disabled = false;
      input.focus();
      break;

    case "streaming":
      setLed("green");
      setEngineStatus("Streaming", "green");
      screenContent.style.opacity = "1";
      screenIdle.style.opacity = "0";
      screenBoot.style.opacity = "0";
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "1";
      video.style.opacity = "1";
      hudBar.style.opacity = "1";
      hudOverlay.style.opacity = "1";
      input.disabled = false;
      btnExecute.disabled = false;
      btnAttach.disabled = true; // image only for initial stream
      input.focus();
      startDurationTimer();
      startFpsCounter();
      break;

    case "stopping":
      setLed("amber", true);
      setEngineStatus("Shutting down…", "amber");
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      stopDurationTimer();
      stopFpsCounter();
      break;
  }
}

// ── Error flash ────────────────────────────────────────
function flashError(msg: string) {
  if (errorTimer) clearTimeout(errorTimer);
  errorToast.textContent = msg;
  errorToast.style.opacity = "1";
  errorTimer = setTimeout(() => {
    errorToast.style.opacity = "0";
  }, 4000);
}

// ── Power on (connect) ─────────────────────────────────
async function powerOn() {
  if (state !== "off") return;
  setState("connecting");
  addChatMessage("system", "Initializing connection…");

  try {
    const mediaStream = await odyssey.connect({
      onDisconnected: () => {
        if (state !== "off" && state !== "stopping") {
          addChatMessage("system", "Connection lost.");
          setState("off");
        }
      },
      onStreamStarted: () => {
        // Stream frames arriving
      },
      onStreamEnded: () => {
        if (state === "streaming") {
          addChatMessage("system", "Stream ended by server.");
          stopDurationTimer();
        }
      },
      onStreamError: (_reason: string, message: string) => {
        flashError(message);
        addChatMessage("engine", `Stream error: ${message}`);
      },
      onError: (error: Error, fatal: boolean) => {
        flashError(error.message);
        if (fatal) {
          addChatMessage("system", `Fatal error: ${error.message}`);
          setState("off");
        }
      },
      onStatusChange: (status: string, message?: string) => {
        const statusMap: Record<string, { text: string; color: "red" | "green" | "amber" }> = {
          authenticating: { text: "Authenticating…", color: "amber" },
          connecting: { text: "Connecting…", color: "amber" },
          reconnecting: { text: "Reconnecting…", color: "amber" },
          connected: { text: "Connected", color: "green" },
          disconnected: { text: "Disconnected", color: "red" },
          failed: { text: "Failed", color: "red" },
        };
        const s = statusMap[status];
        if (s) {
          setEngineStatus(s.text, s.color);
          if (s.color === "amber") setLed("amber", true);
        }
        // Update boot screen text
        const bootTextMap: Record<string, string> = {
          authenticating: "Authenticating…",
          connecting: "Establishing WebRTC link…",
          reconnecting: "Reconnecting…",
        };
        if (bootTextMap[status]) bootStatus.textContent = bootTextMap[status];
        if (status === "failed" && message) {
          flashError(message);
        }
      },
      onInteractAcknowledged: (prompt: string) => {
        const wrapper = pendingInteracts.get(prompt);
        if (wrapper) {
          markAcknowledged(wrapper);
          pendingInteracts.delete(prompt);
        }
      },
    });

    video.srcObject = mediaStream;
    setState("connected");
    addChatMessage("system", "Connected. Describe a world or attach an image to begin.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    flashError(msg);
    addChatMessage("system", `Connection failed: ${msg}`);
    setState("off");
  }
}

// ── Power off (disconnect) ─────────────────────────────
async function powerOff() {
  if (state === "off" || state === "stopping") return;
  const wasStreaming = state === "streaming";
  setState("stopping");

  try {
    if (wasStreaming) {
      await odyssey.endStream();
    }
  } catch {
    // stream may already be ended
  }

  odyssey.disconnect();
  pendingInteracts.clear();
  addChatMessage("system", "Engine offline.");
  setState("off");
}

// ── New world (end stream, stay connected) ──────────────
async function newWorld() {
  if (state !== "streaming") return;
  addChatMessage("system", "Ending current world…");

  try {
    await odyssey.endStream();
  } catch {
    // stream may already be ended
  }

  pendingInteracts.clear();
  video.style.opacity = "0";
  setState("connected");
  addChatMessage("system", "Ready for a new world. Describe one or attach an image.");
}

// ── Timeout helper ─────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ── Start a world stream ───────────────────────────────
async function startWorld(rawPrompt: string, image?: File) {
  if (state !== "connected") return;

  const hasImage = !!image;
  addChatMessage("director", rawPrompt || "(image only)", { hasImage });

  const loadingMsg = addChatMessage("engine", "Refining prompt…", { loading: true });

  // Refine prompt if provided
  const prompt = rawPrompt ? await refinePrompt(rawPrompt) : undefined;

  // Update loading message
  const inner = loadingMsg.querySelector("p");
  if (inner) inner.textContent = hasImage ? "Generating world from image…" : "Generating world…";

  try {
    await withTimeout(
      odyssey.startStream({ prompt, portrait: false, image }),
      45_000,
      "startStream"
    );
    loadingMsg.innerHTML = `<div class="flex flex-col gap-2 pl-3 border-l border-white/10">
      <div class="flex items-center gap-2 text-orange-400/80">
        <iconify-icon icon="lucide:cpu" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">World Engine</span>
      </div>
      <p class="text-zinc-400 text-sm font-serif italic">World rendered. Commencing live feed.</p>
    </div>`;
    setState("streaming");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stream failed";
    flashError(msg);
    loadingMsg.innerHTML = `<div class="flex flex-col gap-2 pl-3 border-l border-red-500/30">
      <div class="flex items-center gap-2 text-red-400/80">
        <iconify-icon icon="lucide:alert-triangle" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">Error</span>
      </div>
      <p class="text-red-300 text-sm font-serif italic">${escapeHtml(msg)}</p>
    </div>`;
  }
}

// ── Interact with running stream ───────────────────────
async function interactWorld(rawPrompt: string) {
  if (state !== "streaming") return;

  const now = Date.now();
  if (now - lastInteractTime < INTERACT_COOLDOWN) {
    flashError("Too fast — wait a moment between commands.");
    return;
  }
  lastInteractTime = now;

  addChatMessage("director", rawPrompt);
  const loadingMsg = addChatMessage("engine", "Applying changes…", { loading: true });

  const prompt = await refineInteractPrompt(rawPrompt);

  pendingInteracts.set(prompt, loadingMsg);

  try {
    await odyssey.interact({ prompt });
    if (pendingInteracts.has(prompt)) {
      pendingInteracts.delete(prompt);
      markAcknowledged(loadingMsg);
    }
  } catch (err: unknown) {
    pendingInteracts.delete(prompt);
    const msg = err instanceof Error ? err.message : "Interaction failed";
    flashError(msg);
    loadingMsg.innerHTML = `<div class="flex flex-col gap-2 pl-3 border-l border-red-500/30">
      <div class="flex items-center gap-2 text-red-400/80">
        <iconify-icon icon="lucide:alert-triangle" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">Error</span>
      </div>
      <p class="text-red-300 text-sm font-serif italic">${escapeHtml(msg)}</p>
    </div>`;
  }
}

// ── Event handlers ─────────────────────────────────────

// Power button
powerBtn.addEventListener("click", () => {
  if (state === "off") {
    powerOn();
  } else if (state === "connected" || state === "streaming") {
    powerOff();
  }
});

// New World button
btnNewWorld.addEventListener("click", () => {
  newWorld();
});

// Form submit (textarea)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = input.value.trim();
  const image = attachedImage;

  // Need either text or image to submit
  if (!val && !image) return;
  input.value = "";
  clearAttachedImage();

  if (state === "off") {
    powerOn().then(() => {
      const check = setInterval(() => {
        if (state === "connected") {
          clearInterval(check);
          startWorld(val, image || undefined);
        } else if (state === "off") {
          clearInterval(check);
        }
      }, 100);
    });
  } else if (state === "connected") {
    startWorld(val, image || undefined);
  } else if (state === "streaming") {
    if (val) interactWorld(val);
  }
});

// Enter to submit, Shift+Enter for newline
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Escape = power off, Enter = power on when off
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state !== "off") {
    powerOff();
  }
  if (e.key === "Enter" && state === "off") {
    powerOn();
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  try {
    odyssey.disconnect();
  } catch {
    // ignore
  }
});
