import { getWalletAddress, getDAOCells, getBalanceShannons } from '../blockchain/walletUtils';
import { getCurrentEpochInfo } from '../blockchain/daoScripts';
import { YieldHarvester } from './YieldHarvester';
import { getSocketManager } from '../websocket/SocketManager';
import { logger } from '../utils/logger';
import type { DaoCell } from '../../../shared/types/dao';

export class DAOMonitor {
  private harvester = new YieldHarvester();

  async tick(autoHarvestEnabled: boolean, thresholdEpochs: number): Promise<void> {
    try {
      const address = getWalletAddress();
      const [cells, epochInfo] = await Promise.all([
        getDAOCells(address),
        getCurrentEpochInfo(),
      ]);

      logger.info(
        { cellCount: cells.length, epoch: epochInfo.currentEpoch, autoHarvestEnabled },
        'DAO Monitor tick',
      );

      // Push epoch info update to all clients
      getSocketManager().broadcast('DAO_MONITOR_TICK', {
        epochInfo,
        cellCount: cells.length,
        timestamp: Date.now(),
      });

      // --- Proactive Alerts ---
      if (cells.length === 0) {
        const freeCKBShannons = await getBalanceShannons(address);
        const freeCKB = Number(freeCKBShannons) / 100_000_000;
        if (freeCKB > 500) {
          getSocketManager().broadcast('AGENT_SUGGESTION', {
            message: `I noticed you have ${Math.floor(freeCKB)} CKB sitting idle. Consider depositing into the Nervos DAO to start earning yield!`,
            timestamp: Date.now(),
          });
        }
      }

      if (!autoHarvestEnabled) return;

      // Check each deposited cell
      for (const cell of cells) {
        if (cell.status === 'deposited') {
          const epochsToNextBoundary = epochInfo.epochsToNextCycleBoundary;

          // Trigger Phase 1 if within threshold
          if (epochsToNextBoundary <= thresholdEpochs) {
            logger.info(
              { outPoint: cell.outPoint, epochsToNextBoundary },
              'Auto-harvest: triggering Phase 1 withdrawal',
            );
            await this.harvester.triggerPhase1(cell);
          }
        } else if (cell.status === 'withdrawing') {
          // Check if Phase 2 is ready (180 epochs have passed)
          // In a real implementation we'd track the timestamp/epoch of phase1
          // For now we emit information so the frontend can show it
          getSocketManager().broadcast('HARVEST_PHASE2_READY', {
            cell,
            message: 'A withdrawing cell may be ready to unlock. Check epochs elapsed.',
          });
        }
      }
    } catch (err) {
      logger.error({ err }, 'DAO Monitor tick failed');
    }
  }
}
