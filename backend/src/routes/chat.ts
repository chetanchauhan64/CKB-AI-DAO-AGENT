import { Router, Request, Response, NextFunction } from 'express';
import { AgentRunner } from '../agent/AgentRunner';
import { getSocketManager } from '../websocket/SocketManager';
import { logger } from '../utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId = 'default' } = req.body as {
      message: string;
      sessionId?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'message is required' });
      return;
    }

    // Wire agent events → WebSocket
    const runner = new AgentRunner(sessionId, (event) => {
      try {
        getSocketManager().toSession(sessionId, event.type, event.data as Record<string, unknown>);
      } catch {
        // SocketManager may not be ready in test environments
      }
    });

    const result = await runner.run(message.trim());

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
