// Shared DAO and CKB domain types

export type DaoDepositStatus = 'deposited' | 'withdrawing' | 'unlockable' | 'claimed';

export interface DaoCell {
  outPoint: {
    txHash: string;
    index: string;
  };
  capacity: string;         // raw shannons as string
  capacityCKB: string;      // human-readable CKB
  status: DaoDepositStatus;
  depositBlockNumber?: string;
  withdrawBlockNumber?: string;
  depositEpoch?: EpochInfo;
  currentEpoch?: EpochInfo;
  epochsElapsed?: number;
  epochsRemaining?: number;  // epochs until next unlock window
  estimatedRewardCKB?: string;
  lockSince?: string;
}

export interface EpochInfo {
  number: string;
  index: string;
  length: string;
  // Computed
  epochNumber: number;
  epochFraction: number;   // 0.0 to 1.0 progress within epoch
}

export interface DaoRewardCalculation {
  depositCapacityCKB: string;
  occupiedCapacityCKB: string;
  freeCapacityCKB: string;
  estimatedRewardCKB: string;
  estimatedTotalCKB: string;
  arDeposit: string;
  arCurrent: string;
}

export interface TransactionRecord {
  txHash: string;
  type: 'deposit' | 'phase1_withdraw' | 'phase2_unlock' | 'transfer';
  amountCKB: string;
  rewardCKB?: string;
  status: 'pending' | 'committed' | 'rejected';
  timestamp: number;
  blockNumber?: string;
}
