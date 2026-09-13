import crypto from "crypto";
import { Request, Response } from "express";
import {
  findPaymentByTripayReference,
  updateFinePaymentById,
} from "@/repositories/librarian/fine-payment.repository";
import logger from "@/utils/core/logger";

const isValidSignature = (
  rawBody: string,
  incomingSignature: string,
  privateKey: string,
): boolean => {
  const computedSignature = crypto
    .createHmac("sha256", privateKey)
    .update(rawBody)
    .digest("hex");

  const sourceBuffer = Buffer.from(incomingSignature);
  const targetBuffer = Buffer.from(computedSignature);

  if (sourceBuffer.length !== targetBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sourceBuffer, targetBuffer);
};

export const tripayWebhook = async (req: Request, res: Response) => {
  try {
    const rawSignature = req.headers["x-callback-signature"];
    const signature = Array.isArray(rawSignature)
      ? rawSignature[0]
      : rawSignature;
    const privateKey = process.env.TRIPAY_PRIVATE_KEY;

    if (!signature || !privateKey) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const jsonString = JSON.stringify(req.body);
    if (!isValidSignature(jsonString, signature, privateKey)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const { event, reference, status } = req.body ?? {};

    if (event !== "payment_status") {
      return res
        .status(200)
        .json({ success: true, message: "Event not handled" });
    }

    if (!reference) {
      return res
        .status(400)
        .json({ success: false, message: "Reference is required" });
    }

    const payment = await findPaymentByTripayReference(reference);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (status === "PAID") {
      await updateFinePaymentById(payment.id, {
        paymentStatus: "PAID",
        tglBayar: new Date(),
      });
    } else if (status === "EXPIRED" || status === "FAILED") {
      await updateFinePaymentById(payment.id, {
        paymentStatus: status,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Tripay Webhook Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
