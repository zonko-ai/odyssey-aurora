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
const crtScreen = document.getElementById("crt-screen") as HTMLDivElement;
const ambientGlow = document.getElementById("ambient-glow") as HTMLDivElement;
const hudBar = document.getElementById("hud-bar") as HTMLDivElement;
const hudOverlay = document.getElementById("hud-overlay") as HTMLDivElement;
const hudDuration = document.getElementById("hud-duration") as HTMLSpanElement;
const hudFps = document.getElementById("hud-fps") as HTMLSpanElement;
const engineStatusDot = document.getElementById("engine-status-dot") as HTMLSpanElement;
const engineStatusText = document.getElementById("engine-status-text") as HTMLSpanElement;
const powerHint = document.getElementById("power-hint") as HTMLDivElement;
const btnMic = document.getElementById("btn-mic") as HTMLButtonElement;
const micIcon = document.getElementById("mic-icon") as HTMLElement;
const btnNarrator = document.getElementById("btn-narrator") as HTMLButtonElement;
const narratorIcon = document.getElementById("narrator-icon") as HTMLElement;
const voiceTranscript = document.getElementById("voice-transcript") as HTMLDivElement;
const voiceStatus = document.getElementById("voice-status") as HTMLDivElement;
const voiceStatusText = document.getElementById("voice-status-text") as HTMLSpanElement;
const voiceWaveform = document.getElementById("voice-waveform") as HTMLCanvasElement;
const micLabel = document.getElementById("mic-label") as HTMLSpanElement;
const bootLines = document.getElementById("boot-lines") as HTMLDivElement;
const bootTerminal = document.getElementById("boot-terminal") as HTMLDivElement;
const examplePromptBtn = document.getElementById("example-prompt-btn") as HTMLButtonElement;

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

// ── Voice & Narrator state ──────────────────────────
let voiceMode = false;
let narratorEnabled = false;
let isListening = false;
let currentAudio: HTMLAudioElement | null = null;

// ── ElevenLabs config ───────────────────────────────
const ELEVENLABS_API_KEY = (import.meta.env.VITE_ELEVENLABS_API_KEY as string)?.trim() || "";
const ELEVENLABS_VOICE_ID = "OtEfb2LVzIE45wdYe54M";

// ── Deepgram STT setup ──────────────────────────────
const DEEPGRAM_API_KEY = (import.meta.env.VITE_DEEPGRAM_API_KEY as string)?.trim() || "";
let dgSocket: WebSocket | null = null;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

// ── Voice input debounce ────────────────────────────
let voiceDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingVoiceTranscript = "";

// ── Web Audio API (waveform visualizer) ─────────────
let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let waveformRaf: number | null = null;

// ── Ambient sound ───────────────────────────────────
let ambientHumGain: GainNode | null = null;
let ambientHumOsc: OscillatorNode | null = null;
let sfxCtx: AudioContext | null = null;

// ── Example prompts rotation ────────────────────────
const EXAMPLE_PROMPTS = [
  "A medieval castle at sunset with torches flickering\u2026",
  "An underwater city glowing with bioluminescent coral\u2026",
  "A cozy mountain cabin during a heavy snowstorm\u2026",
  "A neon-lit Tokyo alley at midnight in the rain\u2026",
  "An ancient Roman colosseum during a gladiator battle\u2026",
  "A peaceful zen garden with cherry blossoms falling\u2026",
];
let exampleRotationInterval: ReturnType<typeof setInterval> | null = null;
let currentExampleIndex = 0;

// ── Boot sequence tracking ──────────────────────────
let bootSequenceRunning = false;

