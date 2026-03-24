/**
 * daoScripts.ts
 * Core DAO transaction logic: deposit, Phase 1 withdraw, Phase 2 unlock.
 * Uses @ckb-lumos/common-scripts dao helpers for correctness.
 */

import { TransactionSkeleton, sealTransaction } from '@ckb-lumos/helpers';
import { dao, common } from '@ckb-lumos/common-scripts';
import { getConfig } from '@ckb-lumos/config-manager';
import type { Cell, Header } from '@ckb-lumos/base';
import {
  getRPC,
  getIndexer,
  parseAccumulatedRate,
  parseEpoch,
} from './ckbClient';
import {
  ensureLumosConfig,
  getWalletAddress,
  signMessage,
} from './walletUtils';
import {
  ckbToShannons,
  shannonsToCKB,
  isDepositCell,
  decodeUint64LE,
} from '../utils/formatter';
import { DAO_CONSTANTS } from '../config/ckb';
import { logger } from '../utils/logger';
import { simulationState } from '../config/simulation';
import type { DaoRewardCalculation } from '../../../shared/types/dao';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function signAndSendSkeleton(
  txSkeleton: ReturnType<typeof TransactionSkeleton>,
  address: string,
): Promise<string> {
  ensureLumosConfig();
  const config = getConfig();

  // Prepare signing entries (computes message hashes)
  let skeleton = common.prepareSigningEntries(txSkeleton, { config });

  // Sign each entry
  const signatures: string[] = skeleton
    .get('signingEntries')
    .map((entry) => signMessage(entry.message))
    .toArray();

  // Seal (attach signatures) and send
  const signedTx = sealTransaction(skeleton, signatures);
  const txHash = await getRPC().sendTransaction(signedTx, 'passthrough');
  return txHash;
}

// ─── Deposit ────────────────────────────────────────────────────────────────

export interface DepositResult {
  txHash: string;
  amountCKB: string;
  address: string;
}

export async function depositToDAO(amountCKB: number): Promise<DepositResult> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const address = getWalletAddress();
  const amountShannons = ckbToShannons(amountCKB);

  if (amountShannons < DAO_CONSTANTS.MIN_DEPOSIT_SHANNONS) {
    throw new Error(
      `Minimum deposit is ${shannonsToCKB(DAO_CONSTANTS.MIN_DEPOSIT_SHANNONS)} CKB. Got ${amountCKB} CKB.`,
    );
  }

  logger.info({ amountCKB, address }, 'Building DAO deposit transaction');

  // CRITICAL FIX: The default Lumos indexer cellProvider will accidentally 
  // sweep existing DAO or SUDT cells to pay for capacity if they are returned first.
  // We must wrap the provider so any underlying injectCapacity exclusively fetches pure CKB.
  const pureCkbProvider = {
    collector: (queries: any) => indexer.collector({ ...queries, type: 'empty' }),
  };

  let txSkeleton = TransactionSkeleton({ cellProvider: pureCkbProvider });

  try {
    // dao.deposit handles: building DAO output, setting type script, filling data=0x00...00
    txSkeleton = await dao.deposit(
      txSkeleton,
      address, // from (pays)
      address, // to (receives DAO cell)
      amountShannons,
      { config },
    );

    // Pay fee automatically
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [address], 1000n, undefined, { config });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to assemble DAO deposit');
    throw new Error(`Failed to build DAO deposit transaction. Insufficient pure CKB capacity: ${err.message || String(err)}`);
  }

  try {
    const txHash = await signAndSendSkeleton(txSkeleton, address);
    logger.info({ txHash, amountCKB }, 'DAO deposit broadcast');

    return { txHash, amountCKB: String(amountCKB), address };
  } catch (err: any) {
    logger.error({ err: err.message, payload: txSkeleton.toJS() }, 'Transaction verification failed');
    throw new Error(`Transaction verification failed. Root cause: ${err.message}`);
  }
}

// ─── Phase 1: Initiate Withdrawal ───────────────────────────────────────────

export interface Phase1Result {
  txHash: string;
  depositTxHash: string;
  depositIndex: string;
}

export async function phase1Withdraw(depositTxHash: string, depositIndex: number): Promise<Phase1Result> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const rpc = getRPC();
  const address = getWalletAddress();

  // Fetch the live deposit cell
  const depositCell = await fetchLiveCell(depositTxHash, depositIndex);

  if (!isDepositCell(depositCell.data)) {
    throw new Error(
      `Cell ${depositTxHash}:${depositIndex} is not a DAO deposit cell (already withdrawing or not a DAO cell)`,
    );
  }

  logger.info({ depositTxHash, depositIndex }, 'Building Phase 1 withdrawal transaction');

  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  try {
    // dao.withdraw: transforms deposit cell → withdrawing cell, adds header_deps
    txSkeleton = await dao.withdraw(txSkeleton, depositCell, address, { config });
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [address], 1000n, undefined, { config });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to assemble Phase 1 withdrawal');
    throw new Error(`Phase 1 transaction failed to build: ${err.message || String(err)}`);
  }

  const txHash = await signAndSendSkeleton(txSkeleton, address);
  logger.info({ txHash }, 'Phase 1 withdrawal broadcast');

  return { txHash, depositTxHash, depositIndex: String(depositIndex) };
}

// ─── Phase 2: Unlock & Claim ─────────────────────────────────────────────────

export interface Phase2Result {
  txHash: string;
  rewardCKB: string;
  totalCKB: string;
}

