import { Router, Request, Response, NextFunction } from 'express';
import { getWalletAddress, getDAOCells } from '../blockchain/walletUtils';
import { depositToDAO, phase1Withdraw, phase2Unlock, calculateDAOReward, getCurrentEpochInfo } from '../blockchain/daoScripts';

const router = Router();

router.get('/cells', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const address = getWalletAddress();
    const cells = await getDAOCells(address);
    res.json({ success: true, data: { cells, count: cells.length } });
  } catch (err) {
    next(err);
  }
});

router.get('/epoch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const epochInfo = await getCurrentEpochInfo();
    res.json({ success: true, data: epochInfo });
  } catch (err) {
    next(err);
  }
});

router.post('/deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount_ckb } = req.body as { amount_ckb: number };
    if (!amount_ckb || amount_ckb < 102) {
      res.status(400).json({ success: false, error: 'amount_ckb must be at least 102' });
      return;
    }
    const result = await depositToDAO(amount_ckb);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/withdraw/phase1', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deposit_tx_hash, deposit_index = 0 } = req.body as {
      deposit_tx_hash: string;
      deposit_index?: number;
    };
    const result = await phase1Withdraw(deposit_tx_hash, deposit_index);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/withdraw/phase2', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { withdraw_tx_hash, withdraw_index = 0, deposit_tx_hash, deposit_index = 0 } =
      req.body as {
        withdraw_tx_hash: string;
        withdraw_index?: number;
        deposit_tx_hash: string;
        deposit_index?: number;
      };
    const result = await phase2Unlock(withdraw_tx_hash, withdraw_index, deposit_tx_hash, deposit_index);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/rewards/:txHash/:index', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { txHash, index } = req.params;
    const result = await calculateDAOReward(txHash, parseInt(index, 10));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
