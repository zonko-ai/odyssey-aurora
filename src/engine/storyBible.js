// ─── Piper — Story Bible ──────────────────────────────────────────────────────
// Central source of truth for all narrative data, visual style rules,
// and prompt construction. Inspired by Pixar's "Piper" short film.

export const PROTAGONIST = {
  name: 'Piper',
  appearance:
    'A tiny baby sandpiper bird with fluffy grey-white downy feathers, large dark expressive eyes, ' +
    'and thin orange legs. Small and round, about the size of a tennis ball. Adorable and vulnerable.',
  traits: ['curious', 'timid', 'determined', 'joyful'],
};

export const VISUAL_STYLE = {
  core:
    'Photorealistic Pixar-quality nature cinematography. Shallow depth of field, ' +
    'golden-hour coastal lighting, macro details on sand grains and water droplets. ' +
    'Think BBC Planet Earth meets Pixar — hyperreal natural beauty.',
  lighting:
    'Warm golden sunlight from a low angle. Rim lighting on feathers and water spray. ' +
    'Soft shadows on sand. Lens flares through water droplets. Dawn-to-sunset arc.',
  palette:
    'Sandy beige (#D4B896), ocean teal (#2A9D8F), warm gold (#E9C46A), ' +
    'sky blue (#87CEEB), foam white (#F8F8FF), wet sand brown (#8B7355).',
};

export const CAMERA = {
  ESTABLISHING:
    'Wide establishing shot of the beach, deep depth of field, low angle near sand level',
  MEDIUM:
    'Medium shot at bird eye level, moderate depth of field, warm natural framing',
  CLOSE:
    'Extreme close-up with very shallow depth of field, macro detail on feathers and eyes',
  LOW:
    'Ultra-low angle from sand level looking up, dramatic perspective, bird towers above camera',
  UNDERWATER:
    'Underwater camera looking up through shallow crystal-clear water at the surface',
};

// ─── Narrative System Prompt ────────────────────────────────────────────────

export const NARRATIVE_SYSTEM_PROMPT = [
  'You are the narrator of "Piper," an interactive visual story inspired by the Pixar short film.',
  '',
  'Writing style:',
  '- Gentle, warm, and poetic — like a nature documentary narrated with love',
  '- Third person present tense ("Piper peers out from the grass...")',
  '- Rich sensory details: the warmth of sand, the sound of waves, the taste of salt air',
  '- Each narrative beat is 2-3 sentences maximum',
  '- Tone ranges from tender to playful to awestruck',
  '- Convey emotion through physical detail, not exposition',
  '- Never break the fourth wall',
  '',
  'The protagonist is Piper, a baby sandpiper chick experiencing the beach for the first time.',
  'The story follows her journey from fear to courage, from the safety of the nest to the wonder of the ocean.',
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
    `The baby sandpiper: ${PROTAGONIST.appearance}`,
    '',
    'Photorealistic, cinematic 16:9 aspect ratio, shallow depth of field, golden hour lighting.',
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
    'The scene is alive with gentle natural motion.',
    'Ocean waves are rolling softly in the background.',
    'Beach grass is swaying gently in the coastal breeze.',
    'Sand grains are catching the golden sunlight.',
    'Tiny bubbles are forming and popping in the wet sand.',
    '',
    `Visual style: ${VISUAL_STYLE.core}`,
  ].join('\n');
}

/** Build a prompt to generate the narrative text for a scene. */
export function buildNarrativePrompt(sceneName, sceneContext, previousChoice = null) {
  return [
    `Generate a short narrative passage (2-3 sentences) for the scene "${sceneName}".`,
    `Context: ${sceneContext}`,
    '',
    'Write in third person present tense about Piper the baby sandpiper.',
    'Be warm, gentle, and cinematic. Focus on what Piper sees, feels, and does.',
    'Convey emotion through sensory detail — sounds, textures, light.',
    'Return ONLY the narrative text, no labels or formatting.',
  ].join('\n');
}

// ─── Unused stubs (kept for engine compatibility) ───────────────────────────

export function buildChoicesPrompt() { return ''; }
export function buildNpcSystemPrompt() { return ''; }
export function buildNpcInteractPrompt() { return ''; }
