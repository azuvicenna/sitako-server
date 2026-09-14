import { z } from 'zod';
import { transactionStatusEnum } from '@/db/schema';

export const createTransactionSchema = z.object({
  bukuId: z.string({ message: 'Buku wajib dipilih' }).trim().min(1, 'Buku tidak boleh kosong'),
  pustakawanId: z
    .string({ message: 'Pustakawan wajib dipilih' })
    .trim()
    .min(1, 'Pustakawan tidak boleh kosong'),
  tglPinjam: z.coerce.date({ message: 'Format tanggal pinjam tidak valid' }).optional(),
  tglKembali: z.coerce.date({ message: 'Format tanggal kembali tidak valid' }).optional(),
  status: z
    .enum(transactionStatusEnum.enumValues, {
      message: 'Status transaksi tidak valid',
    })
    .default('Menunggu Persetujuan'),
});

export const returnTransactionSchema = z.object({
  /**
   * Apakah buku dilaporkan hilang?
   * Hanya relevan jika buku SUDAH melewati tanggal kembali (terlambat).
   * Jika buku belum terlambat, field ini diabaikan.
   */
  isBukuHilang: z
    .boolean({ message: 'Status kehilangan buku wajib diisi (true/false)' })
    .default(false),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type ReturnTransaction = z.infer<typeof returnTransactionSchema>;
