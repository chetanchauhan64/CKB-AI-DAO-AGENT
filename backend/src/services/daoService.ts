/**
 * daoService.ts
 * High-level DAO operations for routes and agent tools.
 * Delegates to daoScripts (Lumos transactions) and walletUtils (cell queries).
 */

import {
  depositToDAO,
  phase1Withdraw,
  phase2Unlock,
  calculateDAOReward,
  getCurrentEpochInfo,
  type DepositResult,
  type Phase1Result,
  type Phase2Result,
} from '../blockchain/daoScripts';
import { getWalletAddress, getDAOCells } from '../blockchain/walletUtils';
import { YieldHarvester } from '../automation/YieldHarvester';
import { logger } from '../utils/logger';
import type { DaoRewardCalculation } from '../../../shared/types/dao';

const harvester = new YieldHarvester();

/** Deposit CKB into the Nervos DAO */
export async function deposit(amountCKB: number): Promise<DepositResult> {
  logger.info({ amountCKB }, '[daoService] deposit');
  return depositToDAO(amountCKB);
}

/** Phase 1: initiate withdrawal from DAO deposit cell */
export async function withdraw(
  depositTxHash: string,
  depositIndex: number,
): Promise<Phase1Result> {
  logger.info({ depositTxHash, depositIndex }, '[daoService] phase1Withdraw');
  return phase1Withdraw(depositTxHash, depositIndex);
}

/** Phase 2: unlock and claim rewards after 180-epoch lock */
export async function unlock(
  withdrawTxHash: string,
  withdrawIndex: number,
  depositTxHash: string,
  depositIndex: number,
): Promise<Phase2Result> {
  logger.info({ withdrawTxHash, depositTxHash }, '[daoService] phase2Unlock');
  return phase2Unlock(withdrawTxHash, withdrawIndex, depositTxHash, depositIndex);
}

/** Estimate rewards for a given deposit */
export async function rewardEstimate(
  depositTxHash: string,
  depositIndex: number,
): Promise<DaoRewardCalculation> {
  return calculateDAOReward(depositTxHash, depositIndex);
}

/** List all DAO cells for the agent wallet */
export async function listCells() {
  const address = getWalletAddress();
  const cells = await getDAOCells(address);
  return { cells, count: cells.length };
}

/**
 * harvestAll — find all deposited cells and trigger Phase 1 for each.
 * Used by the automation scheduler and the /harvest REST endpoint.
 */
export async function harvestAll(): Promise<{ triggered: number; skipped: number }> {
  const address = getWalletAddress();
  const cells = await getDAOCells(address);
  const deposited = cells.filter((c) => c.status === 'deposited');

  logger.info({ total: cells.length, deposited: deposited.length }, '[daoService] harvestAll');

  let triggered = 0;
  let skipped = 0;

  for (const cell of deposited) {
    try {
      await harvester.triggerPhase1(cell);
      triggered++;
    } catch {
      skipped++;
    }
  }

  return { triggered, skipped };
}

/** Get current epoch info from the tip header */
export async function epochInfo() {
  return getCurrentEpochInfo();
}
