"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveWorkUnit } from "@/features/master-data/hooks/use-master-data";
import { workUnitSchema, type WorkUnitFormValues } from "@/features/master-data/schemas/master-data-schemas";
import { WORK_UNIT_TYPE_LABELS, type WorkUnit } from "@/features/master-data/types/master-data";
import { ApiError } from "@/lib/api-error";

const NO_PARENT = "none";
const STATUS_ITEMS = { active: "Aktif", inactive: "Nonaktif" };

type WorkUnitFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unit being edited, or null to create a new one. */
  workUnit: WorkUnit | null;
  allUnits: WorkUnit[];
};

function toFormValues(workUnit: WorkUnit | null): WorkUnitFormValues {
  return workUnit
    ? { name: workUnit.name, unitType: workUnit.unitType, parentId: workUnit.parentId, isActive: workUnit.isActive }
    : { name: "", unitType: "study_program", parentId: null, isActive: true };
}

export function WorkUnitFormDialog({ open, onOpenChange, workUnit, allUnits }: WorkUnitFormDialogProps) {
  const saveWorkUnit = useSaveWorkUnit();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkUnitFormValues>({ resolver: zodResolver(workUnitSchema), defaultValues: toFormValues(workUnit) });

  useEffect(() => {
    if (open) reset(toFormValues(workUnit));
  }, [open, workUnit, reset]);

  // A unit cannot be its own parent.
  const parentItems: Record<string, string> = {
    [NO_PARENT]: "Tidak ada (unit teratas)",
    ...Object.fromEntries(allUnits.filter((unit) => unit.id !== workUnit?.id).map((unit) => [unit.id, unit.name])),
  };

  const onSubmit = (values: WorkUnitFormValues) => {
    saveWorkUnit.mutate(
      { id: workUnit?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(workUnit ? "Unit kerja diperbarui." : "Unit kerja ditambahkan.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan unit kerja."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{workUnit ? "Ubah Unit Kerja" : "Tambah Unit Kerja"}</DialogTitle>
          <DialogDescription>
            Unit kerja dipakai untuk mengelompokkan pegawai. Gunakan jenis &ldquo;Bidang&rdquo; untuk bidang Wakil Ketua
            dan jadikan induk bagi unit di bawahnya.
          </DialogDescription>
        </DialogHeader>

        <form id="work-unit-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-unit-name">Nama unit kerja</Label>
            <Input
              id="work-unit-name"
              placeholder="mis. Program Studi Administrasi Publik"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis unit</Label>
              <Controller
                control={control}
                name="unitType"
                render={({ field }) => (
                  <Select items={WORK_UNIT_TYPE_LABELS} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                    <SelectTrigger className="w-full" aria-label="Jenis unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_UNIT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Select
                    items={STATUS_ITEMS}
                    value={field.value ? "active" : "inactive"}
                    onValueChange={(value) => field.onChange(value === "active")}
                  >
                    <SelectTrigger className="w-full" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Induk unit</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  items={parentItems}
                  value={field.value ?? NO_PARENT}
                  onValueChange={(value) => field.onChange(value && value !== NO_PARENT ? value : null)}
                >
                  <SelectTrigger className="w-full" aria-label="Induk unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(parentItems).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveWorkUnit.isPending}>
            Batal
          </Button>
          <Button type="submit" form="work-unit-form" disabled={saveWorkUnit.isPending}>
            {saveWorkUnit.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
