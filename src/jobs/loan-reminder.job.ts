import { and, eq, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { books, members, reminderLogs, transactions } from '@/db/schema';
import { updateTransactionById } from '@/repositories/librarian/transaction.repository';
import {
  notifyLoanReminder,
  formatIndonesianDate,
} from '@/services/notification/email-notification.service';
import type { LoanReminderType } from '@/templates/emails/loan-reminder.template';
import { acquireDbLock, releaseDbLock, getInstanceId } from '@/utils/core/db-lock';
import { generateId } from '@/utils/generators/ulid';
import logger from '@/utils/core/logger';

export interface LoanReminderJobResult {
  processedCount: number;
  statusUpdatedCount: number;
  remindersSentCount: number;
  skippedDueToLock: boolean;
}

/**
 * Calculates whole calendar days difference between today and dueDate.
 * (today - dueDate) in whole days.
 * > 0 means overdue.
 * < 0 means due in future.
 * === 0 means due today.
 */
export const calculateCalendarDaysDiff = (today: Date, dueDate: Date): number => {
  const d1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
};

/**
 * Core business logic to run loan return reminders and status updates.
 */
export const runLoanReminderJob = async (): Promise<LoanReminderJobResult> => {
  const instanceId = getInstanceId();
  const lockAcquired = await acquireDbLock('daily-loan-reminder', instanceId, 3600);

  if (!lockAcquired) {
    logger.info(
      `[Loan Reminder Scheduler] Job is already running on another instance/pod (${instanceId} skipped).`,
    );
    return {
      processedCount: 0,
      statusUpdatedCount: 0,
      remindersSentCount: 0,
      skippedDueToLock: true,
    };
  }

  logger.info(`[Loan Reminder Scheduler] Lock acquired by ${instanceId}. Starting job...`);

  let processedCount: number;
  let statusUpdatedCount = 0;
  let remindersSentCount = 0;

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const activeTransactions = await db
      .select({
        id: transactions.id,
        kdTransaksi: transactions.kdTransaksi,
        status: transactions.status,
        tglPinjam: transactions.tglPinjam,
        tglKembali: transactions.tglKembali,
        anggotaId: transactions.anggotaId,
        namaAnggota: members.nama,
        emailAnggota: members.email,
        judulBuku: books.judul,
      })
      .from(transactions)
      .innerJoin(members, eq(transactions.anggotaId, members.id))
      .innerJoin(books, eq(transactions.bukuId, books.id))
      .where(
        and(
          or(eq(transactions.status, 'Dipinjam'), eq(transactions.status, 'Terlambat')),
          isNotNull(transactions.tglKembali),
        ),
      );

    processedCount = activeTransactions.length;
    logger.info(
      `[Loan Reminder Scheduler] Found ${processedCount} active transactions to evaluate.`,
    );

    for (const tx of activeTransactions) {
      if (!tx.tglKembali) continue;

      const diffDays = calculateCalendarDaysDiff(today, new Date(tx.tglKembali));

      // 1. Auto-update status to "Terlambat" if deadline passed and status is still "Dipinjam"
      if (diffDays > 0 && tx.status === 'Dipinjam') {
        await updateTransactionById(tx.id, { status: 'Terlambat' });
        statusUpdatedCount++;
        tx.status = 'Terlambat';
        logger.info(
          `[Loan Reminder Scheduler] Auto-updated transaction ${tx.kdTransaksi} to "Terlambat" (${diffDays} days late).`,
        );
      }

      // 2. Classify reminder type
      let reminderType: LoanReminderType | null = null;
      let hariTerlambat: number = 0;

      if (diffDays === -2) {
        reminderType = 'H-2';
      } else if (diffDays === -1) {
        reminderType = 'H-1';
      } else if (diffDays === 0) {
        reminderType = 'Hari-H';
      } else if (diffDays > 0) {
        hariTerlambat = diffDays;

        // Check if ANY overdue reminder (H+1 or Berkala) was ever recorded for this transaction
        const existingOverdueLogs = await db
          .select({ id: reminderLogs.id })
          .from(reminderLogs)
          .where(
            and(
              eq(reminderLogs.transaksiId, tx.id),
              or(eq(reminderLogs.tipePengingat, 'H+1'), eq(reminderLogs.tipePengingat, 'Berkala')),
            ),
          )
          .limit(1);

        const hasSentAnyOverdue = existingOverdueLogs.length > 0;

        if (!hasSentAnyOverdue) {
          // Fallback: first overdue alert even if server missed exact day 1 (e.g. diffDays >= 1)
          reminderType = 'H+1';
        } else if ((diffDays - 1) % 3 === 0) {
          // Periodic reminder every 3 days (H+4, H+7, H+10, ...)
          reminderType = 'Berkala';
        }
      }

      // 3. Dispatch reminder with defense-in-depth DB unique constraint check
      if (reminderType) {
        try {
          const insertResult: any = await db.execute(sql`
            INSERT INTO reminder_logs (id, transaksi_id, tipe_pengingat, sent_date, sent_at)
            VALUES (${generateId()}, ${tx.id}, ${reminderType}, ${todayDateString}::date, NOW())
            ON CONFLICT (transaksi_id, tipe_pengingat, sent_date) DO NOTHING
            RETURNING id;
          `);

          const rows = insertResult.rows ?? insertResult;
          const isInserted = Array.isArray(rows) && rows.length > 0;

          if (isInserted) {
            notifyLoanReminder({
              email: tx.emailAnggota,
              namaAnggota: tx.namaAnggota,
              judulBuku: tx.judulBuku,
              kdTransaksi: tx.kdTransaksi,
              tglPinjam: formatIndonesianDate(tx.tglPinjam),
              tglKembali: formatIndonesianDate(tx.tglKembali),
              tipeReminder: reminderType,
              hariTerlambat,
            });

            remindersSentCount++;
            logger.info(
              `[Loan Reminder Scheduler] Dispatched ${reminderType} reminder for ${tx.kdTransaksi} to ${tx.emailAnggota}.`,
            );
          } else {
            logger.debug(
              `[Loan Reminder Scheduler] Skipped ${reminderType} for ${tx.kdTransaksi} (already sent on ${todayDateString}).`,
            );
          }
        } catch (error) {
          logger.error(
            `[Loan Reminder Scheduler] Failed to record reminder log for ${tx.kdTransaksi}:`,
            error,
          );
        }
      }
    }

    logger.info(
      `[Loan Reminder Scheduler] Completed. Processed: ${processedCount}, Status Updated: ${statusUpdatedCount}, Reminders Sent: ${remindersSentCount}.`,
    );

    return {
      processedCount,
      statusUpdatedCount,
      remindersSentCount,
      skippedDueToLock: false,
    };
  } catch (error) {
    logger.error('[Loan Reminder Scheduler] Error executing job:', error);
    throw error;
  } finally {
    await releaseDbLock('daily-loan-reminder', instanceId);
    logger.info(`[Loan Reminder Scheduler] Lock released by ${instanceId}.`);
  }
};
