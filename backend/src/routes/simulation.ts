import { Router } from 'express';
import { simulationState } from '../config/simulation';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, enabled: simulationState.enabled });
});

router.post('/', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    simulationState.enabled = enabled;
    logger.info({ enabled }, 'Simulation Mode toggled');
  }
  res.json({ success: true, enabled: simulationState.enabled });
});

export default router;
