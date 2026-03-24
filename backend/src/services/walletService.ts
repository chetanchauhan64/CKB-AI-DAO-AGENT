/**
 * walletService.ts
 * High-level wallet operations: balance, address, and CKB transfers.
 * Uses Lumos TransactionSkeleton to build, sign, and broadcast a basic transfer.
 */

import { TransactionSkeleton, sealTransaction } from '@ckb-lumos/helpers';
import { common } from '@ckb-lumos/common-scripts';
import { getConfig } from '@ckb-lumos/config-manager';
import { parseAddress } from '@ckb-lumos/helpers';
import {
  ensureLumosConfig,
  getWalletAddress,
  getBalanceShannons,
  getDAOCells,
  signMessage,
} from '../blockchain/walletUtils';
import { getRPC, getIndexer } from '../blockchain/ckbClient';
import { shannonsToCKB, ckbToShannons } from '../utils/formatter';
import { logger } from '../utils/logger';

export interface WalletBalance {
  address: string;
  ckbBalance: string;
  ckbBalanceShannons: string;
  daoCellCount: number;
  depositedCount: number;
  withdrawingCount: number;
}

export interface SendCKBResult {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountCKB: string;
}

/** Return full wallet status including DAO cell breakdown */
export async function getBalance(): Promise<WalletBalance> {
  const address = getWalletAddress();
  const [shannons, daoCells] = await Promise.all([
    getBalanceShannons(address),
    getDAOCells(address),
  ]);
  return {
    address,
    ckbBalance: shannonsToCKB(shannons),
    ckbBalanceShannons: shannons.toString(),
    daoCellCount: daoCells.length,
    depositedCount: daoCells.filter((c) => c.status === 'deposited').length,
    withdrawingCount: daoCells.filter((c) => c.status === 'withdrawing').length,
  };
}

/** Return the agent wallet's CKB Testnet address */
export function getAddress(): { address: string } {
  return { address: getWalletAddress() };
}

/**
 * sendCKB — build a standard CKB transfer transaction using Lumos,
 * sign with the wallet private key, and broadcast to the network.
 *
 * @param toAddress  Recipient CKB address (ckt1… for testnet)
 * @param amountCKB  Amount to send in CKB (1 CKB = 100,000,000 shannons)
 */
export async function sendCKB(toAddress: string, amountCKB: number): Promise<SendCKBResult> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const rpc = getRPC();

  const fromAddress = getWalletAddress();
  const amountShannons = ckbToShannons(amountCKB);

  // CKB requires each cell to hold at least 61 CKB for capacity
  const MIN_OUTPUT = 6100000000n; // 61 CKB in shannons
  if (amountShannons < MIN_OUTPUT) {
    throw new Error(`Minimum send amount is 61 CKB (each cell requires 61 CKB capacity). Got: ${amountCKB} CKB.`);
  }

  logger.info({ fromAddress, toAddress, amountCKB }, '[walletService] sendCKB building tx');

  // CRITICAL FIX: Wrapped provider ensures we only spend pure CKB cells
  // and do not accidentally dissolve locked DAO or SUDT cells to pay for this transfer.
  const pureCkbProvider = {
    collector: (queries: any) => indexer.collector({ ...queries, type: 'empty' }),
  };

  let txSkeleton = TransactionSkeleton({ cellProvider: pureCkbProvider });
  const toLock = parseAddress(toAddress, { config });

  try {
    // common.transfer handles input selection, change calculation
    txSkeleton = await common.transfer(
      txSkeleton,
      [fromAddress],
      toAddress,
      amountShannons,
      undefined, // tipHeader (optional, for since calculations)
      undefined, // options
      { config },
    );

    // Pay fee at 1000 shannons/KB
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [fromAddress], 1000n, undefined, { config });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to assemble CKB transfer');
    throw new Error(`Failed to build transfer transaction. Ensure you have enough available (unlocked) CKB. Error: ${err.message || String(err)}`);
  }

  // Sign all entries
  const skeleton = common.prepareSigningEntries(txSkeleton, { config });
  const signatures = skeleton
    .get('signingEntries')
    .map((entry) => signMessage(entry.message))
    .toArray();

  const signedTx = sealTransaction(skeleton, signatures);
  const txHash = await rpc.sendTransaction(signedTx, 'passthrough');

  logger.info({ txHash, toAddress, amountCKB }, '[walletService] sendCKB broadcast');

  return {
    txHash,
    fromAddress,
    toAddress,
    amountCKB: String(amountCKB),
  };
}
