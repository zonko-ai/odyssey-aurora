import { useState, useEffect, useCallback } from 'react';

const toneColor = (tone) => {
  switch (tone) {
    case 'cautious': return 'bg-teal';
    case 'bold': return 'bg-amber';
    case 'creative': return 'bg-cyan';
    default: return 'bg-neutral-500';
  }
};

export default function ChoicePanel({ choices, isVisible, onChoice }) {
  const [highlighted, setHighlighted] = useState(0);

  // Reset highlight when choices change
  useEffect(() => {
    setHighlighted(0);
  }, [choices]);

  // Keyboard navigation — skip when typing in an input
  const handleKeyDown = useCallback((e) => {
    if (!isVisible || !choices || choices.length === 0) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((prev) => (prev - 1 + choices.length) % choices.length);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((prev) => (prev + 1) % choices.length);
        break;
      case 'Enter':
        e.preventDefault();
        onChoice(choices[highlighted]);
        break;
      case '1':
        if (choices[0]) onChoice(choices[0]);
        break;
      case '2':
        if (choices[1]) onChoice(choices[1]);
        break;
      case '3':
        if (choices[2]) onChoice(choices[2]);
        break;
      default:
        break;
    }
  }, [isVisible, choices, highlighted, onChoice]);

  useEffect(() => {
    if (!isVisible) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleKeyDown]);

  if (!isVisible || !choices || choices.length === 0) return null;

  return (
    <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-3 px-8">
      {/* Gradient backdrop for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent -z-10 pointer-events-none" />

      {choices.map((choice, i) => (
        <button
          key={choice.id}
          onClick={() => onChoice(choice)}
          onMouseEnter={() => setHighlighted(i)}
          className={`glass w-full max-w-2xl px-6 py-4 text-left transition-all duration-200
            ${highlighted === i ? 'border-cyan/40 glow-cyan scale-[1.02]' : 'hover:border-white/20'}
            animate-fade-in`}
          style={{
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-cyan/60 w-6">{i + 1}</span>
            <span className="text-base text-neutral-200">{choice.text}</span>
            {/* Tone indicator dot */}
            <span className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${toneColor(choice.tone)}`} />
          </div>
        </button>
      ))}
    </div>
  );
}
