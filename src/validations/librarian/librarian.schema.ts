import { z } from "zod";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const imageFileSchema = z
  .custom<Express.Multer.File>(
    (file) => Boolean(file && typeof file === "object" && "size" in file),
    { message: "Foto wajib diupload" },
  )
  .refine((file) => file.size <= MAX_PHOTO_SIZE, "Ukuran foto maksimal 2MB")
  .refine(
    (file) => ALLOWED_PHOTO_MIME.has(file.mimetype),
    "Format foto harus JPG, PNG, atau WEBP",
  );

export const createLibrarianSchema = z.object({
  nama: z
    .string({ message: "Nama pustakawan wajib diisi" })
    .trim()
    .min(1, "Nama pustakawan tidak boleh kosong"),
  nip: z
    .string({ message: "NIP wajib diisi" })
    .trim()
    .min(1, "NIP tidak boleh kosong"),
  email: z
    .string({ message: "Email wajib diisi" })
    .trim()
    .regex(EMAIL_REGEX, "Format email tidak valid"),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(1, "Password tidak boleh kosong"),
  telepon: z
    .string({ message: "Nomor telepon wajib diisi" })
    .trim()
    .min(1, "Nomor telepon tidak boleh kosong"),
  status_aktif: z
    .union([z.boolean(), z.string()])
    .default(true)
    .transform((val) => val === true || val === "true"),
});

export const updateLibrarianSchema = createLibrarianSchema.partial().extend({
  status_aktif: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) =>
      val !== undefined ? val === true || val === "true" : undefined,
    ),
});

export type CreateLibrarian = z.infer<typeof createLibrarianSchema>;
export type UpdateLibrarian = z.infer<typeof updateLibrarianSchema>;
