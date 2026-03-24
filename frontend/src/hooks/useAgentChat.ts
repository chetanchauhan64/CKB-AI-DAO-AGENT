import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import type { ChatMessage, StrategyRecommendation } from '@/types/agent';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content:
    "👋 Welcome! I'm your **CKB DAO Yield Agent**. I can deposit CKB, manage your Nervos DAO positions, calculate rewards, and automate yield harvesting.\n\nTry a command below or type your own.",
  timestamp: 1711200000000, // Stable timestamp
};

export function useAgentChat(sessionId = 'default') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Set the welcome message on mount only
  useEffect(() => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: Date.now() }]);
  }, []);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null);
  const [handledEvents]         = useState(new Set<string>());

  // ─── WebSocket handlers ───────────────────────────────────────────────────

  const handleMessageChunk = useCallback((eventId: string, chunkText: string) => {
    if (handledEvents.has(eventId)) return;
    handledEvents.add(eventId);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.loading) {
          // First chunk arrived! Clear out the temporary thinking text and start fresh
          return { ...m, content: chunkText, streaming: true, loading: false };
        }
        if (m.streaming) {
          // Append subsequent chunks
          return { ...m, content: m.content + chunkText };
        }
        return m;
      }),
    );
  }, [handledEvents]);
  const handleSuggestionEvent = useCallback(
    (eventId: string, msgText: string) => {
      if (handledEvents.has(eventId)) return;
      handledEvents.add(eventId);

      setMessages((prev) => [
        ...prev,
        {
          id: `suggestion-${eventId}`,
          role: 'assistant',
          content: `💡 **Suggestion:** ${msgText}`,
          timestamp: Date.now(),
        },
      ]);
    },
    [handledEvents],
  );

  const handleSystemMessage = useCallback(
    (eventId: string, msgText: string) => {
      if (handledEvents.has(eventId)) return;
      handledEvents.add(eventId);

      setMessages((prev) => [
        ...prev,
        {
          id: `sysmsg-${eventId}`,
          role: 'assistant',
          content: msgText,
          timestamp: Date.now(),
        },
      ]);
    },
    [handledEvents],
  );

  const handleThinkingEvent = useCallback((msgText: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.loading ? { ...m, content: msgText } : m)),
    );
  }, []);

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const loadingId = `a-loading-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await api.chat(text, sessionId);

      if (result.strategy) setStrategy(result.strategy);

      // The chunks are arriving via WebSocket concurrently.
      // Now that the main REST call resolves, we attach final metadata and turn OFF streaming.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                // Do not overwrite content — it was built up by handleMessageChunk!
                toolCalled:  result.toolCalled,
                txHash:      result.txHash,
                explanation: result.explanation,
                agentFlow:   result.agentFlow,
                loading:     false,
                streaming:   false,
              }
            : m,
        ),
      );

      setIsLoading(false);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content:  `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
                loading:  false,
                streaming: false,
              }
            : m,
        ),
      );
      setIsLoading(false);
    }
  };

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    strategy,
    sendMessage,
    clearChat,
    handleSuggestionEvent,
    handleSystemMessage,
    handleThinkingEvent,
    handleMessageChunk,
  };
}
