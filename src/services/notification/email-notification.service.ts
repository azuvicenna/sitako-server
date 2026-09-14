import { sendEmail } from "@/utils/services/mail";
import logger from "@/utils/core/logger";
import {
  renderLoanReminderEmail,
  type LoanReminderEmailData,
} from "@/templates/emails/loan-reminder.template";
import {
  renderLoanStatusEmail,
  type LoanStatusEmailData,
} from "@/templates/emails/loan-status.template";
import {
  renderFineInvoiceEmail,
  type FineInvoiceEmailData,
} from "@/templates/emails/fine-invoice.template";
import {
  renderFineSuccessEmail,
  type FineSuccessEmailData,
} from "@/templates/emails/fine-success.template";

/**
 * Format Date object to Indonesian formatted date string (e.g., 14 September 2026)
 */
export const formatIndonesianDate = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

/**
 * Safe async email dispatching that logs any errors without throwing
 */
const dispatchEmailSafely = (
  to: string,
  subject: string,
  html: string,
  contextLabel: string,
): void => {
  setImmediate(async () => {
    try {
      if (!to || !to.includes("@")) {
        logger.warn(`Skipping email dispatch for ${contextLabel}: invalid recipient email (${to})`);
        return;
      }
      const result = await sendEmail(to, subject, html);
      if (result.success) {
        logger.info(`[Email Sent] ${contextLabel} to ${to} (MessageId: ${result.messageId})`);
      } else {
        logger.error(`[Email Failed] ${contextLabel} to ${to}:`, { error: result.error });
      }
    } catch (error) {
      logger.error(`[Email Exception] ${contextLabel} to ${to}:`, { error });
    }
  });
};

export const notifyLoanReminder = (
  data: LoanReminderEmailData & { email: string },
): void => {
  const { subject, html } = renderLoanReminderEmail(data);
  dispatchEmailSafely(data.email, subject, html, `LoanReminder-${data.tipeReminder}-${data.kdTransaksi}`);
};

export const notifyLoanStatusChange = (
  data: LoanStatusEmailData & { email: string },
): void => {
  const { subject, html } = renderLoanStatusEmail(data);
  dispatchEmailSafely(data.email, subject, html, `LoanStatus-${data.status}-${data.kdTransaksi}`);
};

export const notifyFineInvoice = (
  data: FineInvoiceEmailData & { email: string },
): void => {
  const { subject, html } = renderFineInvoiceEmail(data);
  dispatchEmailSafely(data.email, subject, html, `FineInvoice-${data.kdTransaksi}`);
};

export const notifyFinePaymentSuccess = (
  data: FineSuccessEmailData & { email: string },
): void => {
  const { subject, html } = renderFineSuccessEmail(data);
  dispatchEmailSafely(data.email, subject, html, `FinePaymentSuccess-${data.kdTransaksi}`);
};
