// ─── Piper — Scene Registry ──────────────────────────────────────────────────
// Defines all 12 scenes of Piper's journey from nest to sunset.
// Pure linear flow — no branching, no choices, just "Next" to advance.

import { CAMERA } from './storyBible.js';

const SCENES = [
  // ── 0: The Nest ────────────────────────────────────────────────────────────
  {
    id: 0,
    name: 'The Nest',
    subtitle: 'Dawn on the Shore',
    anchorImagePrompt:
      'A tiny baby sandpiper chick is nestled in a cozy nest hidden among beach dune grass. ' +
      'Soft dawn light is filtering through the grass blades, casting warm golden stripes across ' +
      'the nest. The chick has fluffy grey-white down feathers and large dark eyes, still sleepy. ' +
      'Dew drops cling to the grass. The ocean is a soft blur in the distant background.',
    streamContext:
      'A tiny sandpiper chick is nestled in a nest among dune grass. Dawn light is filtering ' +
      'through the grass blades in warm golden stripes. Dew drops are glistening on the grass tips. ' +
      'The chick is stirring gently, its fluffy feathers are ruffling in a soft breeze. ' +
      'The distant ocean is murmuring quietly.',
    narrativeContext:
      'Dawn breaks over a quiet beach. In a nest tucked among the dune grass, a tiny sandpiper ' +
      'chick named Piper is waking for the first time. The world outside the nest is enormous — ' +
      'she can hear the ocean breathing.',
    audioType: 'bridge',
    camera: CAMERA.CLOSE,
    transition: { type: 'linear', next: 1 },
  },

  // ── 1: First Light ─────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'First Light',
    subtitle: 'A World of Wonder',
    anchorImagePrompt:
      'A baby sandpiper chick is peering over the edge of its nest for the first time, eyes wide ' +
      'with wonder. Beyond the dune grass, a vast beach stretches out — golden sand meeting a ' +
      'turquoise ocean under a pale sunrise sky. Everything is enormous compared to the tiny bird. ' +
      'Morning light catches individual sand grains making them sparkle like diamonds.',
    streamContext:
      'The baby sandpiper is peering out from the dune grass with wide curious eyes. The vast ' +
      'beach is stretching out before her, golden sand is glowing in the morning light. ' +
      'The turquoise ocean is shimmering on the horizon. Individual sand grains are sparkling ' +
      'like tiny diamonds in the low sunlight. A gentle breeze is carrying salt air.',
    narrativeContext:
      'Piper peers over the edge of the nest and sees the world for the first time. The beach ' +
      'stretches endlessly, a vast landscape of golden sand and turquoise water. Every grain of ' +
      'sand catches the light. It is beautiful and impossibly big.',
    audioType: 'space',
    camera: CAMERA.LOW,
    transition: { type: 'linear', next: 2 },
  },

  // ── 2: Mother's Lesson ─────────────────────────────────────────────────────
  {
    id: 2,
    name: "Mother's Lesson",
    subtitle: 'Follow Me to the Water',
    anchorImagePrompt:
      'An adult sandpiper is demonstrating how to find food at the waters edge on a beach. ' +
      'She is probing the wet sand with her long beak as a thin sheet of water retreats. ' +
      'A tiny baby sandpiper chick watches from a few feet away on dry sand, head tilted. ' +
      'Small shells and bubbles are visible in the wet sand. Warm morning light.',
    streamContext:
      'The mother sandpiper is walking confidently along the waters edge, her beak is probing ' +
      'the wet sand expertly. A thin film of water is retreating around her feet, revealing tiny ' +
      'treasures in the sand. The baby chick is watching intently from dry sand nearby, her head ' +
      'is tilting from side to side with curiosity. Small bubbles are popping in the wet sand.',
    narrativeContext:
      'Mother leads Piper toward the water. With quick, practiced motions, she plucks tiny ' +
      'morsels from the wet sand as each wave retreats. It looks so easy — step, peck, eat. ' +
      'Piper watches her mother with rapt attention, eager to try.',
    audioType: 'space',
    camera: CAMERA.MEDIUM,
    transition: { type: 'linear', next: 3 },
  },

  // ── 3: First Steps ─────────────────────────────────────────────────────────
  {
    id: 3,
    name: 'First Steps',
    subtitle: 'Onto the Open Sand',
    anchorImagePrompt:
      'A tiny baby sandpiper chick is taking wobbly first steps onto open beach sand, leaving ' +
      'tiny footprints. The dune grass is behind her. She looks small and vulnerable on the vast ' +
      'expanse of sand. Her thin orange legs are slightly unsteady. The ocean is ahead in the ' +
      'middle distance. Low angle shot from sand level making the chick look brave.',
    streamContext:
      'The tiny sandpiper chick is taking tentative wobbly steps across open sand. Her thin ' +
      'orange legs are stepping carefully, leaving tiny perfect footprints. The dune grass is ' +
      'receding behind her. The open beach is stretching ahead, the ocean is glittering in the ' +
      'distance. A warm breeze is ruffling her downy feathers.',
    narrativeContext:
      'Piper leaves the grass and steps onto open sand. Her tiny feet sink slightly with each ' +
      'step. The beach is enormous around her — she is a small grey puff against an ocean of gold. ' +
      'But she keeps going, following the sound of the waves.',
    audioType: 'launch',
    camera: CAMERA.LOW,
    transition: { type: 'linear', next: 4 },
  },

  // ── 4: The Wave ────────────────────────────────────────────────────────────
  {
    id: 4,
    name: 'The Wave',
    subtitle: 'A Wall of Water',
    anchorImagePrompt:
      'A dramatic shot of a large ocean wave about to crash over a tiny terrified baby sandpiper ' +
      'on the beach. The wave is curling overhead, translucent green-blue water with white foam. ' +
      'The tiny bird is looking up with wide frightened eyes, feathers blown back by the wind. ' +
      'Water spray is catching the sunlight. The moment before impact.',
    streamContext:
      'A wave is building and curling toward the shore where the tiny sandpiper is standing frozen. ' +
      'The water is rising into a translucent green-blue wall with white foam forming at the crest. ' +
      'The tiny bird is looking up with wide frightened eyes. Water spray is catching the sunlight ' +
      'creating tiny rainbows. Wind from the wave is blowing her feathers back.',
    narrativeContext:
      'The ocean roars. A wave rises before Piper like a mountain of glass, curling and crashing ' +
      'down in a thundering wall of white foam. The water swallows her completely — cold, loud, ' +
      'overwhelming. When it retreats, she stands soaked and shaking.',
    audioType: 'asteroid',
    camera: CAMERA.LOW,
    transition: { type: 'linear', next: 5 },
  },

  // ── 5: Retreat ─────────────────────────────────────────────────────────────
  {
    id: 5,
    name: 'Retreat',
    subtitle: 'Back to Safety',
    anchorImagePrompt:
      'A soaking wet baby sandpiper chick is huddled in the dune grass, feathers matted and ' +
      'dripping. She looks small, cold, and scared. Her eyes are wide. The beach and ocean are ' +
      'visible through the grass blades — the waves are still rolling in the background. ' +
      'Droplets of water cling to the grass around her. Soft diffused light.',
    streamContext:
      'The wet baby sandpiper is huddled among the dune grass, shivering slightly. Her feathers ' +
      'are matted and dripping with seawater. Water droplets are clinging to the grass blades ' +
      'around her. The ocean is visible through the grass, waves are still rolling rhythmically. ' +
      'She is watching the water from this safe distance with wary eyes.',
    narrativeContext:
      'Piper runs back to the grass as fast as her tiny legs can carry her. She huddles in the ' +
      'dune grass, soaking wet, shivering. Through the grass blades she can see the ocean — ' +
      'that terrifying, beautiful thing. She is not going back out there. Not ever.',
    audioType: 'lunar',
    camera: CAMERA.CLOSE,
    transition: { type: 'linear', next: 6 },
  },

  // ── 6: Watching ────────────────────────────────────────────────────────────
  {
    id: 6,
    name: 'Watching',
    subtitle: 'The World Goes On',
    anchorImagePrompt:
      'View from behind a baby sandpiper hiding in dune grass, looking out at the beach. ' +
      'In the distance, adult sandpipers and other shorebirds are feeding confidently at the ' +
      'waters edge. Waves come and go. The adult birds dodge the water effortlessly. ' +
      'The baby bird is silhouetted against the bright beach, longing visible in her posture.',
    streamContext:
      'The baby sandpiper is watching from the dune grass. Adult sandpipers are running along ' +
      'the waters edge, feeding confidently. They are darting forward as waves retreat, then ' +
      'hopping back as new waves arrive. Other shorebirds are wading calmly. The baby is ' +
      'watching with a mixture of longing and fear, her head is tracking the adults movements.',
    narrativeContext:
      'From the safety of the grass, Piper watches the other birds. The adults dance with the ' +
      'waves like it is nothing — forward, peck, back, forward, peck, back. They are not afraid. ' +
      'Piper wants to be like them. But the memory of cold water keeps her still.',
    audioType: 'space',
    camera: CAMERA.MEDIUM,
    transition: { type: 'linear', next: 7 },
  },

  // ── 7: The Hermit Crab ─────────────────────────────────────────────────────
  {
    id: 7,
    name: 'The Hermit Crab',
    subtitle: 'A Tiny Teacher',
    anchorImagePrompt:
      'Extreme close-up of a tiny hermit crab on wet beach sand, digging down into the sand ' +
      'as a thin sheet of water approaches. A baby sandpiper chick is watching the crab from ' +
      'very close, her head tilted with intense curiosity. The crab is half-buried, bubbles ' +
      'forming around it. Macro photography style, individual sand grains visible.',
    streamContext:
      'A tiny hermit crab is scuttling across wet sand near the waters edge. As a thin sheet ' +
      'of wave water is approaching, the crab is burrowing rapidly into the sand. The baby ' +
      'sandpiper is watching from very close with intense curiosity, her head is tilted sideways. ' +
      'Bubbles are forming in the sand around the burrowing crab. Sand grains are glistening.',
    narrativeContext:
      'A flicker of movement catches Piper\'s eye. A tiny hermit crab, no bigger than her foot, ' +
      'is scuttling across the wet sand. As a wave approaches, the crab does something remarkable — ' +
      'it digs down into the sand and lets the water pass right over it.',
    audioType: 'mars',
    camera: CAMERA.CLOSE,
    transition: { type: 'linear', next: 8 },
  },

  // ── 8: Learning ────────────────────────────────────────────────────────────
  {
    id: 8,
    name: 'Learning',
    subtitle: 'Dig In, Hold On',
    anchorImagePrompt:
      'A baby sandpiper chick is crouched low on wet beach sand, pressing her body down and ' +
      'digging her feet into the sand, imitating a hermit crab. A thin sheet of wave water is ' +
      'just beginning to wash around her. She has her eyes squeezed shut with determination. ' +
      'Water is swirling gently around her small form. Golden afternoon light.',
    streamContext:
      'The baby sandpiper is crouching low on the wet sand, pressing her small body down. ' +
      'Her tiny feet are digging into the sand. A thin sheet of wave water is washing gently ' +
      'around her. She is holding her ground, eyes squeezed shut with determination. ' +
      'The water is swirling around her small form but she is not being swept away.',
    narrativeContext:
      'Piper summons every ounce of her tiny courage. She crouches low on the wet sand, ' +
      'digs her feet in, and holds on. The wave washes over her — but this time she is ready. ' +
      'The water swirls around her, cold but not cruel. She holds. She holds.',
    audioType: 'hub',
    camera: CAMERA.LOW,
    transition: { type: 'linear', next: 9 },
  },

  // ── 9: Underwater Wonder ───────────────────────────────────────────────────
  {
    id: 9,
    name: 'Underwater',
    subtitle: 'A Hidden World',
    anchorImagePrompt:
      'Magical underwater perspective looking up through crystal-clear shallow ocean water. ' +
      'A baby sandpiper is visible through the surface from below, distorted by ripples. ' +
      'Sunlight is streaming through the water in golden rays. Tiny shells, colorful pebbles, ' +
      'and small sea creatures are visible on the sandy bottom. Bubbles are rising. Ethereal light.',
    streamContext:
      'Seen through shallow crystal-clear water, the world is transformed. Sunlight is streaming ' +
      'through the water surface in shimmering golden rays. Tiny shells and colorful pebbles are ' +
      'scattered across the sandy bottom, glowing in the filtered light. Small bubbles are rising ' +
      'slowly. The surface is rippling gently above, distorting the sky into abstract patterns.',
    narrativeContext:
      'Piper opens her eyes — and the world has changed. Through the thin veil of water, ' +
      'everything is luminous. Sunlight bends into golden ribbons. The sand beneath her feet ' +
      'is alive with color — shells, pebbles, tiny creatures. The ocean is not a monster. ' +
      'It is a world.',
    audioType: 'saturn',
    camera: CAMERA.UNDERWATER,
    transition: { type: 'linear', next: 10 },
  },

  // ── 10: Discovery ──────────────────────────────────────────────────────────
  {
    id: 10,
    name: 'Discovery',
    subtitle: 'Abundance',
    anchorImagePrompt:
      'A wave has just receded revealing wet beach sand full of tiny shells, sand crabs, and ' +
      'sea treasures. A baby sandpiper chick is standing in the middle of this abundance, ' +
      'looking around with wide amazed eyes. Everything is glistening wet in the sunlight. ' +
      'The sand is pocked with tiny bubbling holes where creatures are hiding just beneath.',
    streamContext:
      'The wave is retreating across the sand, leaving behind a glistening landscape of tiny ' +
      'treasures. Shells and small creatures are scattered everywhere on the wet sand. Tiny holes ' +
      'are bubbling as sand crabs are burrowing just beneath the surface. The baby sandpiper is ' +
      'looking around with wide amazed eyes, surrounded by abundance. Everything is sparkling.',
    narrativeContext:
      'The wave pulls back and the sand comes alive. Tiny bubbling holes appear everywhere — ' +
      'each one hiding something delicious. Shells glisten. Small crabs scuttle. The feast is ' +
      'right here, right beneath her feet, revealed by the very water she feared.',
    audioType: 'jupiter',
    camera: CAMERA.MEDIUM,
    transition: { type: 'linear', next: 11 },
  },

  // ── 11: Sunset ─────────────────────────────────────────────────────────────
  {
    id: 11,
    name: 'Sunset',
    subtitle: 'Home',
    anchorImagePrompt:
      'A gorgeous sunset beach scene. A family of sandpipers — mother and several chicks including ' +
      'one confident baby — are silhouetted against a spectacular orange and pink sunset sky. ' +
      'The ocean is calm and golden, reflecting the sunset colors. Long shadows stretch across ' +
      'the sand. The mood is peaceful, triumphant, content. Wide cinematic shot.',
    streamContext:
      'The sun is setting over the ocean, painting the sky in spectacular oranges and pinks. ' +
      'The water is calm and golden, reflecting the sunset colors like a mirror. A family of ' +
      'sandpipers is silhouetted on the beach, the baby bird is standing confidently among them. ' +
      'Long golden shadows are stretching across the warm sand. The mood is peaceful and content.',
    narrativeContext:
      'The sun sinks toward the ocean, turning everything to gold. Piper stands at the water\'s ' +
      'edge — not hiding, not running, just standing. The waves come and she dances with them now, ' +
      'forward and back, just like her mother. She is small, but she is not afraid. Not anymore.',
    audioType: 'ending',
    camera: CAMERA.ESTABLISHING,
    transition: { type: 'ending' },
  },
];

// ─── Exports & Helpers ──────────────────────────────────────────────────────

export { SCENES };

export function getScene(id) {
  return SCENES[id] || null;
}

export function getSceneCount() {
  return SCENES.length;
}

/** Determine ending — single ending for Piper's linear story. */
export function determineEnding() {
  return {
    id: 'brave',
    title: 'Brave Little Piper',
    description:
      'The smallest bird on the beach learned the biggest lesson — that the thing you fear most ' +
      'might be hiding the thing you need most. Tomorrow the waves will come again, and Piper ' +
      'will be ready. She will always be ready now.',
  };
}

// Stubs for engine compatibility
export function getBranchDestinations() { return {}; }
export function getNextVisitScene() { return null; }
