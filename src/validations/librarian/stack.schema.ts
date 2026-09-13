import { z } from "zod";

export const createStackSchema = z.object({
  rakId: z
    .string({ message: "Rak wajib dipilih" })
    .trim()
    .min(1, "Rak tidak boleh kosong"),
  bukuId: z
    .string({ message: "Buku wajib dipilih" })
    .trim()
    .min(1, "Buku tidak boleh kosong"),
  kdSusunan: z
    .string({ message: "Kode susunan wajib diisi" })
    .trim()
    .min(1, "Kode susunan tidak boleh kosong"),
  nomorSusunan: z
    .number({ message: "Nomor susunan wajib diisi angka" })
    .int("Nomor susunan harus angka bulat")
    .nonnegative("Nomor susunan tidak boleh minus"),
});

export const updateStackSchema = createStackSchema.partial();

export type CreateStack = z.infer<typeof createStackSchema>;
export type UpdateStack = z.infer<typeof updateStackSchema>;