export async function phase2Unlock(
  withdrawTxHash: string,
  withdrawIndex: number,
  depositTxHash: string,
  depositIndex: number,
): Promise<Phase2Result> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const address = getWalletAddress();

  const withdrawingCell = await fetchLiveCell(withdrawTxHash, withdrawIndex);
  const depositCell = await fetchLiveCell(depositTxHash, depositIndex);

  logger.info({ withdrawTxHash, depositTxHash }, 'Building Phase 2 unlock transaction');

  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  try {
    // dao.unlock: sets since (180 epochs), adds both block headers to header_deps, calculates compensation
    txSkeleton = await dao.unlock(
      txSkeleton,
      depositCell,
      withdrawingCell,
      address, // receives CKB + rewards
      address, // fee payer
      { config },
    );

    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [address], 1000n, undefined, { config });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to assemble Phase 2 unlock');
    throw new Error(`Phase 2 transaction failed to build. Has the 180-epoch lock elapsed? Error: ${err.message || String(err)}`);
  }

  // Calculate reward for the result payload
  const rewards = await calculateDAOReward(depositTxHash, depositIndex);

  const txHash = await signAndSendSkeleton(txSkeleton, address);
  logger.info({ txHash, rewardCKB: rewards.estimatedRewardCKB }, 'Phase 2 unlock broadcast');

  return {
    txHash,
    rewardCKB: rewards.estimatedRewardCKB,
    totalCKB: rewards.estimatedTotalCKB,
  };
}

// ─── Reward Calculation ──────────────────────────────────────────────────────

export async function calculateDAOReward(
  depositTxHash: string,
  depositIndex: number,
): Promise<DaoRewardCalculation> {
  const rpc = getRPC();

  // Get deposit transaction to find its block
  const depositTxResult = await rpc.getTransaction(depositTxHash);
  if (!depositTxResult?.txStatus?.blockHash) {
    throw new Error(`Transaction ${depositTxHash} not yet committed`);
  }

  const depositHeader = await rpc.getHeader(depositTxResult.txStatus.blockHash);
  const currentHeader = await rpc.getTipHeader();

  const depositOutput = depositTxResult.transaction.outputs[depositIndex];
  const capacity = BigInt(depositOutput.capacity);
  const occupiedCapacity = DAO_CONSTANTS.OCCUPIED_CAPACITY_SHANNONS;
  const freeCapacity = capacity > occupiedCapacity ? capacity - occupiedCapacity : 0n;

  const arDeposit = parseAccumulatedRate(depositHeader.dao);
  const arCurrent = parseAccumulatedRate(currentHeader.dao);

  // Formula: freeCapacity * (AR_current / AR_deposit) - freeCapacity
  // To avoid floating point, multiply first: reward = (freeCapacity * arCurrent) / arDeposit - freeCapacity
  const estimatedReward = (freeCapacity * arCurrent) / arDeposit - freeCapacity;
  const estimatedTotal = capacity + estimatedReward;

  return {
    depositCapacityCKB: shannonsToCKB(capacity),
    occupiedCapacityCKB: shannonsToCKB(occupiedCapacity),
    freeCapacityCKB: shannonsToCKB(freeCapacity),
    estimatedRewardCKB: shannonsToCKB(estimatedReward > 0n ? estimatedReward : 0n),
    estimatedTotalCKB: shannonsToCKB(estimatedTotal),
    arDeposit: arDeposit.toString(),
    arCurrent: arCurrent.toString(),
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Fetch a live cell from the indexer by its outpoint */
async function fetchLiveCell(txHash: string, index: number): Promise<Cell> {
  const rpc = getRPC();
  const txResult = await rpc.getTransaction(txHash);

  if (!txResult) throw new Error(`Transaction not found: ${txHash}`);

  const output = txResult.transaction.outputs[index];
  const outputData = txResult.transaction.outputsData[index];

  if (!output) throw new Error(`No output at index ${index} in tx ${txHash}`);

  const indexHex = `0x${index.toString(16)}`;

  return {
    cellOutput: output,
    data: outputData ?? '0x',
    outPoint: { txHash, index: indexHex },
  } as Cell;
}

/** Get current epoch info from tip header */
export async function getCurrentEpochInfo() {
  const rpc = getRPC();
  const tipHeader = await rpc.getTipHeader();
  const epoch = parseEpoch(tipHeader.epoch);
  const blocksToNextEpoch = epoch.length - epoch.index;
  const epochFraction = Number(epoch.index) / Number(epoch.length);

  // Epochs within current DAO cycle (180-epoch cycle)
  const epochsInCycle = Number(epoch.number) % 180;
  const epochsToNextCycle = 180 - epochsInCycle;

  // --- Simulation Mode Override ---
  if (simulationState.enabled) {
    return {
      currentEpoch: Number(epoch.number) + 180,
      epochIndex: Number(epoch.length),
      epochLength: Number(epoch.length),
      epochFraction: 1,
      blocksToNextEpoch: 0,
      epochsInCurrentCycle: 180,
      epochsToNextCycleBoundary: 0,
      tipBlockNumber: tipHeader.number,
      tipBlockHash: tipHeader.hash,
    };
  }

  return {
    currentEpoch: Number(epoch.number),
    epochIndex: Number(epoch.index),
    epochLength: Number(epoch.length),
    epochFraction,
    blocksToNextEpoch: Number(blocksToNextEpoch),
    epochsInCurrentCycle: epochsInCycle,
    epochsToNextCycleBoundary: epochsToNextCycle,
    tipBlockNumber: tipHeader.number,
    tipBlockHash: tipHeader.hash,
  };
}
