import { useState, useRef, useEffect } from 'react';

export default function NpcChatPanel({ isOpen, messages, isTyping, currentNpc, onClose, onSendMessage }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div
      className={`absolute right-0 top-0 bottom-0 w-[380px] max-w-[85vw] glass-dark flex flex-col z-30
        ${isOpen ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <p className="text-sm font-semibold text-neutral-200">{currentNpc?.name}</p>
          <p className="text-xs text-neutral-500">{currentNpc?.role}</p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 text-lg transition-colors"
        >
          &#x2715;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-cyan/10 text-neutral-200 rounded-br-sm'
                  : 'bg-white/5 text-neutral-300 rounded-bl-sm'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-4 py-2.5 rounded-xl rounded-bl-sm">
              <span className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            maxLength={500}
            placeholder="Speak to the crew..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm
              text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan/30
              transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2.5 bg-cyan/10 text-cyan text-sm rounded-lg border border-cyan/20
              hover:bg-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
