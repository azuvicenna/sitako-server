import nodemailer, { type Transporter } from "nodemailer";

import logger from "@/utils/core/logger";

export type SendEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: unknown };

const mailPort = Number(process.env.MAIL_PORT) || 465;

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: mailPort,
  secure: mailPort === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> => {
  try {
    const sender = process.env.MAIL_FROM || process.env.MAIL_USER || "";

    const info = await transporter.sendMail({
      from: `"SITAKO" <${sender}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Error";

    logger.error(`Error sending email to ${to}: ${errorMessage}`, { error });

    return { success: false, error };
  }
};
