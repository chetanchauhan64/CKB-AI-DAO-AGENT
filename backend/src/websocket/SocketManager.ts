import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { WebSocketEventType } from '../../../shared/types/agent';

let _io: SocketIOServer | null = null;

export class SocketManager {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    // Match the same allowed origins as Express CORS
    const configuredOrigins = env.frontendUrl
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedOrigins = new Set([
      ...configuredOrigins,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
    ]);
    const VERCEL_PREVIEW_RE = /^https:\/\/ckb-ai-agent[\w-]*\.vercel\.app$/;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.has(origin) || VERCEL_PREVIEW_RE.test(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Socket.io CORS: origin ${origin} not allowed`));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info({ id: socket.id }, 'WebSocket client connected');

      socket.on('subscribe', (data: { sessionId?: string }) => {
        if (data.sessionId) {
          socket.join(data.sessionId);
          logger.info({ id: socket.id, room: data.sessionId }, 'Client joined session room');
        }
      });

      socket.on('disconnect', () => {
        logger.info({ id: socket.id }, 'WebSocket client disconnected');
      });
    });

    _io = this.io;
  }

  /** Broadcast an event to ALL connected clients */
  broadcast(type: WebSocketEventType | string, payload: Record<string, unknown>): void {
    this.io.emit('event', { type, payload, timestamp: Date.now() });
  }

  /** Emit an event to a specific session room */
  toSession(sessionId: string, type: WebSocketEventType | string, payload: Record<string, unknown>): void {
    this.io.to(sessionId).emit('event', { type, payload, timestamp: Date.now() });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

export function getSocketManager(): SocketManager {
  if (!_io) throw new Error('SocketManager not initialized. Call new SocketManager(httpServer) first.');
  // Return a lightweight proxy so callers can broadcast without holding the full instance
  return {
    broadcast: (type: string, payload: Record<string, unknown>) => {
      _io!.emit('event', { type, payload, timestamp: Date.now() });
    },
    toSession: (sessionId: string, type: string, payload: Record<string, unknown>) => {
      _io!.to(sessionId).emit('event', { type, payload, timestamp: Date.now() });
    },
    getIO: () => _io!,
  } as SocketManager;
}
