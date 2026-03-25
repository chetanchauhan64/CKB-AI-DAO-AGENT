import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './utils/logger';
import { SocketManager } from './websocket/SocketManager';
import { getScheduler } from './automation/Scheduler';
import { ensureLumosConfig } from './blockchain/walletUtils';

// Routes
import chatRouter from './routes/chat';
import walletRouter from './routes/wallet';
import daoRouter from './routes/dao';
import scheduleRouter from './routes/schedule';
import agentRouter from './routes/agentRoutes';
import simulationRouter from './routes/simulation';
import { errorHandler, notFound } from './middleware/errorHandler';

async function bootstrap() {
  // Initialize CKB Lumos config
  ensureLumosConfig();

  const app = express();
  const httpServer = http.createServer(app);

  // Middleware
  // FRONTEND_URL accepts comma-separated origins, e.g.:
  //   https://ckb-ai-agent.vercel.app,https://ckb-ai-agent-git-main-alexanon88.vercel.app
  const configuredOrigins = env.frontendUrl
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = new Set([
    ...configuredOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ]);

  // Also allow any Vercel preview/branch deployment URL for this project
  const VERCEL_PREVIEW_RE = /^https:\/\/ckb-ai-agent[\w-]*\.vercel\.app$/;

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no Origin header (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin) || VERCEL_PREVIEW_RE.test(origin)) {
          callback(null, true);
        } else {
          logger.warn({ origin }, 'CORS blocked request');
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_, res) =>
    res.json({ status: 'ok', network: env.ckbNetwork, timestamp: new Date().toISOString() }),
  );

  // API routes
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/agent', agentRouter);      // Agent status, tools, chat
  app.use('/api/v1/wallet', walletRouter);
  app.use('/api/v1/dao', daoRouter);
  app.use('/api/v1/schedule', scheduleRouter);
  app.use('/api/v1/simulation', simulationRouter);

  // 404 + global error handler
  app.use(notFound);
  app.use(errorHandler);

  // Initialize WebSocket
  new SocketManager(httpServer);

  // Start automation scheduler
  getScheduler().start();

  // Start HTTP server
  httpServer.listen(env.port, () => {
    logger.info(
      { port: env.port, network: env.ckbNetwork, rpc: env.ckbRpcUrl },
      '🚀 CKB DAO Agent backend started',
    );

    // ── Keep-warm ping (Render free tier spins down after ~15min inactivity) ──
    // Self-pings /health every 14 minutes so the instance stays alive.
    // Only runs in production — no noise in local dev.
    if (env.nodeEnv === 'production') {
      const KEEP_WARM_MS = 14 * 60 * 1000; // 14 minutes
      const selfUrl = `http://localhost:${env.port}/health`;
      const keepWarmTimer = setInterval(() => {
        http.get(selfUrl, (res) => {
          logger.debug({ status: res.statusCode }, '🔥 Keep-warm ping sent');
          res.resume(); // drain the response so socket closes cleanly
        }).on('error', (err) => {
          logger.warn({ err: err.message }, 'Keep-warm ping failed');
        });
      }, KEEP_WARM_MS);

      // Clean up on graceful shutdown
      process.on('SIGTERM', () => clearInterval(keepWarmTimer));
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down');
    getScheduler().destroy();
    httpServer.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
