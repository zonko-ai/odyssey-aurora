import { useMemo } from 'react';

// Generate soft sand-grain-like dots
function generateGrains(count = 40) {
  const grains = [];
  for (let i = 0; i < count; i++) {
    grains.push({
      left: `${((i * 37 + 13) % 100)}%`,
      top: `${((i * 53 + 7) % 100)}%`,
      size: (i % 3 === 0) ? 2 : 1,
      opacity: 0.08 + (i % 4) * 0.04,
      animationDelay: `${(i % 7) * 0.8}s`,
    });
  }
  return grains;
}

export default function StartScreen({ progress, phase, onBegin }) {
  const grains = useMemo(() => generateGrains(40), []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base z-20">
      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden">
        {grains.map((grain, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200/30 animate-pulse"
            style={{
              left: grain.left,
              top: grain.top,
              width: `${grain.size}px`,
              height: `${grain.size}px`,
              opacity: grain.opacity,
              animationDelay: grain.animationDelay,
              animationDuration: '4s',
            }}
          />
        ))}
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold tracking-tight text-neutral-100 mb-2 relative z-10">
        PIPER
      </h1>
      <p className="text-sm tracking-[0.3em] uppercase text-neutral-500 mb-16 relative z-10">
        A Story of Courage
      </p>

      {/* Progress bar — shown during initial preload before scene 0 is ready */}
      {phase === 'PRELOADING' && progress.loaded < 1 && (
        <div className="w-64 mb-12 relative z-10">
          <div className="h-px bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400/60 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-600 mt-2 text-center">
            Preparing... {progress.loaded}/{progress.total}
          </p>
        </div>
      )}

      {phase === 'CONNECTING' && (
        <p className="text-sm text-neutral-500 animate-pulse mb-12 relative z-10">
          Setting the scene...
        </p>
      )}

      {/* BEGIN button — shows once scene 0 is loaded */}
      {phase === 'SCENE_READY' ? (
        <div className="flex flex-col items-center relative z-10">
          <button
            onClick={onBegin}
            className="px-12 py-4 text-lg tracking-widest uppercase text-amber-200/80 border border-amber-200/20
              rounded-lg animate-breathe hover:bg-amber-200/10 hover:border-amber-200/40 transition-colors"
          >
            Begin
          </button>
          {progress.percent < 100 && (
            <p className="text-[10px] text-neutral-700 mt-4">
              Loading scenes... {progress.loaded}/{progress.total}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
