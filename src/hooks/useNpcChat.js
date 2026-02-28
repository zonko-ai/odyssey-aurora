// ─── useNpcChat — Multi-turn NPC conversation with Odyssey visual reactions ──
// Manages chat state, Gemini message history, and visual feedback for NPC dialogs.

import { useState, useCallback, useRef } from 'react';
import { NPCS, buildNpcSystemPrompt, buildNpcInteractPrompt } from '../engine/storyBible.js';
import { generateNpcResponse } from '../engine/geminiService.js';

// Max messages kept in Gemini history to avoid token limits
const MAX_HISTORY = 20;

/**
 * @param {Object} options
 * @param {string} options.sceneContext — current scene's narrativeContext
 * @param {Object} options.audioEngine — audioEngine singleton ref
 * @param {Object} options.odysseyManager — odysseyManager singleton ref
 */
export default function useNpcChat({ sceneContext, audioEngine, odysseyManager }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentNpc, setCurrentNpc] = useState(null);

  // Refs to avoid stale closures and unnecessary re-renders
  const systemPromptRef = useRef('');
  const npcRef = useRef(null);
  const messagesRef = useRef([]); // mirrors messages state for async access

  // ── Build Gemini-compatible message history from display messages ──────
  const buildGeminiMessages = useCallback((displayMessages) => {
    // Gemini expects role 'user' or 'model', we store 'user' and 'npc'
    const recent = displayMessages.slice(-MAX_HISTORY);
    return recent.map((msg) => ({
      role: msg.role === 'npc' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));
  }, []);

  // ── Open chat with an NPC ─────────────────────────────────────────────
  const openChat = useCallback((npcId) => {
    const npc = NPCS[npcId];
    if (!npc) {
      console.warn(`[useNpcChat] NPC "${npcId}" not found in storyBible`);
      return;
    }

    npcRef.current = npc;
    setCurrentNpc(npc);
    setIsOpen(true);
    setIsTyping(false);

    // Initialize with NPC greeting
    const initial = [{ role: 'npc', text: npc.greeting, emotion: 'neutral' }];
    messagesRef.current = initial;
    setMessages(initial);

    // Build and cache system prompt
    systemPromptRef.current = buildNpcSystemPrompt(npc, sceneContext);

    // Visual reaction — NPC appears
    if (odysseyManager) {
      const interactPrompt = buildNpcInteractPrompt(npc.name, 'neutral');
      odysseyManager.interact(interactPrompt);
    }

    // SFX
    if (audioEngine) audioEngine.playSfx('chat-open');
  }, [sceneContext, audioEngine, odysseyManager]);

  // ── Close chat ────────────────────────────────────────────────────────
  const closeChat = useCallback(() => {
    setIsOpen(false);
    messagesRef.current = [];
    setMessages([]);
    setCurrentNpc(null);
    setIsTyping(false);
    npcRef.current = null;
    systemPromptRef.current = '';

    if (audioEngine) audioEngine.playSfx('chat-close');
  }, [audioEngine]);

  // ── Helper to update both messages state and ref in sync ───────────────
  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  // ── Send a message to the NPC ─────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !npcRef.current) return;

    const npc = npcRef.current;
    const userMsg = { role: 'user', text: text.trim() };

    // Append user message (updates both state and ref)
    updateMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Build Gemini message history from the ref (always current)
      const geminiMessages = buildGeminiMessages(messagesRef.current);

      // Call Gemini for NPC response
      const { text: responseText, emotion } = await generateNpcResponse(
        geminiMessages,
        systemPromptRef.current,
      );

      // Append NPC response, trim if over limit
      const npcMsg = { role: 'npc', text: responseText, emotion: emotion || 'neutral' };
      updateMessages((prev) => {
        const updated = [...prev, npcMsg];
        return updated.length > MAX_HISTORY * 2 ? updated.slice(-MAX_HISTORY * 2) : updated;
      });

      // Visual reaction on Odyssey
      if (odysseyManager) {
        const interactPrompt = buildNpcInteractPrompt(npc.name, emotion || 'neutral');
        odysseyManager.interact(interactPrompt);
      }
    } catch (err) {
      console.error('[useNpcChat] sendMessage error:', err);
      // Show error placeholder — user can retry
      updateMessages((prev) => [
        ...prev,
        { role: 'npc', text: '...', emotion: 'concerned' },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [buildGeminiMessages, updateMessages, odysseyManager]);

  return {
    isOpen,
    messages,
    isTyping,
    currentNpc,
    openChat,
    closeChat,
    sendMessage,
  };
}
