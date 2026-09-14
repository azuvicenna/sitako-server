import cron from 'node-cron';
import logger from '@/utils/core/logger';
import { ensureLockTablesExist } from '@/utils/core/db-lock';
import { runLoanReminderJob } from './loan-reminder.job';

const DEFAULT_SCHEDULE = '0 7 * * *'; // Setiap hari pukul 07:00 WIB
const TIMEZONE = 'Asia/Jakarta';

export const initSchedulers = async (): Promise<void> => {
  try {
    // 1. Ensure required DB lock and log tables exist
    await ensureLockTablesExist();

    const schedule = process.env.CRON_SCHEDULE_REMINDER || DEFAULT_SCHEDULE;

    if (!cron.validate(schedule)) {
      logger.error(
        `[Scheduler] Invalid cron expression: "${schedule}". Schedulers will not be started.`,
      );
      return;
    }

    logger.info(
      `[Scheduler] Initializing Loan Reminder Cronjob with schedule: "${schedule}" (${TIMEZONE})`,
    );

    cron.schedule(
      schedule,
      async () => {
        logger.info(`[Scheduler Triggered] Executing daily loan reminder job...`);
        try {
          await runLoanReminderJob();
        } catch (error) {
          logger.error(`[Scheduler Error] Daily loan reminder job encountered error:`, error);
        }
      },
      {
        timezone: TIMEZONE,
      },
    );

    logger.info('[Scheduler] Schedulers initialized successfully.');
  } catch (error) {
    logger.error('[Scheduler] Failed to initialize schedulers:', error);
  }
};
