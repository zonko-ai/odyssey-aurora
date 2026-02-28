import { useCallback } from 'react';
import useGame from '../hooks/useGame';
import { Phase } from '../engine/gameState';

import VideoLayer from './VideoLayer';
import StartScreen from './StartScreen';
import NarrativeOverlay from './NarrativeOverlay';
import HUD from './HUD';

export default function GameScreen() {
  const {
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
    handleBegin,
    handleNext,
    handleNarrativeComplete,
    setVolume,
  } = useGame();

  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  const isTransitioning = phase === Phase.TRANSITIONING;
  const showStartScreen = phase === Phase.PRELOADING || phase === Phase.CONNECTING || phase === Phase.BOOT || phase === Phase.SCENE_READY;
  const showNarrative = phase === Phase.NARRATIVE;
  const showNext = phase === Phase.CHOICES;
  const showEnding = phase === Phase.ENDING;
  const showError = phase === Phase.ERROR;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-base">
      {/* Video layer -- always rendered */}
      <VideoLayer
        videoRef={videoRef}
        frozenFrame={frozenFrame}
        isTransitioning={isTransitioning}
        anchorImageUrl={anchorImageUrl}
      />

      {/* Start screen overlay */}
      {showStartScreen && (
        <StartScreen
          progress={preloadProgress}
          phase={phase}
          onBegin={handleBegin}
        />
      )}

      {/* Narrative overlay */}
      {showNarrative && (
        <NarrativeOverlay
          text={narrative}
          sceneName={currentScene?.name}
          sceneSubtitle={currentScene?.subtitle}
          isVisible={showNarrative}
          onComplete={handleNarrativeComplete}
        />
      )}

      {/* Next button */}
      {showNext && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10 animate-fade-in">
          <button
            onClick={handleNext}
            className="px-10 py-3 text-sm tracking-[0.25em] uppercase text-white/80 border border-white/20
              rounded-full hover:bg-white/10 hover:border-white/40 hover:text-white
              transition-all duration-300 backdrop-blur-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Ending display */}
      {showEnding && ending && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="glass max-w-lg mx-8 px-10 py-12 text-center animate-fade-in">
            <p className="text-xs tracking-[0.3em] uppercase text-cyan/60 mb-4">
              The End
            </p>
            <h2 className="text-3xl font-bold text-neutral-100 mb-6">
              {ending.title}
            </h2>
            <p className="text-base leading-relaxed text-neutral-300 mb-10">
              {ending.description}
            </p>
            <button
              onClick={handlePlayAgain}
              className="px-8 py-3 text-sm tracking-widest uppercase text-cyan border border-cyan/30
                rounded-lg hover:bg-cyan/10 hover:border-cyan/50 transition-colors glow-cyan"
            >
              Watch Again
            </button>
          </div>
          <div className="absolute inset-0 bg-black/60 -z-10" />
        </div>
      )}

      {/* Error display */}
      {showError && error && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="glass max-w-md mx-8 px-8 py-8 text-center animate-fade-in">
            <p className="text-xs tracking-[0.2em] uppercase text-red-400/80 mb-4">
              Something went wrong
            </p>
            <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 text-sm tracking-widest uppercase text-neutral-300 border border-white/20
                rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              Retry
            </button>
          </div>
          <div className="absolute inset-0 bg-black/70 -z-10" />
        </div>
      )}

      {/* Always-on HUD */}
      <HUD
        sceneName={currentScene?.name}
        sceneSubtitle={currentScene?.subtitle}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}