function startDeepgram() {
  if (!DEEPGRAM_API_KEY) {
    flashError("Deepgram API key not configured.");
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    mediaStream = stream;

    // Set up Web Audio analyser for waveform visualizer
    setupAudioAnalyser(stream);
    startWaveform();
    setVoiceStatus("listening");

    const url = `wss://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&interim_results=true&utterance_end_ms=1500&vad_events=true`;
    dgSocket = new WebSocket(url, ["token", DEEPGRAM_API_KEY]);

    dgSocket.onopen = () => {
      isListening = true;
      updateMicUI();

      // Stream audio via MediaRecorder
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && dgSocket?.readyState === WebSocket.OPEN) {
          dgSocket.send(e.data);
        }
      };
      mediaRecorder.start(250); // send chunks every 250ms
    };

    dgSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "Results") {
        const transcript = data.channel?.alternatives?.[0]?.transcript || "";
        if (!transcript) {
          // No speech detected — show listening
          setVoiceStatus("listening");
          return;
        }

        // Show live preview for all transcripts
        voiceTranscript.textContent = transcript;
        voiceTranscript.classList.remove("hidden");
        setVoiceStatus("transmitting", transcript);

        if (data.is_final && data.speech_final) {
          // User stopped speaking — accumulate and debounce 2s before sending
          pendingVoiceTranscript = (pendingVoiceTranscript ? pendingVoiceTranscript + " " : "") + transcript.trim();
          if (voiceDebounceTimer) clearTimeout(voiceDebounceTimer);
          voiceDebounceTimer = setTimeout(() => {
            const final = pendingVoiceTranscript.trim();
            pendingVoiceTranscript = "";
            voiceDebounceTimer = null;
            voiceTranscript.classList.add("hidden");
            voiceTranscript.textContent = "";
            setVoiceStatus("listening");
            if (final) handleVoiceInput(final);
          }, 2000);
        }
      } else if (data.type === "UtteranceEnd") {
        // Utterance boundary — don't clear if debounce pending
        if (!voiceDebounceTimer) {
          voiceTranscript.classList.add("hidden");
          setVoiceStatus("listening");
        }
      }
    };

    dgSocket.onerror = () => {
      flashError("Deepgram connection error.");
      stopDeepgram();
    };

    dgSocket.onclose = () => {
      isListening = false;
      if (voiceMode && (state === "connected" || state === "streaming")) {
        // Auto-reconnect if voice mode is still on
        setTimeout(() => { if (voiceMode) startDeepgram(); }, 500);
      } else {
        updateMicUI();
      }
    };
  }).catch((err) => {
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      flashError("Microphone access denied. Check browser permissions.");
    } else {
      flashError("Could not access microphone.");
    }
    voiceMode = false;
    updateMicUI();
  });
}

function stopDeepgram() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  mediaRecorder = null;

  if (dgSocket && dgSocket.readyState === WebSocket.OPEN) {
    // Send close signal to Deepgram
    dgSocket.send(JSON.stringify({ type: "CloseStream" }));
    dgSocket.close();
  }
  dgSocket = null;

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }

  isListening = false;
  if (voiceDebounceTimer) { clearTimeout(voiceDebounceTimer); voiceDebounceTimer = null; }
  pendingVoiceTranscript = "";
  stopWaveform();
  setVoiceStatus("hidden");
}

// ── Web Audio waveform visualizer ───────────────────
function setupAudioAnalyser(stream: MediaStream) {
  audioCtx = new AudioContext();
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 64;
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyserNode);
}

function drawWaveform() {
  if (!analyserNode || !voiceWaveform) return;

  const ctx = voiceWaveform.getContext("2d");
  if (!ctx) return;

  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(dataArray);

  const w = voiceWaveform.width;
  const h = voiceWaveform.height;
  ctx.clearRect(0, 0, w, h);

  const barCount = 7;
  const barWidth = Math.max(3, Math.floor(w / (barCount * 3)));
  const gap = barWidth;
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;
  const startX = (w - totalWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    // Sample from spread-out frequency bins
    const binIndex = Math.floor((i / barCount) * (dataArray.length * 0.6));
    const value = dataArray[binIndex] / 255;
    const barHeight = Math.max(2, value * (h - 4));

    const x = startX + i * (barWidth + gap);
    const y = (h - barHeight) / 2;

    ctx.fillStyle = `rgba(245, 158, 11, ${0.5 + value * 0.5})`;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barWidth, barHeight, 1);
    } else {
      ctx.rect(x, y, barWidth, barHeight);
    }
    ctx.fill();
  }

  waveformRaf = requestAnimationFrame(drawWaveform);
}

function startWaveform() {
  voiceWaveform.classList.remove("hidden");
  voiceWaveform.width = voiceWaveform.offsetWidth || 400;
  waveformRaf = requestAnimationFrame(drawWaveform);
}

function stopWaveform() {
  if (waveformRaf !== null) {
    cancelAnimationFrame(waveformRaf);
    waveformRaf = null;
  }
  voiceWaveform.classList.add("hidden");
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
    analyserNode = null;
  }
}

