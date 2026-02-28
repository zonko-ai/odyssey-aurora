import { useState, useEffect, useRef, useCallback } from 'react';

const CHARS_PER_SECOND = 30;

export default function NarrativeOverlay({ text, sceneName, sceneSubtitle, isVisible, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const completeTimerRef = useRef(null);
  const indexRef = useRef(0);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

    if (!text || !isVisible) return;

    // Start typewriter effect
    const interval = 1000 / CHARS_PER_SECOND;
    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      const nextIndex = indexRef.current;

      if (nextIndex >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        setDisplayedText(text.slice(0, nextIndex));
      }
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [text, isVisible]);

  // When fully revealed, wait 1s then call onComplete
  useEffect(() => {
    if (isComplete && onComplete) {
      completeTimerRef.current = setTimeout(() => {
        onComplete();
      }, 1000);
    }

    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [isComplete, onComplete]);

  // Skip to full text on click
  const skipToEnd = useCallback(() => {
    if (isComplete) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setDisplayedText(text);
    setIsComplete(true);
  }, [isComplete, text]);

  if (!isVisible || !text) return null;

  return (
    <div
      className="absolute bottom-0 inset-x-0 p-8 pointer-events-auto cursor-pointer"
      onClick={skipToEnd}
    >
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-cyan/60 mb-3">
          {sceneName}
        </p>
        {sceneSubtitle && (
          <p className="text-xs text-neutral-500 mb-4">{sceneSubtitle}</p>
        )}
        <p className="text-lg leading-relaxed text-neutral-200">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-0.5 h-5 bg-cyan/70 ml-1 animate-pulse" />
          )}
        </p>
      </div>

      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10" />
    </div>
  );
}
