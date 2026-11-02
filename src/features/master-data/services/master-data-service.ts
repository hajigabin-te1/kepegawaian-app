import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PositionFormValues, WorkUnitFormValues } from "@/features/master-data/schemas/master-data-schemas";
import type { Position, WorkUnit } from "@/features/master-data/types/master-data";

const WORK_UNIT_COLUMNS = "id, name, unit_type, parent_id, is_active";
const POSITION_COLUMNS = "id, name, position_type, level, is_active";

type WorkUnitRow = { id: string; name: string; unit_type: WorkUnit["unitType"]; parent_id: string | null; is_active: boolean };
type PositionRow = { id: string; name: string; position_type: string | null; level: number | null; is_active: boolean };

const toWorkUnit = (row: WorkUnitRow): WorkUnit => ({
  id: row.id,
  name: row.name,
  unitType: row.unit_type,
  parentId: row.parent_id,
  isActive: row.is_active,
});

const toPosition = (row: PositionRow): Position => ({
  id: row.id,
  name: row.name,
  positionType: row.position_type,
  level: row.level,
  isActive: row.is_active,
});

const workUnitPayload = (values: WorkUnitFormValues) => ({
  name: values.name,
  unit_type: values.unitType,
  parent_id: values.parentId,
  is_active: values.isActive,
});

const positionPayload = (values: PositionFormValues) => ({
  name: values.name,
  position_type: values.positionType === "" ? null : values.positionType,
  level: values.level === "" ? null : Number(values.level),
  is_active: values.isActive,
});

export async function listWorkUnits(): Promise<WorkUnit[]> {
  const { data, error } = await createSupabaseBrowserClient().from("work_units").select(WORK_UNIT_COLUMNS).order("name");
  if (error) throw fromSupabaseError(error);
  return data.map(toWorkUnit);
}

export async function createWorkUnit(values: WorkUnitFormValues): Promise<WorkUnit> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("work_units")
    .insert(workUnitPayload(values))
    .select(WORK_UNIT_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, { "23505": "Unit kerja dengan nama ini sudah ada di induk yang sama." });
  return toWorkUnit(data);
}

export async function updateWorkUnit(id: string, values: WorkUnitFormValues): Promise<WorkUnit> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("work_units")
    .update(workUnitPayload(values))
    .eq("id", id)
    .select(WORK_UNIT_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, { "23505": "Unit kerja dengan nama ini sudah ada di induk yang sama." });
  return toWorkUnit(data);
}

export async function listPositions(): Promise<Position[]> {
  const { data, error } = await createSupabaseBrowserClient().from("positions").select(POSITION_COLUMNS).order("name");
  if (error) throw fromSupabaseError(error);
  return data.map(toPosition);
}

export async function createPosition(values: PositionFormValues): Promise<Position> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("positions")
    .insert(positionPayload(values))
    .select(POSITION_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, { "23505": "Jabatan dengan nama ini sudah ada." });
  return toPosition(data);
}

export async function updatePosition(id: string, values: PositionFormValues): Promise<Position> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("positions")
    .update(positionPayload(values))
    .eq("id", id)
    .select(POSITION_COLUMNS)
    .single();
  if (error) throw fromSupabaseError(error, { "23505": "Jabatan dengan nama ini sudah ada." });
  return toPosition(data);
}
