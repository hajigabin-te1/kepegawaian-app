import { z } from "zod";

import { WORK_UNIT_TYPE_LABELS, type WorkUnitType } from "@/features/master-data/types/master-data";

const workUnitTypes = Object.keys(WORK_UNIT_TYPE_LABELS) as [WorkUnitType, ...WorkUnitType[]];

export const workUnitSchema = z.object({
  name: z.string().trim().min(1, "Nama unit kerja wajib diisi.").max(150, "Maksimal 150 karakter."),
  unitType: z.enum(workUnitTypes, "Pilih jenis unit."),
  parentId: z.string().nullable(),
  isActive: z.boolean(),
});

export type WorkUnitFormValues = z.infer<typeof workUnitSchema>;

export const positionSchema = z.object({
  name: z.string().trim().min(1, "Nama jabatan wajib diisi.").max(150, "Maksimal 150 karakter."),
  positionType: z.string().trim().max(100, "Maksimal 100 karakter."),
  level: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,2}$/.test(value), "Level berupa angka 0–99."),
  isActive: z.boolean(),
});

export type PositionFormValues = z.infer<typeof positionSchema>;
