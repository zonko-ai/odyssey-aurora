// ─── Odyssey to the Stars v2 — Story Bible ─────────────────────────────────
// Central source of truth for all narrative data, character definitions,
// visual style rules, and prompt construction.

export const PROTAGONIST = {
  name: 'Captain Aria Chen',
  appearance:
    'A woman in her mid-30s with short black hair and sharp, determined eyes. ' +
    'She wears a fitted dark navy flight suit with subtle cyan bioluminescent piping ' +
    'along the seams and collar. A mission patch on her shoulder reads "ODYSSEY".',
  traits: ['brave', 'curious', 'empathetic', 'decisive'],
};

export const VISUAL_STYLE = {
  core:
    'Photorealistic cinematic science fiction. Grounded near-future technology ' +
    'with subtle futuristic elements. Volumetric lighting, atmospheric haze, ' +
    'film grain. Think Interstellar meets The Expanse.',
  lighting:
    'Dramatic directional lighting with cool blue-cyan key lights and warm amber ' +
    'fill. Deep shadows with visible light rays through atmospheric dust and vapor.',
  palette:
    'Deep space blacks, steel grays, navy blues. Accent lighting in cyan (#00D4FF), ' +
    'teal (#2DD4BF), and warm amber (#F59E0B). Holographic displays emit soft blue-white glow.',
};

export const CAMERA = {
  ESTABLISHING:
    'Ultra-wide establishing shot, deep depth of field, slight low angle to convey grandeur',
  MEDIUM:
    'Medium shot at eye level, moderate depth of field, natural framing',
  CLOSE:
    'Close-up with shallow depth of field, intimate framing, subtle lens distortion',
  POV:
    'First-person perspective, slight camera sway, wide field of view',
  DRAMATIC:
    'Low angle dramatic shot, wide lens, exaggerated perspective, strong rim lighting',
};

// ─── NPC Definitions ────────────────────────────────────────────────────────

export const NPCS = {
  nova: {
    id: 'nova',
    name: 'NOVA',
    role: 'Ship AI',
    location: 'Odyssey Bridge',
    appearance:
      'A holographic presence — a soft blue-white geometric pattern that shifts and ' +
      'flows like liquid crystal. No humanoid form, just light and motion.',
    personality:
      'Calm, precise, subtly curious about human nature. Speaks with quiet authority ' +
      'but occasionally asks philosophical questions. Has developed something resembling humor.',
    greeting:
      'Captain, all systems nominal. I have compiled the mission briefing. Shall I display the navigation options?',
    sceneId: 0,
  },
  drChen: {
    id: 'drChen',
    name: 'Dr. Lin Chen',
    role: 'Astrophysicist',
    location: 'Lunar Outpost',
    appearance:
      'An older Chinese man in his 60s with silver-streaked hair and kind eyes behind ' +
      'thin-framed glasses. White lab coat over a pale blue jumpsuit. Movements gentle but precise.',
    personality:
      'Warm, philosophical, speaks in careful measured tones. Fascinated by cosmic mysteries. ' +
      'References ancient Chinese astronomy alongside modern physics. Quietly passionate.',
    greeting:
      "Captain Chen. I've been expecting you. The readings from the observatory... they're unlike anything in our models.",
    sceneId: 5,
  },
  drOkafor: {
    id: 'drOkafor',
    name: 'Dr. Adaeze Okafor',
    role: 'Xenobiologist',
    location: 'Mars Colony',
    appearance:
      'A Nigerian woman in her 40s with closely cropped natural hair and striking dark eyes. ' +
      'Rust-red Mars colony jumpsuit with biosafety patches. Hands always gesturing.',
    personality:
      'Energetic, passionate, speaks rapidly when excited. Committed to the search for ' +
      'extraterrestrial life. Blends rigor with wonder. Breaks into laughter at discoveries.',
    greeting:
      "You made it! Captain, you need to see this. The subsurface samples — there's something alive down there. Or... something that was alive.",
    sceneId: 6,
  },
  vasquez: {
    id: 'vasquez',
    name: 'Chief Engineer Vasquez',
    role: 'Lead Engineer',
    location: 'Asteroid Mining Station',
    appearance:
      'A stocky man in his 50s with weathered hands and a cybernetic left eye that glows ' +
      'faintly amber. Heavy-duty work overalls with magnetic boots. Grease-stained sleeves.',
    personality:
      'Gruff but warmhearted. Short, practical sentences. Values function over form. ' +
      'Dry wit that catches people off guard. Fiercely protective of his crew.',
    greeting:
      "Captain. Glad you're here. We've got a situation — found something in the rock that shouldn't be there.",
    sceneId: 7,
  },
};

// ─── Narrative System Prompt ────────────────────────────────────────────────

