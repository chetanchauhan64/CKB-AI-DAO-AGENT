/**
 * tools/index.ts
 * Tool executor — maps Claude tool names to service layer calls.
 *
 * Architecture:  AgentRunner → executeTool → services/ → blockchain/
 *
 * NO direct imports from blockchain/ allowed here.
 * All blockchain actions go through the service layer.
 */

import { getBalance, sendCKB } from '../../services/walletService';
import {
  deposit,
  withdraw,
  unlock,
  listCells,
  rewardEstimate,
  epochInfo,
  harvestAll,
} from '../../services/daoService';
import { getNetworkInfo } from '../../services/ckbService';
import { getScheduler } from '../../automation/Scheduler';
import { GlobalMemoryStore } from '../MemoryStore';

export async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {

    // ── Wallet ──────────────────────────────────────────────────────────────

    /** get_balance → walletService.getBalance() */
    case 'get_balance': {
      return getBalance();
    }

    /** send_ckb → walletService.sendCKB(to, amount) */
    case 'send_ckb': {
      const to = input.to_address as string;
      const amount = input.amount_ckb as number;
      return sendCKB(to, amount);
    }

    // ── DAO ─────────────────────────────────────────────────────────────────

    /**
     * deposit_dao → daoService.deposit(amountCKB)
     * Also handles legacy tool name 'deposit' for backward compat.
     */
    case 'deposit_dao':
    case 'deposit': {
      const amount = input.amount_ckb as number;
      return deposit(amount);
    }

    /**
     * withdraw_dao → daoService.withdraw(txHash, index)
     * Phase 1: deposit cell → withdrawing cell.
     * Also handles legacy name 'withdraw_phase1'.
     */
    case 'withdraw_dao':
    case 'withdraw_phase1': {
      const txHash = input.deposit_tx_hash as string;
      const index = (input.deposit_index as number) ?? 0;
      return withdraw(txHash, index);
    }

    /**
     * unlock_dao → daoService.unlock(...)
     * Phase 2: claim CKB + rewards after 180-epoch lock.
     * Also handles legacy name 'withdraw_phase2'.
     */
    case 'unlock_dao':
    case 'withdraw_phase2': {
      const wTx = input.withdraw_tx_hash as string;
      const wIdx = (input.withdraw_index as number) ?? 0;
      const dTx = input.deposit_tx_hash as string;
      const dIdx = (input.deposit_index as number) ?? 0;
      return unlock(wTx, wIdx, dTx, dIdx);
    }

    /** list_dao_cells → daoService.listCells() */
    case 'list_dao_cells': {
      return listCells();
    }

    /** calculate_rewards → daoService.rewardEstimate(txHash, index) */
    case 'calculate_rewards': {
      const txHash = input.deposit_tx_hash as string;
      const index = (input.deposit_index as number) ?? 0;
      return rewardEstimate(txHash, index);
    }

    /** get_epoch_info → daoService.epochInfo() */
    case 'get_epoch_info': {
      return epochInfo();
    }

    /** harvest_dao → daoService.harvestAll() */
    case 'harvest_dao': {
      return harvestAll();
    }

    // ── Automation ──────────────────────────────────────────────────────────

    /** schedule_harvest → Scheduler.enableAutoHarvest / disableAutoHarvest */
    case 'schedule_harvest': {
      const enabled = input.enabled as boolean;
      const threshold = (input.threshold_epochs as number) ?? 5;
      const scheduler = getScheduler();
      if (enabled) {
        scheduler.enableAutoHarvest(threshold);
        return {
          status: 'enabled',
          threshold_epochs: threshold,
          message: `Auto-harvest enabled. Triggers Phase 1 when within ${threshold} epochs of cycle end.`,
        };
      }
      scheduler.disableAutoHarvest();
      return { status: 'disabled', message: 'Auto-harvest disabled.' };
    }

    // ── Network ─────────────────────────────────────────────────────────────

    /** get_network_info → ckbService.getNetworkInfo() */
    case 'get_network_info': {
      return getNetworkInfo();
    }

    // ── Memory / Agent Rules ──────────────────────────────────────────────────
    
    case 'save_preference': {
      const key = String(input.key);
      const value = String(input.value);
      GlobalMemoryStore.savePreference(key, value);
      return { status: 'saved', key, value, message: 'Added to Agent Global Memory state successfully.' };
    }

    case 'add_automation_rule': {
      const rule = String(input.rule_description);
      GlobalMemoryStore.addRule(rule);
      return { status: 'saved', rule, message: 'Injected natural language rule into Live Runtime Context parameters.' };
    }

    // ── Educational ─────────────────────────────────────────────────────────

    /** explain_dao → static content, no blockchain call */
    case 'explain_dao': {
      const topic = (input.topic as string) ?? 'overview';
      return explainDAO(topic);
    }

    default:
      throw new Error(
        `Unknown tool: "${name}". Known tools: get_balance, send_ckb, deposit_dao, withdraw_dao, unlock_dao, list_dao_cells, calculate_rewards, get_epoch_info, harvest_dao, schedule_harvest, explain_dao, get_network_info`,
      );
  }
}

// ── Static Explanations ────────────────────────────────────────────────────

function explainDAO(topic: string): { topic: string; explanation: string } {
  const explanations: Record<string, string> = {
    overview:
      'The Nervos DAO is a smart contract on CKB that acts as an inflation shelter. By depositing CKB, you receive a share of secondary issuance (1.344B CKB/yr), keeping your holdings value-stable relative to total supply.',
    deposit:
      'To deposit: create a transaction with an output using the DAO type script and 8 zero bytes of data. Minimum 102 CKB. Rewards accrue immediately per block.',
    withdrawal:
      'Two-phase withdrawal. Phase 1 transforms deposit cell → withdrawing cell. Phase 2 claims CKB + rewards after the 180-epoch (~30 day) lock period.',
    rewards:
      'Rewards = (freeCapacity × AR_withdraw / AR_deposit) − freeCapacity. freeCapacity = deposit − 102 CKB (storage cost). AR is the accumulated rate in block headers.',
    epochs:
      'One epoch ≈ 4 hours. 180 epochs ≈ 30 days. Deposits auto-roll into the next cycle if not withdrawn by cycle end.',
    all:
      'Nervos DAO: deposit CKB → earn secondary issuance rewards → withdraw in two phases after 180 epochs. An inflation hedge using accumulated rate (AR) from block headers.',
  };

  return {
    topic,
    explanation: explanations[topic] ?? explanations['overview'],
  };
}
