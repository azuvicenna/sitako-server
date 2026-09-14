import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createMemberSchema = z.object({
  nama: z
    .string({ message: 'Nama anggota wajib diisi' })
    .trim()
    .min(1, 'Nama anggota tidak boleh kosong'),
  nis: z.string({ message: 'NIS wajib diisi' }).trim().min(1, 'NIS tidak boleh kosong'),
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .regex(EMAIL_REGEX, 'Format email tidak valid'),
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password tidak boleh kosong'),
  telepon: z
    .string({ message: 'Nomor telepon wajib diisi' })
    .trim()
    .min(1, 'Nomor telepon tidak boleh kosong'),
  status_aktif: z
    .union([z.boolean(), z.string()])
    .default(true)
    .transform((val) => val === true || val === 'true'),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  status_aktif: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? val === true || val === 'true' : undefined)),
});

export type CreateMember = z.infer<typeof createMemberSchema>;
export type UpdateMember = z.infer<typeof updateMemberSchema>;
