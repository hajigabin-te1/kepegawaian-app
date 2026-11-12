import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Maksimal 150 karakter."),
  content: z.string().trim().min(1, "Isi pengumuman wajib diisi.").max(5000, "Maksimal 5000 karakter."),
  isPublished: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