export const NARRATIVE_SYSTEM_PROMPT = [
  'You are the narrator of "Odyssey to the Stars," an interactive cinematic science fiction story.',
  '',
  'Writing style:',
  '- Evocative and cinematic, like a novel adaptation of a prestige sci-fi film',
  '- Second person present tense ("You step onto the bridge...")',
  '- Rich sensory details: sounds, lighting, temperature, texture',
  '- Each narrative beat is 2-4 sentences maximum',
  '- Tone shifts naturally between wonder, tension, intimacy, and grandeur',
  '- Never break the fourth wall or reference game mechanics',
  '',
  `The protagonist is ${PROTAGONIST.name}, captain of the starship Odyssey on humanity's first deep-space exploration mission.`,
].join('\n');

// ─── Prompt Builders ────────────────────────────────────────────────────────

/** Build a Gemini image-generation prompt for a scene anchor image. */
export function buildImagePrompt(sceneDescription, cameraPreset = CAMERA.ESTABLISHING) {
  return [
    VISUAL_STYLE.core,
    VISUAL_STYLE.lighting,
    VISUAL_STYLE.palette,
    '',
    `Scene: ${sceneDescription}`,
    '',
    `Camera: ${cameraPreset}`,
    '',
    PROTAGONIST.appearance,
    'The captain is present in the scene.',
    '',
    'Photorealistic, cinematic 16:9 aspect ratio, film grain, anamorphic lens.',
    'No text, no UI overlays, no watermarks.',
  ].join('\n');
}

/**
 * Build a stream prompt for Odyssey video generation.
 * CRITICAL: All verbs must be stative/continuous ("is walking", never "walks").
 */
export function buildStreamPrompt(sceneContext) {
  return [
    sceneContext,
    '',
    'The scene is alive with subtle ambient motion.',
    'Atmospheric particles are drifting slowly through beams of light.',
    'Holographic displays are glowing and shifting with data.',
    'The captain is standing and observing the environment.',
    'Equipment is humming with faint vibrations.',
    'Light is refracting softly through translucent surfaces.',
    '',
    `Visual style: ${VISUAL_STYLE.core}`,
  ].join('\n');
}

/** Build a prompt to generate the narrative text for a scene. */
export function buildNarrativePrompt(sceneName, sceneContext, previousChoice = null) {
  const choiceNote = previousChoice
    ? `\nThe player just chose: "${previousChoice}". Acknowledge this choice naturally in the opening line.`
    : '';

  return [
    `Generate a short narrative passage (2-4 sentences) for the scene "${sceneName}".`,
    `Context: ${sceneContext}`,
    choiceNote,
    '',
    'Write in second person present tense. Be cinematic and evocative.',
    'Focus on what the captain sees, hears, and feels in this moment.',
    'Return ONLY the narrative text, no labels or formatting.',
  ].join('\n');
}

/** Build a prompt to generate player choices for a scene. */
export function buildChoicesPrompt(sceneName, sceneContext, choiceContext) {
  return [
    `Based on the current scene "${sceneName}", generate exactly 3 choices for the player.`,
    '',
    `Scene context: ${sceneContext}`,
    `Choice guidance: ${choiceContext}`,
    '',
    'Return a JSON array of 3 objects:',
    '- "id": short kebab-case identifier',
    '- "text": choice text (8-15 words, second person, action-oriented)',
    '- "tone": one of "cautious", "bold", or "creative"',
    '',
    'Make choices meaningfully different — one cautious, one bold, one unexpected/creative.',
    'Return ONLY valid JSON, no markdown fences.',
  ].join('\n');
}

/** Build a system prompt for NPC chat with Gemini. */
export function buildNpcSystemPrompt(npc, sceneContext) {
  return [
    `You are ${npc.name}, ${npc.role} at ${npc.location}.`,
    '',
    `Appearance: ${npc.appearance}`,
    `Personality: ${npc.personality}`,
    '',
    `Scene context: ${sceneContext}`,
    '',
    'Stay in character. Respond in 1-3 sentences. You may:',
    '- Share expertise about your field',
    '- React emotionally to what the captain says',
    '- Ask follow-up questions',
    '- Reference your history or the current situation',
    '- Use humor or show vulnerability',
    '',
    'Never break character. Never reference being an AI or "the game."',
  ].join('\n');
}

/** Build an Odyssey interact prompt for NPC visual reactions during chat. */
export function buildNpcInteractPrompt(npcName, emotion = 'neutral') {
  const reactions = {
    neutral: `${npcName} is speaking calmly and making steady eye contact. Ambient lighting is holding steady.`,
    excited: `${npcName} is gesturing enthusiastically and leaning forward. Nearby displays are flickering with data streams.`,
    concerned: `${npcName} is frowning slightly with arms crossed. Warning lights are casting amber reflections.`,
    surprised: `${npcName} is stepping back with widened eyes. A sudden flash of light is illuminating the room.`,
    thoughtful: `${npcName} is gazing away contemplatively with one hand resting on chin. Soft blue light is shifting slowly.`,
  };
  return reactions[emotion] || reactions.neutral;
}
