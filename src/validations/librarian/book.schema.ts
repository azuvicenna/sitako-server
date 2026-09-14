import { z } from 'zod';
import { bookTypeEnum } from '@/db/schema';

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const ALLOWED_COVER_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const bookCoverSchema = z
  .custom<Express.Multer.File>(
    (file) => Boolean(file && typeof file === 'object' && 'size' in file),
    { message: 'Cover buku wajib diupload' },
  )
  .refine((file) => file.size <= MAX_COVER_SIZE, 'Ukuran cover maksimal 5MB')
  .refine(
    (file) => ALLOWED_COVER_MIME.has(file.mimetype),
    'Format cover harus JPG, PNG, atau WEBP',
  );

export const bookPdfSchema = z
  .custom<Express.Multer.File>()
  .optional()
  .refine((file) => !file || file.size <= MAX_PDF_SIZE, 'Ukuran file maksimal 20MB')
  .refine((file) => !file || file.mimetype === 'application/pdf', 'Format file harus PDF');

export const createBookSchema = z.object({
  judul: z
    .string({ message: 'Judul buku wajib diisi' })
    .trim()
    .min(1, 'Judul buku tidak boleh kosong'),
  penulis: z
    .string({ message: 'Nama penulis wajib diisi' })
    .trim()
    .min(1, 'Nama penulis tidak boleh kosong'),
  isbn: z.string({ message: 'ISBN wajib diisi' }).trim().min(1, 'ISBN tidak boleh kosong'),
  penerbit: z
    .string({ message: 'Penerbit wajib diisi' })
    .trim()
    .min(1, 'Penerbit tidak boleh kosong'),
  genre: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [val];
        }
      }
      return val;
    },
    z
      .array(z.string().trim().min(1, 'Genre tidak boleh kosong'))
      .min(1, 'Minimal pilih satu genre'),
  ),
  tipeBuku: z.enum(bookTypeEnum.enumValues, { message: 'Tipe buku tidak valid' }).default('Fisik'),
  tahunTerbit: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number({ message: 'Tahun terbit wajib diisi angka' }).int('Tahun terbit harus angka bulat'),
  ),
  jumlahStok: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z
      .number({ message: 'Jumlah stok wajib diisi angka' })
      .int('Jumlah stok harus angka bulat')
      .nonnegative('Jumlah stok tidak boleh minus')
      .default(0),
  ),
});

export const updateBookSchema = createBookSchema.partial();

export type CreateBook = z.infer<typeof createBookSchema>;
export type UpdateBook = z.infer<typeof updateBookSchema>;
