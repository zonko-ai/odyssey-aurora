// ─── Odyssey to the Stars v2 — Game State Manager ───────────────────────────
// Reactive state management with subscription pattern and localStorage persistence.

import { getScene, getNextVisitScene, determineEnding } from './sceneRegistry.js';

/**
 * Game lifecycle phases.
 * @enum {string}
 */
export const Phase = Object.freeze({
  BOOT: 'BOOT',
  PRELOADING: 'PRELOADING',
  CONNECTING: 'CONNECTING',
  SCENE_LOADING: 'SCENE_LOADING',
  SCENE_READY: 'SCENE_READY',
  NARRATIVE: 'NARRATIVE',
  CHOICES: 'CHOICES',
  ACTING: 'ACTING',
  NPC_CHAT: 'NPC_CHAT',
  TRANSITIONING: 'TRANSITIONING',
  ENDING: 'ENDING',
  ERROR: 'ERROR',
});

const STORAGE_KEY = 'odyssey_save';

/** @returns {Object} fresh initial state */
function createInitialState() {
  return {
    phase: Phase.BOOT,
    currentSceneId: 0,
    visitedScenes: [],
    choiceHistory: [],
    currentNarrative: '',
    currentChoices: [],
    npcChatOpen: false,
    activeNpcId: null,
    volume: 0.7,
    error: null,
    ending: null,
  };
}

/**
 * Create a reactive game state manager.
 * @returns {{
 *   getState: () => Object,
 *   setState: (partial: Object) => void,
 *   subscribe: (listener: Function) => () => void,
 *   save: () => void,
 *   load: () => boolean,
 *   reset: () => void,
 *   getNextSceneId: (choiceId: string) => number|number[]|null,
 *   recordChoice: (sceneId: number, choice: Object) => void,
 *   computeEnding: () => Object
 * }}
 */
export function createGameState() {
  let state = createInitialState();
  const subscribers = new Set();

  /**
   * Get current state (shallow copy).
   * @returns {Object}
   */
  function getState() {
    return { ...state };
  }

  /**
   * Merge partial state update. Notifies all subscribers synchronously.
   * @param {Object} partial — key/value pairs to merge into state
   */
  function setState(partial) {
    const prev = state;
    state = { ...prev, ...partial };
    for (const listener of subscribers) {
      try {
        listener(getState(), prev);
      } catch (err) {
        console.error('[gameState] Subscriber error:', err);
      }
    }
  }

  /**
   * Subscribe to state changes.
   * @param {(newState: Object, prevState: Object) => void} listener
   * @returns {() => void} unsubscribe function
   */
  function subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }

  /**
   * Persist saveable state to localStorage.
   * Only saves: currentSceneId, visitedScenes, choiceHistory, volume.
   */
  function save() {
    try {
      const saveData = {
        currentSceneId: state.currentSceneId,
        visitedScenes: state.visitedScenes,
        choiceHistory: state.choiceHistory,
        volume: state.volume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (err) {
      console.warn('[gameState] Failed to save:', err);
    }
  }

  /**
   * Restore state from localStorage.
   * @returns {boolean} true if a save was found and loaded
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const saveData = JSON.parse(raw);
      setState({
        currentSceneId: saveData.currentSceneId ?? 0,
        visitedScenes: saveData.visitedScenes ?? [],
        choiceHistory: saveData.choiceHistory ?? [],
        volume: saveData.volume ?? 0.7,
      });
      return true;
    } catch (err) {
      console.warn('[gameState] Failed to load save:', err);
      return false;
    }
  }

  /** Reset to initial state and clear localStorage save. */
  function reset() {
    const prev = { ...state };
    state = createInitialState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) { /* ok */ }
    // Notify subscribers of reset
    for (const listener of subscribers) {
      try {
        listener(getState(), prev);
      } catch (err) {
        console.error('[gameState] Subscriber error:', err);
      }
    }
  }

  // ─── Navigation Helpers ────────────────────────────────────────────────────

  /**
   * Compute the next scene ID based on the current scene's transition type.
   * @param {string} [choiceId] — the choice key (needed for 'branch' transitions)
   * @returns {number|number[]|null} — next scene ID, array of options, or null for ending
   */
  function getNextSceneId(choiceId) {
    const scene = getScene(state.currentSceneId);
    if (!scene) return null;

    const { transition } = scene;

    switch (transition.type) {
      case 'linear':
        return transition.next;

      case 'branch':
        return transition.options[choiceId] ?? null;

      case 'visit':
        return getNextVisitScene(state.currentSceneId, state.visitedScenes);

      case 'ending':
        return null;

      default:
        console.warn(`[gameState] Unknown transition type: "${transition.type}"`);
        return null;
    }
  }

  /**
   * Record a player choice and mark the scene as visited.
   * @param {number} sceneId
   * @param {{ id: string, text: string, tone: string }} choice
   */
  function recordChoice(sceneId, choice) {
    const newHistory = [
      ...state.choiceHistory,
      { sceneId, choiceId: choice.id, text: choice.text, tone: choice.tone },
    ];
    const newVisited = state.visitedScenes.includes(sceneId)
      ? state.visitedScenes
      : [...state.visitedScenes, sceneId];

    setState({
      choiceHistory: newHistory,
      visitedScenes: newVisited,
    });
  }

  /**
   * Compute and store the ending based on accumulated choice history.
   * @returns {Object} ending object with id, title, description
   */
  function computeEnding() {
    const ending = determineEnding(state.choiceHistory);
    setState({ ending, phase: Phase.ENDING });
    return ending;
  }

  return {
    getState,
    setState,
    subscribe,
    save,
    load,
    reset,
    getNextSceneId,
    recordChoice,
    computeEnding,
  };
}