// ── Voice status HUD ────────────────────────────────
function setVoiceStatus(mode: "listening" | "transmitting" | "standby" | "hidden", detail?: string) {
  if (mode === "hidden") {
    voiceStatus.classList.add("hidden");
    return;
  }

  voiceStatus.classList.remove("hidden", "listening", "transmitting", "standby");
  voiceStatus.classList.add(mode);

  switch (mode) {
    case "listening":
      voiceStatusText.textContent = "LISTENING";
      break;
    case "transmitting":
      voiceStatusText.textContent = detail ? `TRANSMITTING \u2014 ${detail}` : "TRANSMITTING";
      break;
    case "standby":
      voiceStatusText.textContent = detail ? `STANDBY [${detail}]` : "STANDBY";
      break;
  }
}

// ── Typewriter effect ───────────────────────────────
async function typewriterEffect(element: HTMLElement, text: string, speed: number = 25): Promise<void> {
  element.textContent = "";
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.textContent = "|";
  element.appendChild(cursor);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    element.textContent = text;
    return;
  }

  for (let i = 0; i < text.length; i++) {
    // Insert character before the cursor
    cursor.before(text[i]);
    await new Promise((r) => setTimeout(r, speed));
  }

  // Remove cursor after typing completes
  cursor.remove();
}

// ── Boot sequence ───────────────────────────────────
async function runBootSequence(): Promise<void> {
  bootSequenceRunning = true;
  bootLines.innerHTML = "";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lines: { text: string; delay: number; check?: boolean; checkDelay?: number }[] = [
    { text: "> GENESIS REALITY ENGINE v2.0", delay: 300 },
    { text: "> Authenticating operator...", delay: 600, check: true, checkDelay: 800 },
    { text: "> Establishing quantum link...", delay: 400, check: true, checkDelay: 1200 },
    { text: "> Reality buffer allocated", delay: 600 },
    { text: "> Neural bridge online", delay: 400 },
    { text: "> AWAITING FIRST COMMAND _", delay: 300 },
  ];

  for (const line of lines) {
    if (!bootSequenceRunning) return;
    await new Promise((r) => setTimeout(r, line.delay));
    if (!bootSequenceRunning) return;

    const lineEl = document.createElement("div");
    bootLines.appendChild(lineEl);

    if (prefersReducedMotion) {
      lineEl.textContent = line.text;
      if (line.check) {
        const checkSpan = document.createElement("span");
        checkSpan.className = "boot-check";
        checkSpan.textContent = " \u2713";
        lineEl.appendChild(checkSpan);
      }
    } else {
      // Type out character by character
      for (let i = 0; i < line.text.length; i++) {
        if (!bootSequenceRunning) return;
        lineEl.textContent += line.text[i];
        await new Promise((r) => setTimeout(r, 30));
      }

      // If this line gets a checkmark, add it after a delay
      if (line.check && line.checkDelay) {
        await new Promise((r) => setTimeout(r, line.checkDelay));
        if (!bootSequenceRunning) return;
        const checkSpan = document.createElement("span");
        checkSpan.className = "boot-check";
        checkSpan.textContent = " \u2713";
        lineEl.appendChild(checkSpan);
      }
    }

    // Add blinking cursor to last line
    if (line === lines[lines.length - 1]) {
      const cursorSpan = document.createElement("span");
      cursorSpan.className = "boot-cursor";
      cursorSpan.textContent = "";
      lineEl.appendChild(cursorSpan);
    }
  }

  bootSequenceRunning = false;
}

function clearBootTerminal() {
  bootSequenceRunning = false;
  bootLines.innerHTML = "";
}

// ── Example prompts rotation ────────────────────────
function startExampleRotation() {
  currentExampleIndex = 0;
  examplePromptBtn.textContent = EXAMPLE_PROMPTS[0];
  examplePromptBtn.style.opacity = "1";

  exampleRotationInterval = setInterval(() => {
    // Fade out
    examplePromptBtn.style.opacity = "0";

    setTimeout(() => {
      currentExampleIndex = (currentExampleIndex + 1) % EXAMPLE_PROMPTS.length;
      examplePromptBtn.textContent = EXAMPLE_PROMPTS[currentExampleIndex];
      // Fade in
      examplePromptBtn.style.opacity = "1";
    }, 500);
  }, 4000);
}

