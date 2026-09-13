import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number(val);
      return Number.isInteger(num) && num > 0 ? num : 1;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number(val);
      return Number.isInteger(num) && num > 0 ? Math.min(100, num) : 10;
    }),
  search: z.string().trim().default(""),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
