import { z } from "zod";

/** Same length rule as save_work_report() in the database. */
export const workReportSchema = z.object({
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(2000, "Deskripsi maksimal 2000 karakter."),
});

export type WorkReportFormValues = z.infer<typeof workReportSchema>;
