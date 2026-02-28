import { useState, useCallback } from 'react';

export default function HUD({ sceneName, sceneSubtitle, volume, onVolumeChange }) {
  const [prevVolume, setPrevVolume] = useState(0.7);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.7);
    }
  }, [volume, prevVolume, onVolumeChange]);

  return (
    <div className="absolute top-0 inset-x-0 flex items-start justify-between px-6 py-5 pointer-events-none z-10">
      {/* Scene info -- top left */}
      <div className="pointer-events-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">
          {sceneName}
        </p>
        {sceneSubtitle && (
          <p className="text-[10px] text-neutral-600 mt-0.5">{sceneSubtitle}</p>
        )}
      </div>

      {/* Volume -- top right */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="text-neutral-500 hover:text-neutral-300 transition-colors"
          title={volume > 0 ? 'Mute' : 'Unmute'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            {volume > 0 ? (
              <>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.25 4.222v15.556a.75.75 0 0 1-1.191.608l-5.309-3.9H2.25a.75.75 0 0 1-.75-.75v-7.472a.75.75 0 0 1 .75-.75h2.5l5.309-3.9a.75.75 0 0 1 1.191.608Z" />
              </>
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.25 4.222v15.556a.75.75 0 0 1-1.191.608l-5.309-3.9H2.25a.75.75 0 0 1-.75-.75v-7.472a.75.75 0 0 1 .75-.75h2.5l5.309-3.9a.75.75 0 0 1 1.191.608Z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.25 9.75 21.75 14.25M21.75 9.75 17.25 14.25" />
              </>
            )}
          </svg>
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 h-1 appearance-none bg-neutral-800 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
            [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-neutral-400
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Top gradient for readability */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent -z-10 pointer-events-none" />
    </div>
  );
}
