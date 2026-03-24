import { phase1Withdraw } from '../blockchain/daoScripts';
import { getSocketManager } from '../websocket/SocketManager';
import { logger } from '../utils/logger';
import type { DaoCell } from '../../../shared/types/dao';

export class YieldHarvester {
  async triggerPhase1(cell: DaoCell): Promise<void> {
    try {
      const { txHash: depositTxHash, index: depositIndex } = cell.outPoint;
      const indexNum = parseInt(depositIndex, 16);

      getSocketManager().broadcast('HARVEST_INITIATED', {
        depositTxHash,
        depositIndex: indexNum,
        capacityCKB: cell.capacityCKB,
        message: 'Auto-harvest: Phase 1 withdrawal initiated',
      });

      const result = await phase1Withdraw(depositTxHash, indexNum);

      logger.info({ result }, 'Auto-harvest Phase 1 complete');

      getSocketManager().broadcast('TX_BROADCAST', {
        txHash: result.txHash,
        type: 'phase1_withdraw',
        message: `Phase 1 withdrawal broadcast: ${result.txHash}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, cell: cell.outPoint }, 'Auto-harvest Phase 1 failed');
      getSocketManager().broadcast('TX_FAILED', {
        error: message,
        type: 'phase1_withdraw',
      });
    }
  }
}