function stopExampleRotation() {
  if (exampleRotationInterval !== null) {
    clearInterval(exampleRotationInterval);
    exampleRotationInterval = null;
  }
}

// ── Ambient sound cues ──────────────────────────────
function ensureSfxCtx() {
  if (!sfxCtx) sfxCtx = new AudioContext();
  return sfxCtx;
}

/** Soft analog click — short filtered noise burst */
function playClick() {
  const ctx = ensureSfxCtx();
  const bufferSize = Math.floor(ctx.sampleRate * 0.03); // 30ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Decaying noise burst
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

/** Low ambient hum — fades in when connected */
function startAmbientHum() {
  const ctx = ensureSfxCtx();
  if (ambientHumOsc) return; // already running

  ambientHumOsc = ctx.createOscillator();
  ambientHumOsc.type = "sine";
  ambientHumOsc.frequency.value = 60; // 60Hz mains hum

  ambientHumGain = ctx.createGain();
  ambientHumGain.gain.value = 0;
  ambientHumGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);

  ambientHumOsc.connect(ambientHumGain).connect(ctx.destination);
  ambientHumOsc.start();
}

function stopAmbientHum() {
  if (ambientHumGain && sfxCtx) {
    ambientHumGain.gain.linearRampToValueAtTime(0, sfxCtx.currentTime + 0.5);
    const osc = ambientHumOsc;
    setTimeout(() => { osc?.stop(); }, 600);
  }
  ambientHumOsc = null;
  ambientHumGain = null;
}

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
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 0 },
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
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 0 },
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

// ── Voice helpers ───────────────────────────────────
function updateMicUI() {
  if (voiceMode) {
    micIcon.setAttribute("icon", "lucide:mic-off");
    btnMic.classList.add("voice-active");
    micLabel.textContent = "LIVE";
    micLabel.classList.remove("hidden");
  } else {
    micIcon.setAttribute("icon", "lucide:mic");
    btnMic.classList.remove("voice-active");
    micLabel.textContent = "MIC";
    micLabel.classList.add("hidden");
    voiceTranscript.classList.add("hidden");
    voiceTranscript.textContent = "";
    setVoiceStatus("hidden");
  }
}

function toggleVoice() {
  if (!DEEPGRAM_API_KEY) {
    flashError("Deepgram API key not configured.");
    return;
  }
  voiceMode = !voiceMode;
  if (voiceMode) {
    // Stop narrator if playing to avoid feedback
    stopNarratorAudio();
    startDeepgram();
  } else {
    stopDeepgram();
  }
  updateMicUI();
}

function handleVoiceInput(transcript: string) {
  // Stop narrator audio if playing (user is speaking)
  stopNarratorAudio();

  if (state === "connected") {
    startWorld(transcript);
  } else if (state === "streaming") {
    interactWorld(transcript);
  }
}

// ── Narrator helpers ────────────────────────────────
function toggleNarrator() {
  narratorEnabled = !narratorEnabled;
  narratorIcon.setAttribute("icon", narratorEnabled ? "lucide:volume-2" : "lucide:volume-off");
  btnNarrator.classList.toggle("text-amber-400", narratorEnabled);
  btnNarrator.classList.toggle("text-zinc-500", !narratorEnabled);
  if (!narratorEnabled) stopNarratorAudio();
}

function stopNarratorAudio() {
  if (currentAudio) {
    currentAudio.pause();
    URL.revokeObjectURL(currentAudio.src);
    currentAudio = null;
  }
  speechSynthesis.cancel();
}

const NARRATOR_SYSTEM_PROMPT = `You are the Narrator, a cinematic voice describing an unfolding AI-generated world.
Write ONE vivid sentence (10-25 words) describing what is happening or about to happen.
Be poetic, dramatic, and present-tense. Sound like a nature documentary or film narrator.
Never use meta-language. Never mention AI, simulation, or generation.
Output ONLY the narration sentence. No quotes, no explanation.`;

async function generateNarration(context: string): Promise<string> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
      config: {
        systemInstruction: NARRATOR_SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text?.trim() || "";
  } catch {
    return "";
  }
}

