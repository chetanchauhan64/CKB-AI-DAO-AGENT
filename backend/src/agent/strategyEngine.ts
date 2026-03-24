import { getWalletAddress, getBalanceShannons, getDAOCells } from '../blockchain/walletUtils';
import { getCurrentEpochInfo } from '../blockchain/daoScripts';
import { logger } from '../utils/logger';
import { StrategyRecommendation } from '../../../shared/types/agent';

export async function analyzePortfolio(address: string) {
  const freeShannons = await getBalanceShannons(address);
  const freeCKB = Number(freeShannons) / 100_000_000;
  
  const cells = await getDAOCells(address);
  const epochInfo = await getCurrentEpochInfo();
  
  return { freeCKB, cells, epochInfo };
}

export async function getRecommendation(address: string): Promise<StrategyRecommendation | null> {
  try {
    const { freeCKB, cells, epochInfo } = await analyzePortfolio(address);

    // Rule 2: If DAO deposit is near maturity
    for (const cell of cells) {
      if (cell.status === 'deposited' && epochInfo.epochsToNextCycleBoundary <= 10) {
        return {
          action: 'HARVEST_RECOMMENDED',
          reason: `A deposit of ${cell.capacityCKB} CKB is within ${epochInfo.epochsToNextCycleBoundary} epochs of cycle maturity.`,
          expectedOutcome: 'Secure yield without waiting another 180 epochs.',
        };
      }
      if (cell.status === 'withdrawing') {
         // Keep it simple without tracking precise epoch math locally in the intelligence engine for phase 2.
         return {
           action: 'UNLOCK_RECOMMENDED',
           reason: 'A Phase 1 withdrawal may be ready to claim its final rewards if 180 epochs have passed.',
           expectedOutcome: 'Funds return to your liquid balance.',
         };
      }
    }

    // Rule 1: If balance > 500 CKB and we want to keep 200 liquid
    if (freeCKB > 500) {
      const depositAmount = Math.floor(freeCKB - 200);
      return {
        action: 'DEPOSIT_RECOMMENDED',
        reason: `You have ${Math.floor(freeCKB)} CKB liquid. Keeping 200 CKB for fees leaves ${depositAmount} CKB idle.`,
        expectedOutcome: `Earn ~2.5% APR on ${depositAmount} CKB shielded from issuance inflation.`,
      };
    }

    // Rule 3: If no DAO deposits exist at all but they have minimum required
    if (cells.length === 0 && freeCKB > 110) {
      return {
        action: 'INITIAL_DEPOSIT_RECOMMENDED',
        reason: 'You have no active yield positions. Minimum deposit is 102 CKB.',
        expectedOutcome: 'Start earning secondary issuance rewards immediately.',
      };
    }

    return {
      action: 'HOLD',
      reason: 'Portfolio is optimally allocated for current balance level.',
      expectedOutcome: 'Maintain current liquidity and yield positions.',
    };
  } catch (err) {
    logger.error({ err }, 'Failed to generate strategy recommendation');
    return null;
  }
}

export async function getStrategySummary(): Promise<StrategyRecommendation | null> {
  const address = getWalletAddress();
  return getRecommendation(address);
}
