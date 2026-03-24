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
  // Allow the configured frontend URL plus localhost:3000 for dev
  const allowedOrigins = new Set([
    env.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ]);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no Origin header (curl, Postman, server-to-server)
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
        } else {
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
