import { z } from "zod";

import { DOCUMENT_TYPES } from "@/features/documents/types/documents";

export const documentSchema = z.object({
  employeeId: z.string().min(1, "Pilih pegawai."),
  documentType: z.enum(DOCUMENT_TYPES, "Pilih jenis dokumen."),
  title: z.string().trim().min(1, "Judul dokumen wajib diisi.").max(150, "Maksimal 150 karakter."),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