async function speakNarration(text: string, messageWrapper?: HTMLDivElement): Promise<void> {
  stopNarratorAudio();

  // Find the narrator-message element to add playing state
  const narratorMsgEl = messageWrapper?.querySelector(".narrator-message") as HTMLElement | null;

  function setPlaying() {
    narratorMsgEl?.classList.add("narrator-playing");
  }
  function clearPlaying() {
    narratorMsgEl?.classList.remove("narrator-playing");
  }

  if (ELEVENLABS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.3, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true },
          }),
        }
      );
      if (!response.ok) throw new Error("ElevenLabs API error");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.playbackRate = 0.95;
      setPlaying();
      currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; clearPlaying(); };
      currentAudio.play();
      return;
    } catch {
      // Fall through to Web Speech
    }
  }

  // Fallback: Web Speech Synthesis
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 0.9;
  setPlaying();
  u.onend = () => clearPlaying();
  speechSynthesis.speak(u);
}

async function narrateAction(context: string) {
  if (!narratorEnabled) return;
  const narration = await generateNarration(context);
  if (!narration || !narratorEnabled) return;
  const wrapper = addChatMessage("narrator", narration);
  speakNarration(narration, wrapper);
}

// ── Chat history ───────────────────────────────────────
function addChatMessage(
  role: "director" | "engine" | "system" | "narrator",
  text: string,
  opts?: { loading?: boolean; hasImage?: boolean }
) {
  const spacer = chatHistory.querySelector(".h-2:last-child");
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-2 transition-all duration-300 opacity-0 translate-y-2";

  const imageTag = opts?.hasImage
    ? `<span class="text-orange-400/60 text-[10px] font-sans tracking-widest uppercase ml-2">+ image</span>`
    : "";

  // Determine typewriter speed based on role (0 = instant)
  let typeSpeed = 0;
  if (role === "system") typeSpeed = 20;
  else if (role === "narrator") typeSpeed = 25;
  else if (role === "engine" && !opts?.loading) typeSpeed = 15;

  if (role === "system") {
    wrapper.innerHTML = `<div class="flex flex-col gap-1">
      <div class="text-zinc-500 text-xs italic" data-typewriter></div>
    </div>`;
  } else if (role === "director") {
    wrapper.innerHTML = `<div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 text-zinc-500">
        <iconify-icon icon="lucide:user" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">Director</span>${imageTag}
      </div>
      <p class="text-sm leading-relaxed text-zinc-300 font-serif">"${escapeHtml(text)}"</p>
    </div>`;
  } else if (role === "narrator") {
    wrapper.innerHTML = `<div class="flex flex-col gap-2 narrator-message">
      <div class="flex items-center gap-2 narrator-label">
        <iconify-icon icon="lucide:audio-lines" class="text-[10px]"></iconify-icon>
        <span class="text-[10px] tracking-widest uppercase">Narrator</span>
        <span class="narrator-bars"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span>
      </div>
      <p class="narrator-text text-sm font-serif" data-typewriter></p>
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
      <p class="text-zinc-400 text-sm font-serif italic" data-typewriter></p>
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

  // Apply typewriter effect if applicable
  if (typeSpeed > 0) {
    const target = wrapper.querySelector("[data-typewriter]") as HTMLElement | null;
    if (target) {
      typewriterEffect(target, text, typeSpeed).then(() => {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
      });
    }
  } else {
    // Instant text for director and loading engine messages
    const target = wrapper.querySelector("[data-typewriter]") as HTMLElement | null;
    if (target) {
      target.textContent = text;
    }
  }

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
      screenBoot.style.pointerEvents = "none";
      clearBootTerminal();
      crtScreen.classList.remove("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0";
      hudBar.style.opacity = "0";
      hudOverlay.style.opacity = "0";
      video.style.opacity = "0";
      video.srcObject = null;
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      btnMic.disabled = true;
      // Stop voice if active
      if (voiceMode) { voiceMode = false; stopDeepgram(); updateMicUI(); }
      stopNarratorAudio();
      stopDurationTimer();
      stopFpsCounter();
      clearAttachedImage();
      stopExampleRotation();
      stopAmbientHum();
      playClick();
      break;

    case "connecting":
      setLed("amber", true);
      setEngineStatus("Connecting\u2026", "amber");
      playClick();
      screenContent.style.opacity = "0";
      screenIdle.style.opacity = "0";
      screenBoot.style.opacity = "1";
      screenBoot.style.pointerEvents = "auto";
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0.3";
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      btnMic.disabled = true;
      stopExampleRotation();
      break;

    case "connected":
      setLed("green");
      setEngineStatus("Connected", "green");
      screenContent.style.opacity = "1";
      screenIdle.style.opacity = "1";
      screenBoot.style.opacity = "0";
      screenBoot.style.pointerEvents = "none";
      clearBootTerminal();
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "0.5";
      hudBar.style.opacity = "0";
      hudOverlay.style.opacity = "0";
      video.style.opacity = "0";
      input.disabled = false;
      btnExecute.disabled = false;
      btnAttach.disabled = false;
      btnMic.disabled = false;
      input.focus();
      startExampleRotation();
      startAmbientHum();
      break;

    case "streaming":
      setLed("green");
      setEngineStatus("Streaming", "green");
      screenContent.style.opacity = "1";
      screenIdle.style.opacity = "0";
      screenBoot.style.opacity = "0";
      screenBoot.style.pointerEvents = "none";
      crtScreen.classList.add("scanlines", "screen-flicker");
      ambientGlow.style.opacity = "1";
      video.style.opacity = "1";
      hudBar.style.opacity = "1";
      hudOverlay.style.opacity = "1";
      input.disabled = false;
      btnExecute.disabled = false;
      btnAttach.disabled = true; // image only for initial stream
      btnMic.disabled = false;
      input.focus();
      startDurationTimer();
      startFpsCounter();
      stopExampleRotation();
      break;

    case "stopping":
      setLed("amber", true);
      setEngineStatus("Shutting down\u2026", "amber");
      input.disabled = true;
      btnExecute.disabled = true;
      btnAttach.disabled = true;
      btnMic.disabled = true;
      if (voiceMode) { voiceMode = false; stopDeepgram(); updateMicUI(); }
      stopNarratorAudio();
      stopDurationTimer();
      stopFpsCounter();
      stopExampleRotation();
      stopAmbientHum();
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
  addChatMessage("system", "Initializing connection\u2026");

  // Run boot sequence visually in parallel with actual connection
  const bootPromise = runBootSequence();

  try {
    const connectedStream = await odyssey.connect({
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
          authenticating: { text: "Authenticating\u2026", color: "amber" },
          connecting: { text: "Connecting\u2026", color: "amber" },
          reconnecting: { text: "Reconnecting\u2026", color: "amber" },
          connected: { text: "Connected", color: "green" },
          disconnected: { text: "Disconnected", color: "red" },
          failed: { text: "Failed", color: "red" },
        };
        const s = statusMap[status];
        if (s) {
          setEngineStatus(s.text, s.color);
          if (s.color === "amber") setLed("amber", true);
        }
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

    video.srcObject = connectedStream;

    // Wait for boot sequence to finish if still running, then transition
    if (bootSequenceRunning) {
      await bootPromise;
      // Small grace period so the last boot line is visible
      await new Promise((r) => setTimeout(r, 600));
    }

    setState("connected");
    addChatMessage("system", "Connected. Describe a world or attach an image to begin.");
  } catch (err: unknown) {
    clearBootTerminal();
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
  console.log("[genesis] world raw:", rawPrompt);
  console.log("[genesis] world refined:", prompt);

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
    narrateAction(`A new world materializes: ${rawPrompt}`);
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
  console.log("[genesis] interact raw:", rawPrompt);
  console.log("[genesis] interact refined:", prompt);

  pendingInteracts.set(prompt, loadingMsg);

  try {
    await odyssey.interact({ prompt });
    if (pendingInteracts.has(prompt)) {
      pendingInteracts.delete(prompt);
      markAcknowledged(loadingMsg);
    }
    narrateAction(`The world shifts: ${rawPrompt}`);
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

// Mic toggle
btnMic.addEventListener("click", () => {
  toggleVoice();
});

// Narrator toggle
btnNarrator.addEventListener("click", () => {
  toggleNarrator();
});

// Example prompt click — fill textarea and focus
examplePromptBtn.addEventListener("click", () => {
  const text = examplePromptBtn.textContent?.trim();
  if (text) {
    input.value = text;
    input.focus();
  }
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

// Paste image from clipboard
input.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) {
        flashError("Image must be under 25MB.");
        return;
      }
      attachedImage = file;
      imageThumb.src = URL.createObjectURL(file);
      imagePreview.classList.remove("hidden");
      return;
    }
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
