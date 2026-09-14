import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string({ message: 'NIP/NIS wajib diisi' })
    .trim()
    .min(1, 'NIP/NIS tidak boleh kosong'),
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password tidak boleh kosong'),
  captcha: z.string({ message: 'Captcha wajib diisi' }).trim().min(1, 'Captcha tidak boleh kosong'),
});

export type LoginInput = z.infer<typeof loginSchema>;
