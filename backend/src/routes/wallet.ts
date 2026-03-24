import { Router, Request, Response, NextFunction } from 'express';
import { getBalance, getAddress, sendCKB } from '../services/walletService';
import { getNetworkInfo } from '../services/ckbService';
import { validateAddress, validateAmount, assertValid } from '../utils/validator';

const router = Router();

/** GET /api/v1/wallet/balance — full wallet status with DAO cell breakdown */
router.get('/balance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await getBalance() });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/wallet/address — returns the agent wallet address */
router.get('/address', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAddress() });
});

/** GET /api/v1/wallet/network — CKB node chain info */
router.get('/network', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await getNetworkInfo() });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/wallet/send
 * Body: { to: string, amount_ckb: number }
 * Sends CKB from the agent wallet to the given address.
 */
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, amount_ckb } = req.body as { to: string; amount_ckb: number };

    assertValid({
      to: validateAddress(to),
      amount_ckb: validateAmount(amount_ckb, 61),
    });

    const result = await sendCKB(to, amount_ckb);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
