import type { Database } from "@/types/database";

export type WorkUnitType = Database["public"]["Enums"]["work_unit_type"];

export type WorkUnit = {
  id: string;
  name: string;
  unitType: WorkUnitType;
  parentId: string | null;
  isActive: boolean;
};

export type Position = {
  id: string;
  name: string;
  positionType: string | null;
  level: number | null;
  isActive: boolean;
};

export const WORK_UNIT_TYPE_LABELS: Record<WorkUnitType, string> = {
  field: "Bidang",
  faculty: "Fakultas",
  study_program: "Program Studi",
  bureau: "Biro",
  section: "Bagian",
  technical_unit: "UPT",
  other: "Lainnya",
};
