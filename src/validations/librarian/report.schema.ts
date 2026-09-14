import { z } from "zod";

export const reportQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    format: z.enum(["json", "csv", "xlsx", "pdf"]).default("json"),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "startDate tidak boleh lebih besar dari endDate",
      path: ["startDate"],
    },
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;
