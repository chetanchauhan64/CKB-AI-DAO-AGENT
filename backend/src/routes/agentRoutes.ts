/**
 * agentRoutes.ts
 * Agent-specific routes mounted at /api/v1/agent.
 * Provides the /chat endpoint (mirrors routes/chat.ts) plus
 * agent-specific endpoints for status, memory, and tool listing.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AgentRunner } from '../agent/AgentRunner';
import { getSocketManager } from '../websocket/SocketManager';
import { AGENT_TOOLS } from '../agent/ToolRegistry';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/agent/chat
 * Main conversational endpoint — same as /api/v1/chat
 * but mounted under /agent for semantic clarity.
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId = 'default' } = req.body as {
      message: string;
      sessionId?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'message is required' });
      return;
    }

    const runner = new AgentRunner(sessionId, (event) => {
      try {
        getSocketManager().toSession(sessionId, event.type, event.data as Record<string, unknown>);
      } catch {
        // SocketManager may not be ready in test environments
      }
    });

    logger.info({ sessionId, message: message.slice(0, 80) }, 'Agent chat request');

    const result = await runner.run(message.trim());

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/agent/tools
 * Returns the JSON Schema definitions of all available agent tools.
 * Useful for debugging or building a frontend tool-call inspector.
 */
router.get('/tools', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      tools: AGENT_TOOLS,
      count: AGENT_TOOLS.length,
    },
  });
});

/**
 * GET /api/v1/agent/status
 * Returns runtime info about the agent layer.
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      model: process.env.CLAUDE_MODEL ?? 'claude-opus-4-5',
      toolCount: AGENT_TOOLS.length,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
