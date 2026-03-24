import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { DAOMonitor } from './DAOMonitor';

interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  createdAt: number;
  lastRunAt?: number;
  enabled: boolean;
}

class Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private daoMonitor: DAOMonitor;
  private autoHarvestEnabled = env.autoHarvestEnabled;
  private harvestThresholdEpochs = env.harvestThresholdEpochs;

  constructor() {
    this.daoMonitor = new DAOMonitor();
  }

  start(): void {
    // Start the default DAO monitoring job
    this.addJob('dao-monitor', 'DAO Monitor', env.daoMonitorCron, async () => {
      logger.info('DAO Monitor cron tick');
      await this.daoMonitor.tick(this.autoHarvestEnabled, this.harvestThresholdEpochs);
    });
    logger.info('Scheduler started');
  }

  addJob(
    id: string,
    name: string,
    cronExpression: string,
    handler: () => Promise<void>,
  ): string {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const jobId = id ?? uuidv4();

    // Stop existing job with same ID
    this.removeJob(jobId);

    const task = cron.schedule(cronExpression, async () => {
      const job = this.jobs.get(jobId);
      if (job) job.lastRunAt = Date.now();
      try {
        await handler();
      } catch (err) {
        logger.error({ err, jobId }, 'Cron job failed');
      }
    });

    this.jobs.set(jobId, {
      id: jobId,
      name,
      cronExpression,
      task,
      createdAt: Date.now(),
      enabled: true,
    });

    logger.info({ jobId, name, cronExpression }, 'Cron job added');
    return jobId;
  }

  removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.task.stop();
      this.jobs.delete(id);
      logger.info({ id }, 'Cron job removed');
      return true;
    }
    return false;
  }

  listJobs(): Omit<ScheduledJob, 'task'>[] {
    return Array.from(this.jobs.values()).map(({ task, ...rest }) => rest);
  }

  enableAutoHarvest(thresholdEpochs: number): void {
    this.autoHarvestEnabled = true;
    this.harvestThresholdEpochs = thresholdEpochs;
    logger.info({ thresholdEpochs }, 'Auto-harvest enabled');
  }

  disableAutoHarvest(): void {
    this.autoHarvestEnabled = false;
    logger.info('Auto-harvest disabled');
  }

  getAutoHarvestStatus() {
    return {
      enabled: this.autoHarvestEnabled,
      thresholdEpochs: this.harvestThresholdEpochs,
    };
  }

  destroy(): void {
    for (const job of this.jobs.values()) {
      job.task.stop();
    }
    this.jobs.clear();
    logger.info('Scheduler destroyed');
  }
}

// Singleton
let _scheduler: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!_scheduler) _scheduler = new Scheduler();
  return _scheduler;
}
