import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi.");

export const announcementSchema = z
  .object({
    title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Maksimal 150 karakter."),
    content: z.string().trim().min(1, "Isi pengumuman wajib diisi.").max(5000, "Maksimal 5000 karakter."),
    startsOn: isoDate,
    endsOn: isoDate,
    isPublished: z.boolean(),
  })
  .refine((v) => v.endsOn >= v.startsOn, { path: ["endsOn"], message: "Tanggal berakhir tidak boleh sebelum tanggal mulai." });

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

/** File change picked in the form: a new file replaces the current one, `remove` drops it. */
export type AnnouncementAttachmentChange = { file: File | null; remove: boolean };
