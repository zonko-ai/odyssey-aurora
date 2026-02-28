// ─── Odyssey to the Stars v2 — Scene Registry ──────────────────────────────
// Defines all 11 scenes with narrative data, image prompts, branching logic,
// NPC assignments, and fallback choices.

import { CAMERA } from './storyBible.js';

/**
 * Audio ambient types (mapped to audioEngine presets):
 *   bridge | launch | space | asteroid | hub | lunar | mars | mining | jupiter | saturn | ending
 */

/**
 * Transition types:
 *   linear  — { type: 'linear', next: sceneId }
 *   branch  — { type: 'branch', options: { key: sceneId, ... } }
 *   visit   — { type: 'visit', pool: [sceneIds], minVisits: N, then: sceneId }
 *   ending  — { type: 'ending' }
 */

const SCENES = [
  // ── 0: The Bridge ─────────────────────────────────────────────────────────
  {
    id: 0,
    name: 'The Bridge',
    subtitle: 'Starship Odyssey — Earth Orbit',
    anchorImagePrompt:
      'Interior of a futuristic starship command bridge. A curved panoramic viewport shows ' +
      'Earth below, glowing blue-white. Holographic navigation displays float above a sleek ' +
      'dark console. The bridge is dimly lit with cool cyan accent lighting along the ceiling ' +
      'channels and warm amber status indicators on the consoles. A single command chair sits ' +
      'at center. The atmosphere is quiet, anticipatory.',
    streamContext:
      'The bridge of the Starship Odyssey is humming with quiet energy. Holographic star charts ' +
      'are rotating slowly above the main console. Earth is visible through the viewport, its ' +
      'blue glow is reflecting off polished surfaces. Status lights are blinking in rhythmic patterns.',
    narrativeContext:
      'The captain stands on the bridge of the Odyssey, humanity\'s most advanced exploration ' +
      'vessel, in stable Earth orbit. The mission: venture beyond the solar system. The crew ' +
      'is ready, systems are green, and the stars are waiting.',
    choiceContext:
      'The player is deciding how to begin the mission. Choices should reflect different ' +
      'leadership styles — methodical preparation, inspiring the crew, or eager departure.',
    npcs: ['nova'],
    audioType: 'bridge',
    camera: CAMERA.MEDIUM,
    fallbackChoices: [
      { id: 'address-crew', text: 'Address the crew over comms before departure', tone: 'cautious' },
      { id: 'engage-engines', text: 'Give the order to engage the main engines', tone: 'bold' },
      { id: 'check-stars', text: 'Study the star charts one more time with NOVA', tone: 'creative' },
    ],
    transition: { type: 'linear', next: 1 },
  },

  // ── 1: Earth Departure ────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Departure',
    subtitle: 'Leaving Earth Behind',
    anchorImagePrompt:
      'A sleek silver starship is accelerating away from Earth, seen from a dramatic low angle. ' +
      'Earth is receding in the background, a luminous blue marble against the black void. ' +
      'The ship\'s engines are glowing brilliant cyan-white. Streaks of light suggest building ' +
      'velocity. The scene conveys both exhilaration and the weight of leaving home.',
    streamContext:
      'The Odyssey is accelerating steadily away from Earth orbit. Engine thrust is producing ' +
      'a deep vibration through the hull. Stars are beginning to stretch slightly as velocity ' +
      'is increasing. Earth is shrinking in the rear viewport, its blue glow is fading gradually.',
    narrativeContext:
      'The Odyssey breaks orbit. The engines engage with a deep, resonant hum that vibrates ' +
      'through every surface. Through the rear viewport, Earth diminishes — continents, then ' +
      'oceans, then just a bright blue point. The vastness of space opens ahead.',
    choiceContext:
      'An emotional beat — the player processes leaving Earth. Choices should be introspective: ' +
      'looking forward, looking back, or connecting with the crew about the moment.',
    npcs: ['nova'],
    audioType: 'launch',
    camera: CAMERA.DRAMATIC,
    fallbackChoices: [
      { id: 'watch-earth', text: 'Linger at the viewport and watch Earth fade away', tone: 'cautious' },
      { id: 'push-forward', text: 'Focus on the mission ahead and check systems', tone: 'bold' },
      { id: 'record-log', text: "Record a personal captain's log entry", tone: 'creative' },
    ],
    transition: { type: 'linear', next: 2 },
  },

  // ── 2: Deep Space ─────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'The Void',
    subtitle: 'Interplanetary Space',
    anchorImagePrompt:
      'Deep space vista seen from inside a starship observation lounge. Floor-to-ceiling ' +
      'windows reveal an infinite starfield with the Milky Way stretching across the view. ' +
      'A faint nebula glows in pale pink and blue in the distance. The lounge interior has ' +
      'minimal warm lighting — a single reading lamp, dark polished floors reflecting starlight.',
    streamContext:
      'The observation lounge is bathed in starlight. Thousands of stars are glittering through ' +
      'the panoramic windows. The Milky Way is stretching across the entire view like a luminous ' +
      'river. Faint cosmic dust is drifting past the windows. The ship is coasting in silence.',
    narrativeContext:
      'Days into the journey. The Odyssey glides through the void between worlds. In the ' +
      'observation lounge, the silence is almost sacred — just the faint hum of life support ' +
      'and the infinite tapestry of stars beyond the glass.',
    choiceContext:
      'A contemplative scene. The player can explore the ship, reflect on the journey, or ' +
      'investigate something unusual NOVA has detected on long-range sensors.',
    npcs: ['nova'],
    audioType: 'space',
    camera: CAMERA.ESTABLISHING,
    fallbackChoices: [
      { id: 'investigate-signal', text: 'Ask NOVA about the anomalous sensor reading', tone: 'cautious' },
      { id: 'explore-ship', text: 'Take a walk through the ship and meet the crew', tone: 'creative' },
      { id: 'push-engines', text: 'Increase velocity to reach the asteroid belt faster', tone: 'bold' },
    ],
    transition: { type: 'linear', next: 3 },
  },

  // ── 3: Asteroid Belt ──────────────────────────────────────────────────────
  {
    id: 3,
    name: 'Asteroid Belt',
    subtitle: 'Navigating the Field',
    anchorImagePrompt:
      'A starship navigating through a dense asteroid field. Massive irregular rocks tumble ' +
      'slowly in every direction, some catching sunlight on jagged surfaces. The ship\'s ' +
      'forward lights illuminate dust and small debris. Distant asteroids are silhouetted ' +
      'against a faint starfield. The atmosphere is tense and claustrophobic.',
    streamContext:
      'Asteroids of varying sizes are drifting and tumbling past the viewport. The ship\'s ' +
      'forward lights are cutting through clouds of fine debris. Proximity alerts are flashing ' +
      'subtly on the HUD. Small rocks are occasionally bouncing off the deflector shields ' +
      'with brief flashes of energy.',
    narrativeContext:
      'The asteroid belt. Massive rocks drift in lazy arcs, deceptively peaceful until you ' +
      'notice them spinning — each one a mountain moving at thousands of kilometers per hour. ' +
      'The navigation system is working overtime. NOVA highlights a path, but it\'s narrow.',
    choiceContext:
      'A tension/skill scene. The player navigates danger. Choices involve risk tolerance: ' +
      'careful manual piloting, trusting the AI, or finding a shortcut through a gap.',
    npcs: ['nova'],
    audioType: 'asteroid',
    camera: CAMERA.POV,
    fallbackChoices: [
      { id: 'trust-nova', text: 'Let NOVA calculate the safest route through', tone: 'cautious' },
      { id: 'manual-pilot', text: 'Take manual control and thread the needle yourself', tone: 'bold' },
      { id: 'scan-asteroids', text: 'Scan the largest asteroid — something is reflecting light', tone: 'creative' },
    ],
    transition: { type: 'linear', next: 4 },
  },

  // ── 4: Mission Hub ────────────────────────────────────────────────────────
  {
    id: 4,
    name: 'Mission Hub',
    subtitle: 'Choose Your Destination',
    anchorImagePrompt:
      'A futuristic holographic war-room table displaying a 3D map of the inner solar system. ' +
      'Three destinations are highlighted with glowing markers: the Moon (silver-white), ' +
      'Mars (warm red-orange), and an asteroid station (amber-gold). The room is dark except ' +
      'for the hologram\'s glow casting colored light on surrounding surfaces. Star charts ' +
      'and mission data float in the air.',
    streamContext:
      'The holographic solar system map is rotating slowly above the planning table. Three ' +
      'destination markers are pulsing gently — silver for the Moon, red-orange for Mars, ' +
      'amber for the asteroid station. Data readouts are scrolling beside each destination. ' +
      'The room is bathed in the shifting colored glow of the hologram.',
    narrativeContext:
      'The war room. A holographic solar system rotates above the planning table, three ' +
      'destinations pulsing with invitation. Each outpost has sent urgent communiqués — ' +
      'a scientific breakthrough on the Moon, signs of ancient life on Mars, an impossible ' +
      'discovery in the asteroids. You can\'t visit them all. Choose wisely.',
    choiceContext:
      'THE key branching point. Player chooses which destination to visit first. This determines ' +
      'the order of scenes 5-7. Each choice should clearly indicate the destination.',
    npcs: ['nova'],
    audioType: 'hub',
    camera: CAMERA.MEDIUM,
    fallbackChoices: [
      { id: 'goto-moon', text: 'Set course for the Lunar Outpost — investigate the anomaly', tone: 'cautious' },
      { id: 'goto-mars', text: 'Head to Mars Colony — the biosignatures can\'t wait', tone: 'bold' },
      { id: 'goto-asteroid', text: 'Divert to the mining station — something found in the rock', tone: 'creative' },
    ],
    transition: {
      type: 'branch',
      options: {
        'goto-moon': 5,
        'goto-mars': 6,
        'goto-asteroid': 7,
      },
    },
  },

  // ── 5: Lunar Outpost ──────────────────────────────────────────────────────
  {
    id: 5,
    name: 'Lunar Outpost',
    subtitle: 'Shackleton Crater Observatory',
    anchorImagePrompt:
      'Interior of a lunar research observatory built into crater walls. A massive telescope ' +
      'array is visible through reinforced windows, pointed at deep space. The room has a ' +
      'clinical but warm atmosphere — white surfaces with plants growing under UV lights. ' +
      'Screens display incomprehensible astronomical data. The curved lunar surface and ' +
      'black sky are visible outside, with Earth a small blue dot on the horizon.',
    streamContext:
      'The lunar observatory is quiet and serene. The massive telescope array is tracking slowly ' +
      'across the star field outside. Screens of astronomical data are scrolling and updating. ' +
      'Small plants under UV grow-lights are swaying gently in the recycled air. Earth is ' +
      'hanging like a blue jewel on the horizon through the reinforced windows.',
    narrativeContext:
      'The Shackleton Crater Observatory. Built into the perpetually shadowed rim of the Moon\'s ' +
      'south pole, this outpost houses the most powerful telescope ever constructed. Dr. Lin Chen ' +
      'has been stationed here for two years, and what he\'s found has shaken the foundations of ' +
      'astrophysics.',
    choiceContext:
      'A discovery/knowledge scene. The player interacts with Dr. Chen\'s findings — something ' +
      'impossible in the telescope data. Choices involve how to respond to paradigm-shifting information.',
    npcs: ['drChen', 'nova'],
    audioType: 'lunar',
    camera: CAMERA.ESTABLISHING,
    fallbackChoices: [
      { id: 'examine-data', text: 'Ask Dr. Chen to walk you through the anomalous data', tone: 'cautious' },
      { id: 'look-telescope', text: 'Look through the telescope yourself at the source', tone: 'bold' },
      { id: 'question-method', text: 'Question whether the instruments could be malfunctioning', tone: 'creative' },
    ],
    transition: { type: 'visit', pool: [5, 6, 7], minVisits: 2, then: 8 },
  },

  // ── 6: Mars Colony ────────────────────────────────────────────────────────
  {
    id: 6,
    name: 'Mars Colony',
    subtitle: 'Olympus Research Dome',
    anchorImagePrompt:
      'Interior of a pressurized Mars research dome. Red Martian landscape visible through ' +
      'curved transparent walls — rust-colored dunes and a pale butterscotch sky. Inside, ' +
      'a xenobiology lab with sealed specimen containers, microscope stations, and holographic ' +
      'molecular models floating above workbenches. Green hydroponic gardens line one wall. ' +
      'The light is warm amber, filtering through the Martian dust outside.',
    streamContext:
      'The Mars research dome is glowing with warm amber light filtering through Martian dust ' +
      'outside. Holographic molecular models are rotating slowly above lab benches. Sealed ' +
      'specimen containers are arranged in rows, their status lights blinking green. Wind is ' +
      'pressing fine red dust against the dome walls in swirling patterns.',
    narrativeContext:
      'The Olympus Research Dome. Through the curved walls, Mars stretches in every direction — ' +
      'rust-red dunes under a butterscotch sky. Inside, Dr. Okafor\'s lab hums with quiet ' +
      'urgency. Sealed containers hold samples from deep beneath the Martian permafrost, and ' +
      'something in them is defying every biological model in the database.',
    choiceContext:
      'A life/wonder scene. The player confronts evidence of extraterrestrial biology. Choices ' +
      'involve scientific curiosity, caution about contamination, or broader implications for humanity.',
    npcs: ['drOkafor', 'nova'],
    audioType: 'mars',
    camera: CAMERA.MEDIUM,
    fallbackChoices: [
      { id: 'examine-samples', text: 'Examine the subsurface samples under the microscope', tone: 'cautious' },
      { id: 'open-container', text: 'Request to unseal a container for direct observation', tone: 'bold' },
      { id: 'ask-implications', text: 'Ask Dr. Okafor what this means for the mission', tone: 'creative' },
    ],
    transition: { type: 'visit', pool: [5, 6, 7], minVisits: 2, then: 8 },
  },

  // ── 7: Asteroid Mining Station ────────────────────────────────────────────
  {
    id: 7,
    name: 'Mining Station',
    subtitle: 'Ceres Deep-Core Facility',
    anchorImagePrompt:
      'Interior of a massive industrial asteroid mining station carved into rock. Enormous ' +
      'drill machinery and conveyor systems recede into darkness. Work lights cast harsh amber ' +
      'cones through clouds of mineral dust. A section of exposed rock face reveals something ' +
      'unusual — geometric patterns embedded in the stone that are clearly not natural. ' +
      'The atmosphere is gritty, functional, imposing.',
    streamContext:
      'The mining station is rumbling with deep industrial vibrations. Massive drill assemblies ' +
      'are standing idle, their amber work lights casting long shadows. Mineral dust is drifting ' +
      'through the air in visible clouds. The exposed rock face is illuminated by portable ' +
      'spotlights, its strange geometric patterns catching the light at different angles.',
    narrativeContext:
      'The Ceres Deep-Core Facility. A cathedral of industry carved from living rock. The drills ' +
      'have stopped — Chief Engineer Vasquez halted operations when the excavation team hit ' +
      'something impossible. Geometric patterns in the rock, too regular to be natural, too old ' +
      'to be human. The stone around them dates back four billion years.',
    choiceContext:
      'A mystery/discovery scene. The player investigates something ancient and artificial. ' +
      'Choices involve approach to the unknown — scientific analysis, direct physical investigation, ' +
      'or considering the implications.',
    npcs: ['vasquez', 'nova'],
    audioType: 'mining',
    camera: CAMERA.DRAMATIC,
    fallbackChoices: [
      { id: 'analyze-patterns', text: 'Have NOVA run a deep scan of the geometric patterns', tone: 'cautious' },
      { id: 'touch-surface', text: 'Approach the rock face and trace the patterns by hand', tone: 'bold' },
      { id: 'ask-vasquez', text: 'Ask Vasquez what his team thinks they\'ve found', tone: 'creative' },
    ],
    transition: { type: 'visit', pool: [5, 6, 7], minVisits: 2, then: 8 },
  },

  // ── 8: Jupiter Approach ───────────────────────────────────────────────────
  {
    id: 8,
    name: 'Jupiter',
    subtitle: 'The Great Red Eye',
    anchorImagePrompt:
      'A starship approaching Jupiter, the gas giant filling most of the frame. The Great Red ' +
      'Spot is visible as an enormous swirling storm. Jupiter\'s bands of cream, amber, and ' +
      'brown create mesmerizing patterns. The ship is tiny against the planet\'s immensity. ' +
      'Several of Jupiter\'s moons are visible as bright points. The lighting is dramatic — ' +
      'sunlight catching the cloud tops while the terminator line creates deep shadow.',
    streamContext:
      'Jupiter is filling the entire viewport, its massive cloud bands swirling in slow ' +
      'hypnotic patterns. The Great Red Spot is rotating gradually into view. Radiation ' +
      'interference is causing occasional static flickers across the displays. The ship is ' +
      'trembling slightly from gravitational tidal forces. Io is glowing like a hot ember nearby.',
    narrativeContext:
      'Jupiter. The word doesn\'t prepare you. Nothing prepares you. The gas giant fills the ' +
      'viewport like a wall of churning color — amber, cream, rust — each band a storm system ' +
      'larger than Earth. The ship groans under the gravitational gradient. Even NOVA seems ' +
      'quieter here, as if paying respect.',
    choiceContext:
      'An awe/scale scene. The player confronts the sublime power of Jupiter. Choices should ' +
      'involve how to respond to overwhelming natural grandeur — scientific observation, ' +
      'emotional response, or practical gravity-assist decisions.',
    npcs: ['nova'],
    audioType: 'jupiter',
    camera: CAMERA.ESTABLISHING,
    fallbackChoices: [
      { id: 'gravity-assist', text: 'Execute the gravity assist maneuver for Saturn trajectory', tone: 'cautious' },
      { id: 'scan-europa', text: 'Divert closer to Europa — its subsurface ocean is calling', tone: 'bold' },
      { id: 'observe-storm', text: 'Linger and record the Great Red Spot up close', tone: 'creative' },
    ],
    transition: { type: 'linear', next: 9 },
  },

  // ── 9: Saturn's Rings ────────────────────────────────────────────────────
  {
    id: 9,
    name: "Saturn's Rings",
    subtitle: 'The Convergence',
    anchorImagePrompt:
      'A starship floating among Saturn\'s rings. Billions of ice particles and chunks surround ' +
      'the vessel, catching sunlight and scattering it into prismatic rainbows. Saturn\'s golden ' +
      'surface curves majestically in the background. The rings extend to infinity in both ' +
      'directions. The scene is ethereal, almost dreamlike — beauty on a cosmic scale. ' +
      'A faint mysterious glow emanates from deeper within the rings.',
    streamContext:
      'Saturn\'s rings are surrounding the ship with billions of glittering ice particles. ' +
      'Sunlight is refracting through the ice, creating constantly shifting prismatic patterns. ' +
      'Saturn\'s golden atmosphere is curving across the background. Larger ice chunks are ' +
      'rotating slowly nearby. A mysterious glow is emanating from deeper in the ring plane.',
    narrativeContext:
      'Saturn\'s rings. You drift among them now, the ship surrounded by a billion tiny worlds ' +
      'of ice, each one catching the distant sun and throwing it back as prismatic fire. ' +
      'It\'s here — at the convergence — that everything you\'ve learned comes together. The ' +
      'telescope data, the ancient life, the impossible patterns. They all point here.',
    choiceContext:
      'The convergence scene — all discoveries connect. Choices shape the ending: pursue the ' +
      'scientific mystery, focus on what this means for humanity, reflect on personal growth, ' +
      'or embrace the unknown.',
    npcs: ['nova'],
    audioType: 'saturn',
    camera: CAMERA.ESTABLISHING,
    fallbackChoices: [
      { id: 'investigate-signal', text: 'Follow the mysterious signal deeper into the rings', tone: 'bold' },
      { id: 'compile-findings', text: 'Compile all findings and transmit them back to Earth', tone: 'cautious' },
      { id: 'contemplate', text: 'Float in silence among the rings and let it all sink in', tone: 'creative' },
    ],
    transition: { type: 'linear', next: 10 },
  },

  // ── 10: The Beyond ────────────────────────────────────────────────────────
  {
    id: 10,
    name: 'The Beyond',
    subtitle: 'End of the Odyssey',
    anchorImagePrompt:
      'A starship at the edge of the solar system, looking back. The sun is a bright but small ' +
      'star among millions. The ship is silhouetted against a vast nebula of deep purple and ' +
      'blue, stretching into infinity. Inside the bridge, the captain stands at the viewport, ' +
      'a small figure against the cosmos. The mood is contemplative, profound, hopeful.',
    streamContext:
      'The edge of the solar system stretches before the ship. The sun is now just another bright ' +
      'star among millions. A vast nebula is glowing in deep purple and blue ahead. The bridge ' +
      'is quiet, all displays are showing nominal readings. Stars are glittering in absolute silence.',
    narrativeContext:
      'The edge. Behind you, the sun has joined the stars — one bright point among billions. ' +
      'Ahead, the galaxy opens like a door. Everything you\'ve witnessed — the lunar anomaly, ' +
      'the Martian life, the ancient patterns, Jupiter\'s majesty, Saturn\'s secret — it all ' +
      'leads here, to this choice. Your choice.',
    choiceContext:
      'THE ending choice. Four possible endings based on accumulated choices and final decision. ' +
      'This is the culminating moment — choices should feel weighty and final.',
    npcs: ['nova'],
    audioType: 'ending',
    camera: CAMERA.DRAMATIC,
    fallbackChoices: [
      { id: 'press-on', text: 'Press on into deep space — there\'s more to discover', tone: 'bold' },
      { id: 'return-home', text: 'Set course for home — Earth needs to know what you\'ve found', tone: 'cautious' },
      { id: 'stay-here', text: 'Stay at the threshold and listen to the silence', tone: 'creative' },
    ],
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

/** Get available destination scenes from the branching hub (scene 4). */
export function getBranchDestinations() {
  return SCENES[4].transition.options;
}

/** Given visited scene IDs, compute next available scenes from the visit pool. */
export function getNextVisitScene(currentSceneId, visitedSceneIds) {
  const scene = SCENES[currentSceneId];
  if (!scene || scene.transition.type !== 'visit') return scene?.transition?.then ?? null;

  const { pool, minVisits, then } = scene.transition;
  const visited = pool.filter((id) => visitedSceneIds.includes(id));

  if (visited.length >= minVisits) {
    // Player has visited enough — offer remaining or advance
    const remaining = pool.filter((id) => !visitedSceneIds.includes(id));
    return remaining.length > 0 ? [...remaining, then] : [then];
  }

  // Must visit more — return unvisited pool scenes
  return pool.filter((id) => !visitedSceneIds.includes(id));
}

/**
 * Determine ending type based on player's accumulated choices.
 * Choices throughout the game are tagged with tones: cautious, bold, creative.
 *
 * Endings:
 *   Pioneer    — mostly bold choices    → pushes into deep space
 *   Discoverer — mostly cautious choices → returns home with knowledge
 *   Changed    — mostly creative choices → stays at the edge, transformed
 *   One More Mission — balanced mix       → plans the next odyssey
 */
export function determineEnding(choiceHistory) {
  const counts = { cautious: 0, bold: 0, creative: 0 };
  for (const choice of choiceHistory) {
    if (choice.tone && counts[choice.tone] !== undefined) {
      counts[choice.tone]++;
    }
  }

  const max = Math.max(counts.cautious, counts.bold, counts.creative);
  const total = counts.cautious + counts.bold + counts.creative;

  // Balanced — no tone has more than 40% of total
  if (total > 0 && max / total <= 0.4) {
    return {
      id: 'one-more-mission',
      title: 'One More Mission',
      description:
        'You radio Earth with your findings and a simple message: "Preparing for next mission." ' +
        'There is always more to see, more to learn, more to become. The Odyssey turns toward ' +
        'the next star, and you smile. The journey is the destination.',
    };
  }

  if (counts.bold >= counts.cautious && counts.bold >= counts.creative) {
    return {
      id: 'pioneer',
      title: 'The Pioneer',
      description:
        'You push the throttle forward. The stars blur and stretch. Behind you, the solar system ' +
        'shrinks to a point of light. Ahead — the unknown, vast and welcoming. You are the ' +
        'first, but you will not be the last. The Odyssey sails on.',
    };
  }

  if (counts.cautious >= counts.bold && counts.cautious >= counts.creative) {
    return {
      id: 'discoverer',
      title: 'The Discoverer',
      description:
        'You set course for home, carrying knowledge that will reshape human understanding. ' +
        'The data, the samples, the recordings — each one a key to a door humanity didn\'t know ' +
        'existed. As Earth grows in the viewport, you know: this is just the beginning.',
    };
  }

  return {
    id: 'changed',
    title: 'Changed',
    description:
      'You power down the engines and float among Saturn\'s rings. The ice catches the light ' +
      'and you see, for the first time, the pattern that connects everything — the lunar signal, ' +
      'the Martian life, the ancient rock. You are no longer just an explorer. You are part of it.',
  };
}
