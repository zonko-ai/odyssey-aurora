import { useMemo } from 'react';

// Generate a fixed starfield of ~50 tiny dots at random positions
function generateStars(count = 50) {
  const stars = [];
  // Use a deterministic seed-like approach with fixed values
  for (let i = 0; i < count; i++) {
    stars.push({
      left: `${((i * 37 + 13) % 100)}%`,
      top: `${((i * 53 + 7) % 100)}%`,
      size: (i % 3 === 0) ? 2 : 1,
      opacity: 0.15 + (i % 5) * 0.12,
      animationDelay: `${(i % 7) * 0.8}s`,
    });
  }
  return stars;
}

export default function StartScreen({ progress, phase, onBegin }) {
  const stars = useMemo(() => generateStars(50), []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base z-20">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.animationDelay,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold tracking-tight text-neutral-100 mb-2 relative z-10">
        ODYSSEY TO THE STARS
      </h1>
      <p className="text-sm tracking-[0.3em] uppercase text-neutral-500 mb-16 relative z-10">
        A Deep Space Adventure
      </p>

      {/* Progress (subtle, minimal) */}
      {phase === 'PRELOADING' && progress.percent < 100 && (
        <div className="w-64 mb-12 relative z-10">
          <div className="h-px bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-600 mt-2 text-center">
            Preparing voyage... {progress.loaded}/{progress.total}
          </p>
        </div>
      )}

      {phase === 'CONNECTING' && (
        <p className="text-sm text-neutral-500 animate-pulse mb-12 relative z-10">
          Establishing connection...
        </p>
      )}

      {/* BEGIN button — only when preloading is complete */}
      {(progress.percent >= 100 && phase === 'PRELOADING') || phase === 'SCENE_READY' ? (
        <button
          onClick={onBegin}
          className="px-12 py-4 text-lg tracking-widest uppercase text-cyan border border-cyan/30
            rounded-lg animate-breathe hover:bg-cyan/10 hover:border-cyan/50 transition-colors
            glow-cyan relative z-10"
        >
          Begin
        </button>
      ) : null}
    </div>
  );
}
