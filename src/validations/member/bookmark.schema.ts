import { z } from "zod";

export const createBookmarkSchema = z.object({
  bukuId: z
    .string({ message: "Buku wajib dipilih" })
    .trim()
    .min(1, "Buku tidak boleh kosong"),
  anggotaId: z
    .string({ message: "Anggota wajib dipilih" })
    .trim()
    .min(1, "Anggota tidak boleh kosong"),
});

export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
