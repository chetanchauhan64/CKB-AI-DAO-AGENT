import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  port: parseInt(optionalEnv('PORT', '3001'), 10),
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:3000'),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  // CKB
  ckbRpcUrl: optionalEnv('CKB_RPC_URL', 'https://testnet.ckb.dev/rpc'),
  ckbIndexerUrl: optionalEnv('CKB_INDEXER_URL', 'https://testnet.ckb.dev/indexer'),
  ckbNetwork: optionalEnv('CKB_NETWORK', 'testnet') as 'mainnet' | 'testnet',

  // Wallet
  walletPrivateKey: requireEnv('WALLET_PRIVATE_KEY'),

  // AI Model Config
  openRouterApiKey: requireEnv('OPENROUTER_API_KEY'),
  openRouterModel: optionalEnv('OPENROUTER_MODEL', 'openai/gpt-4o-mini'),

  // Agent
  agentMemoryWindow: parseInt(optionalEnv('AGENT_MEMORY_WINDOW', '20'), 10),

  // Automation
  daoMonitorCron: optionalEnv('DAO_MONITOR_CRON', '*/30 * * * *'),
  harvestThresholdEpochs: parseInt(optionalEnv('HARVEST_THRESHOLD_EPOCHS', '5'), 10),
  autoHarvestEnabled: optionalEnv('AUTO_HARVEST_ENABLED', 'false') === 'true',
} as const;
