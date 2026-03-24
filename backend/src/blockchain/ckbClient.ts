import { RPC } from '@ckb-lumos/rpc';
import { Indexer } from '@ckb-lumos/ckb-indexer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let _rpc: RPC | null = null;
let _indexer: Indexer | null = null;

export function getRPC(): RPC {
  if (!_rpc) {
    _rpc = new RPC(env.ckbRpcUrl);
    logger.info({ url: env.ckbRpcUrl }, 'CKB RPC client initialized');
  }
  return _rpc;
}

export function getIndexer(): Indexer {
  if (!_indexer) {
    _indexer = new Indexer(env.ckbIndexerUrl, env.ckbRpcUrl);
    logger.info({ url: env.ckbIndexerUrl }, 'CKB Indexer client initialized');
  }
  return _indexer;
}

/**
 * Simple exponential backoff retry for RPC calls
 */
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        logger.error({ error, attempt }, 'RPC operation failed after max retries');
        throw error;
      }
      logger.warn({ error: String(error), attempt }, `RPC operation failed, retrying...`);
      await new Promise((res) => setTimeout(res, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
}

export async function getTipHeader() {
  return withRetry(() => getRPC().getTipHeader());
}

export async function getHeader(blockHash: string) {
  return withRetry(() => getRPC().getHeader(blockHash));
}

export async function getTransaction(txHash: string) {
  return withRetry(() => getRPC().getTransaction(txHash));
}

export async function sendTransaction(tx: Parameters<RPC['sendTransaction']>[0]) {
  return withRetry(() => getRPC().sendTransaction(tx, 'passthrough'));
}

/**
 * Parse the `ar` (accumulated rate) from a block header's dao field.
 * The dao field is a 32-byte hex string: [C (8 bytes), AR (8 bytes), S (8 bytes), U (8 bytes)]
 * AR is stored as a little-endian uint64 at bytes [8..16]
 */
export function parseAccumulatedRate(daoField: string): bigint {
  // daoField format: "0x" + 64 hex chars
  const hex = daoField.slice(2); // remove 0x
  // AR is bytes 8-15 (LE uint64), chars 16-31
  const arHex = hex.slice(16, 32);
  // Reverse bytes for little-endian
  const arBytes = arHex.match(/.{2}/g)!.reverse().join('');
  return BigInt('0x' + arBytes);
}

/**
 * Parse epoch from a packed epoch value (used in since field and header epoch)
 */
export function parseEpoch(epochHex: string): { number: bigint; index: bigint; length: bigint } {
  const epoch = BigInt(epochHex);
  const length = (epoch >> 40n) & 0xffffn;
  const index = (epoch >> 24n) & 0xffffn;
  const number = epoch & 0xffffffn;
  return { number, index, length };
}
