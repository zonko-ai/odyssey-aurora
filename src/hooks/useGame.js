// ─── useGame — Main game orchestration hook ─────────────────────────────────
// Manages the full game lifecycle: preloading, Odyssey connection, scene flow,
// narrative generation, "Next" advancement, transitions, and ending.

import { useState, useEffect, useRef, useCallback } from 'react';
import { getScene, getSceneCount } from '../engine/sceneRegistry.js';
import { buildStreamPrompt } from '../engine/storyBible.js';
import { generateNarrative } from '../engine/geminiService.js';
import odysseyManager from '../engine/odysseyManager.js';
import audioEngine from '../engine/audioEngine.js';
import { preloadAll, getProgress, getImage } from '../engine/anchorPreloader.js';
import { Phase, createGameState } from '../engine/gameState.js';

// Delay helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function useGame() {
  // ── Refs (stable across renders, no stale closures) ─────────────────────
  const gameStateRef = useRef(null);
  const videoRef = useRef(null);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);

  // ── React state (drives UI re-renders) ──────────────────────────────────
  const [phase, setPhase] = useState(Phase.BOOT);
  const [currentScene, setCurrentScene] = useState(null);
  const [narrative, setNarrative] = useState('');
  const [error, setError] = useState(null);
  const [volume, setVolumeState] = useState(0.7);
  const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: getSceneCount(), percent: 0 });
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [ending, setEnding] = useState(null);
  const [anchorImageUrl, setAnchorImageUrl] = useState(null);

  // ── Sync helper: push gameState fields into React state ─────────────────
  const syncFromGameState = useCallback((state) => {
    if (!mountedRef.current) return;
    setPhase(state.phase);
    setCurrentScene(getScene(state.currentSceneId));
    setNarrative(state.currentNarrative || '');
    setError(state.error || null);
    setVolumeState(state.volume);
    if (state.ending) setEnding(state.ending);
  }, []);

  // ── Load a scene (core async sequence) ──────────────────────────────────
  const loadScene = useCallback(async (sceneId) => {
    const gs = gameStateRef.current;
    if (!gs || !mountedRef.current) return;

    try {
      const scene = getScene(sceneId);
      if (!scene) throw new Error(`Scene ${sceneId} not found in registry`);

      gs.setState({ currentSceneId: sceneId, phase: Phase.SCENE_LOADING });

      // Show anchor image as background while stream loads
      const anchorBlob = getImage(sceneId);
      if (anchorBlob) {
        const url = URL.createObjectURL(anchorBlob);
        setAnchorImageUrl(url);
      }

      // Build stream prompt (stative language)
      const streamPrompt = buildStreamPrompt(scene.streamContext);

      // Start Odyssey stream & audio crossfade in parallel
      await Promise.all([
        odysseyManager.startScene(streamPrompt),
        Promise.resolve(audioEngine.crossfadeTo(scene.audioType, 1.5)),
      ]);

      if (!mountedRef.current) return;

      // Clear frozen transition frame now that new stream is live
      setFrozenFrame(null);

      gs.setState({ phase: Phase.NARRATIVE });

      // Generate narrative via Gemini
      const narrativeText = await generateNarrative(
        scene.name,
        scene.narrativeContext,
      );

      if (!mountedRef.current) return;
      gs.setState({ currentNarrative: narrativeText });
    } catch (err) {
      console.error('[useGame] loadScene error:', err);
      if (mountedRef.current) {
        gs.setState({ phase: Phase.ERROR, error: err.message });
      }
    }
  }, []);

  // ── Handle narrative display complete (typewriter finished) ─────────────
  const handleNarrativeComplete = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs || !mountedRef.current) return;
    // Show "Next" button (reuses CHOICES phase)
    gs.setState({ phase: Phase.CHOICES });
  }, []);

  // ── Transition to next scene ────────────────────────────────────────────
  const transitionToScene = useCallback(async (nextSceneId) => {
    const gs = gameStateRef.current;
    if (!gs || !mountedRef.current) return;

    try {
      gs.setState({ phase: Phase.TRANSITIONING });

      // Capture current video frame for crossfade overlay
      const canvas = odysseyManager.captureCurrentFrame();
      if (canvas) setFrozenFrame(canvas);

      // End current stream
      await odysseyManager.endCurrentStream();

      // Transition SFX + brief pause for visual polish
      audioEngine.playSfx('transition');
      await wait(500);

      if (!mountedRef.current) return;

      // Load the next scene
      await loadScene(nextSceneId);
    } catch (err) {
      console.error('[useGame] transitionToScene error:', err);
      if (mountedRef.current) {
        gs.setState({ phase: Phase.ERROR, error: err.message });
      }
    }
  }, [loadScene]);

  // ── Handle "Next" button press ──────────────────────────────────────────
  const handleNext = useCallback(async () => {
    const gs = gameStateRef.current;
    if (!gs || !mountedRef.current) return;

    const state = gs.getState();
    const scene = getScene(state.currentSceneId);
    if (!scene) return;

    // Mark scene as visited
    const newVisited = state.visitedScenes.includes(scene.id)
      ? state.visitedScenes
      : [...state.visitedScenes, scene.id];
    gs.setState({ visitedScenes: newVisited });

    // Check transition
    if (scene.transition.type === 'ending') {
      const endingResult = gs.computeEnding();
      gs.setState({ phase: Phase.ENDING, ending: endingResult });
      return;
    }

    // Linear transition
    const nextSceneId = scene.transition.next;
    if (nextSceneId != null) {
      await transitionToScene(nextSceneId);
    }
  }, [transitionToScene]);

  // ── Begin game (from StartScreen) ───────────────────────────────────────
  const handleBegin = useCallback(async () => {
    const gs = gameStateRef.current;
    if (!gs || !mountedRef.current) return;

    try {
      // Initialize audio
      audioEngine.init();
      audioEngine.setVolume(gs.getState().volume);

      gs.setState({ phase: Phase.CONNECTING });

      // Connect Odyssey to the video element
      await odysseyManager.connect(videoRef.current);

      if (!mountedRef.current) return;

      // Load the first scene
      await loadScene(0);
    } catch (err) {
      console.error('[useGame] handleBegin error:', err);
      if (mountedRef.current) {
        gs.setState({ phase: Phase.ERROR, error: err.message });
      }
    }
  }, [loadScene]);

  // ── Forward interact prompt to Odyssey ──────────────────────────────────
  const handleInteract = useCallback((prompt) => {
    odysseyManager.interact(prompt);
  }, []);

  // ── Volume control ──────────────────────────────────────────────────────
  const setVolume = useCallback((level) => {
    const gs = gameStateRef.current;
    if (gs) gs.setState({ volume: level });
    audioEngine.setVolume(level);
  }, []);

  // ── Initialization (mount) ──────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Create game state
    const gs = createGameState();
    gameStateRef.current = gs;

    // Subscribe to gameState changes and sync to React
    unsubRef.current = gs.subscribe((state) => {
      syncFromGameState(state);
    });

    // Always start fresh (no save/resume for linear story)
    gs.setState({ currentSceneId: 0 });

    // Initial sync
    syncFromGameState(gs.getState());

    // Start preloading anchor images
    gs.setState({ phase: Phase.PRELOADING });
    preloadAll((progress) => {
      if (!mountedRef.current) return;
      setPreloadProgress(progress);

      // Show Begin as soon as scene 0 (first scene) is loaded
      if (progress.loaded >= 1 && gs.getState().phase === Phase.PRELOADING) {
        gs.setState({ phase: Phase.SCENE_READY });
      }
    }).then(() => {
      if (mountedRef.current) {
        setPreloadProgress(getProgress());
      }
    }).catch((err) => {
      console.error('[useGame] Preload failed:', err);
      if (mountedRef.current) {
        gs.setState({ phase: Phase.ERROR, error: `Preload failed: ${err.message}` });
      }
    });

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (unsubRef.current) unsubRef.current();
      odysseyManager.disconnect();
      audioEngine.stop();
    };
  }, [syncFromGameState]);

  return {
    // State
    phase,
    currentScene,
    narrative,
    error,
    volume,
    preloadProgress,
    frozenFrame,
    ending,
    anchorImageUrl,
    videoRef,

    // Actions
    handleBegin,
    handleNext,
    handleNarrativeComplete,
    handleInteract,
    setVolume,
  };
}
