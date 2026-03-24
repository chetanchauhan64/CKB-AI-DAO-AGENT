import { Router, Request, Response, NextFunction } from 'express';
import { getScheduler } from '../automation/Scheduler';
import {
  schedulePayment,
  cancelPayment,
  listPayments,
  getPayment,
} from '../automation/paymentScheduler';
import { validateAddress, validateAmount, validateCronExpression, assertValid } from '../utils/validator';

const router = Router();

// ─── DAO Auto-Harvest ──────────────────────────────────────────────────────

/** POST /api/v1/schedule/harvest — enable/disable auto-harvest */
router.post('/harvest', (req: Request, res: Response) => {
  const { enabled, threshold_epochs = 5 } = req.body as {
    enabled: boolean;
    threshold_epochs?: number;
  };
  const scheduler = getScheduler();
  if (enabled) {
    scheduler.enableAutoHarvest(threshold_epochs);
  } else {
    scheduler.disableAutoHarvest();
  }
  res.json({ success: true, data: scheduler.getAutoHarvestStatus() });
});

/** GET /api/v1/schedule/harvest/status — current auto-harvest config */
router.get('/harvest/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: getScheduler().getAutoHarvestStatus() });
});

/** GET /api/v1/schedule/jobs — all active cron jobs */
router.get('/jobs', (_req: Request, res: Response) => {
  res.json({ success: true, data: getScheduler().listJobs() });
});

// ─── Scheduled Payments ──────────────────────────────────────────────────────

/**
 * POST /api/v1/schedule/payment
 * Schedule a recurring CKB transfer.
 * Body: { to: string, amount_ckb: number, cron: string, label?: string }
 */
router.post('/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, amount_ckb, cron, label = 'Scheduled payment' } = req.body as {
      to: string;
      amount_ckb: number;
      cron: string;
      label?: string;
    };

    assertValid({
      to: validateAddress(to),
      amount_ckb: validateAmount(amount_ckb, 61),
      cron: validateCronExpression(cron),
    });

    const id = schedulePayment(to, amount_ckb, cron, label);
    res.status(201).json({ success: true, data: { id, to, amount_ckb, cron, label } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/schedule/payments — list all scheduled payments */
router.get('/payments', (_req: Request, res: Response) => {
  res.json({ success: true, data: listPayments() });
});

/** GET /api/v1/schedule/payment/:id — single payment by ID */
router.get('/payment/:id', (req: Request, res: Response) => {
  const payment = getPayment(req.params.id);
  if (!payment) {
    res.status(404).json({ success: false, error: `Payment job not found: ${req.params.id}` });
    return;
  }
  res.json({ success: true, data: payment });
});

/** DELETE /api/v1/schedule/payment/:id — cancel a scheduled payment */
router.delete('/payment/:id', (req: Request, res: Response) => {
  const removed = cancelPayment(req.params.id);
  if (!removed) {
    res.status(404).json({ success: false, error: `Payment job not found: ${req.params.id}` });
    return;
  }
  res.json({ success: true, data: { id: req.params.id, cancelled: true } });
});

export default router;
