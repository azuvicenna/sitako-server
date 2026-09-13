import { z } from "zod";

export const initiateOnlinePaymentSchema = z.object({
  transaksiId: z
    .string({ message: "Transaksi wajib dipilih" })
    .trim()
    .min(1, "Transaksi tidak boleh kosong"),
  paymentMethodCode: z
    .string({ message: "Metode pembayaran wajib dipilih" })
    .trim()
    .min(1, "Metode pembayaran tidak boleh kosong"),
});

export type InitiateOnlinePayment = z.infer<typeof initiateOnlinePaymentSchema>;
