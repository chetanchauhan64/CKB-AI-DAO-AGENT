/**
 * paymentScheduler.ts
 * Schedules recurring CKB transfers using node-cron.
 * Backed by the existing Scheduler singleton (getScheduler).
 */

import { v4 as uuidv4 } from 'uuid';
import { getScheduler } from './Scheduler';
import { getSocketManager } from '../websocket/SocketManager';
import { sendCKB } from '../services/walletService';
import { logger } from '../utils/logger';

export interface ScheduledPayment {
  id: string;
  label: string;
  toAddress: string;
  amountCKB: number;
  cronExpression: string;
  createdAt: number;
}

// In-memory registry of scheduled payments (mirrors cron jobs)
const paymentRegistry = new Map<string, ScheduledPayment>();

/**
 * Schedule a recurring CKB payment.
 * @param toAddress   Recipient CKB address
 * @param amountCKB   Amount in CKB per execution
 * @param cronExpr    Standard cron expression (5-field, e.g. "0 9 * * *" = 9am daily)
 * @param label       Human-readable name for the job
 * @returns           Job ID (use to cancel later)
 */
export function schedulePayment(
  toAddress: string,
  amountCKB: number,
  cronExpr: string,
  label: string,
): string {
  const scheduler = getScheduler();
  const id = uuidv4();
  const meta: ScheduledPayment = {
    id,
    label,
    toAddress,
    amountCKB,
    cronExpression: cronExpr,
    createdAt: Date.now(),
  };

  scheduler.addJob(id, `Payment: ${label}`, cronExpr, async () => {
    logger.info({ id, toAddress, amountCKB, label }, '[paymentScheduler] executing payment');
    try {
      const result = await sendCKB(toAddress, amountCKB);
      getSocketManager().broadcast('TX_BROADCAST', {
        txHash: result.txHash,
        type: 'scheduled_payment',
        label,
        toAddress,
        amountCKB,
        message: `Scheduled payment "${label}" broadcasted: ${result.txHash}`,
      });
      logger.info({ txHash: result.txHash }, '[paymentScheduler] payment sent');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, id, label }, '[paymentScheduler] payment FAILED');
      getSocketManager().broadcast('TX_FAILED', {
        type: 'scheduled_payment',
        label,
        error: message,
      });
    }
  });

  paymentRegistry.set(id, meta);
  logger.info({ id, label, cronExpr, toAddress, amountCKB }, '[paymentScheduler] scheduled');
  return id;
}

/**
 * Cancel a scheduled payment by its job ID.
 */
export function cancelPayment(id: string): boolean {
  const removed = getScheduler().removeJob(id);
  if (removed) paymentRegistry.delete(id);
  return removed;
}

/**
 * List all active scheduled payments.
 */
export function listPayments(): ScheduledPayment[] {
  return Array.from(paymentRegistry.values());
}

/**
 * Get a single scheduled payment by ID, or null.
 */
export function getPayment(id: string): ScheduledPayment | null {
  return paymentRegistry.get(id) ?? null;
}
