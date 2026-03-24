import type { AgentMessage } from '../../../shared/types/agent';
import { env } from '../config/env';

/**
 * AgentMemory: maintains a rolling conversation window per session.
 * Uses an in-memory Map keyed by sessionId.
 */

const sessions = new Map<string, AgentMessage[]>();

export class AgentMemory {
  private readonly sessionId: string;
  private readonly maxWindow: number;

  constructor(sessionId: string, maxWindow = env.agentMemoryWindow) {
    this.sessionId = sessionId;
    this.maxWindow = maxWindow;
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
  }

  getHistory(): AgentMessage[] {
    return sessions.get(this.sessionId) ?? [];
  }

  addMessage(message: AgentMessage): void {
    const history = sessions.get(this.sessionId) ?? [];
    history.push(message);

    // Trim to window (keep most recent N messages)
    if (history.length > this.maxWindow) {
      history.splice(0, history.length - this.maxWindow);
    }
    sessions.set(this.sessionId, history);
  }

  clear(): void {
    sessions.set(this.sessionId, []);
  }

  /** Convert to OpenAI message format */
  toOpenAIMessages(): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return this.getHistory()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  static listSessions(): string[] {
    return Array.from(sessions.keys());
  }

  static clearAll(): void {
    sessions.clear();
  }
}
