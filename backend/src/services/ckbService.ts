/**
 * ckbService.ts
 * Low-level CKB network operations: chain info, raw transaction helpers.
 * Routes and higher-level services call this instead of accessing the RPC directly.
 */

import { getRPC } from '../blockchain/ckbClient';
import { logger } from '../utils/logger';

export interface NetworkInfo {
  chain: string;
  tipBlockNumber: string;
  tipBlockHash: string;
  isMainnet: boolean;
}

/**
 * Returns basic info about the connected CKB node.
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const rpc = getRPC();
  const [info, tipHeader] = await Promise.all([
    rpc.getBlockchainInfo(),
    rpc.getTipHeader(),
  ]);

  logger.debug({ chain: info.chain, tip: tipHeader.number }, 'getNetworkInfo');

  return {
    chain: info.chain,
    tipBlockNumber: tipHeader.number,
    tipBlockHash: tipHeader.hash,
    isMainnet: info.chain === 'ckb',
  };
}

/**
 * Fetch a single transaction by hash.
 * Throws a descriptive error if the hash is not found.
 */
export async function getTransactionById(txHash: string) {
  const rpc = getRPC();
  const result = await rpc.getTransaction(txHash);
  if (!result) throw new Error(`Transaction not found: ${txHash}`);
  return result;
}

/**
 * Get the full block at a given block hash.
 */
export async function getBlockByHash(blockHash: string) {
  const rpc = getRPC();
  const block = await rpc.getBlock(blockHash);
  if (!block) throw new Error(`Block not found: ${blockHash}`);
  return block;
}

/**
 * Polls the network to wait for a transaction to definitely commit.
 * Yields true if committed, false if it times out after maxAttempts.
 */
export async function waitForTransactionConfirmation(
  txHash: string,
  maxAttempts = 20,
  delayMs = 3000
): Promise<boolean> {
  const rpc = getRPC();
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tx = await rpc.getTransaction(txHash);
    if (tx?.txStatus?.status === 'committed') {
      logger.info({ txHash, attempt }, 'Transaction definitively committed');
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  logger.warn({ txHash, maxAttempts }, 'Transaction confirmation timed out');
  return false;
}
