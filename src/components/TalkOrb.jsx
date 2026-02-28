export default function TalkOrb({ npc, onClick, isVisible }) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="absolute right-6 bottom-32 w-14 h-14 rounded-full bg-amber/10
        border border-amber/30 flex items-center justify-center
        animate-pulse-glow hover:bg-amber/20 hover:scale-110 transition-all group z-20"
      style={{
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.2), 0 0 40px rgba(245, 158, 11, 0.1)',
      }}
    >
      <svg
        className="w-6 h-6 text-amber"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </svg>

      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10
        text-xs text-neutral-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none">
        Talk to {npc?.name}
      </span>
    </button>
  );
}
