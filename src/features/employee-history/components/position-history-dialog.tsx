"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileField } from "@/features/documents/components/file-field";
import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import { useSavePositionHistory } from "@/features/employee-history/hooks/use-histories";
import { positionHistorySchema, type PositionHistoryFormValues } from "@/features/employee-history/schemas/history-schemas";
import type { PositionHistory } from "@/features/employee-history/types/history";
import { EmployeeSelect } from "@/features/employees/components/employee-select";
import { usePositions, useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { ApiError } from "@/lib/api-error";

const NO_UNIT = "";

type PositionHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: PositionHistory | null;
  /** Set on the employee detail page; otherwise the employee is picked in the form. */
  fixedEmployeeId: string | null;
};

export function PositionHistoryDialog({ open, onOpenChange, entry, fixedEmployeeId }: PositionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? <PositionHistoryForm entry={entry} fixedEmployeeId={fixedEmployeeId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PositionHistoryForm({ entry, fixedEmployeeId, onDone }: {
  entry: PositionHistory | null;
  fixedEmployeeId: string | null;
  onDone: () => void;
}) {
  const save = useSavePositionHistory();
  const positions = usePositions();
  const workUnits = useWorkUnits();
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PositionHistoryFormValues>({
    resolver: zodResolver(positionHistorySchema),
    defaultValues: {
      employeeId: entry?.employeeId ?? fixedEmployeeId ?? "",
      positionId: entry?.positionId ?? "",
      workUnitId: entry?.workUnitId ?? "",
      startDate: entry?.startDate ?? "",
      endDate: entry?.endDate ?? "",
      decreeNumber: entry?.decreeNumber ?? "",
    },
  });

  const positionItems = Object.fromEntries((positions.data ?? []).map((item) => [item.id, item.name]));
  const unitItems: Record<string, string> = {
    [NO_UNIT]: "Tidak diisi",
    ...Object.fromEntries((workUnits.data ?? []).map((unit) => [unit.id, unit.name])),
  };

  const onSubmit = (values: PositionHistoryFormValues) => {
    if (file && validateEmployeeFile(file)) return;
    save.mutate(
      { existing: entry, values, file },
      {
        onSuccess: () => {
          toast.success(entry ? "Riwayat jabatan diperbarui." : "Riwayat jabatan ditambahkan.");
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat jabatan gagal disimpan."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry ? "Ubah Riwayat Jabatan" : "Tambah Riwayat Jabatan"}</DialogTitle>
        <DialogDescription>Jabatan yang pernah atau sedang diemban beserta SK-nya.</DialogDescription>
      </DialogHeader>

      <form id="position-history-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {fixedEmployeeId ? null : (
          <div className="space-y-2">
            <Label>
              Pegawai<span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <EmployeeSelect value={field.value} onChange={field.onChange} invalid={Boolean(errors.employeeId)} />
              )}
            />
            {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Jabatan<span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="positionId"
            render={({ field }) => (
              <Select items={positionItems} value={field.value || null} onValueChange={(value) => value && field.onChange(value)}>
                <SelectTrigger className="w-full" aria-label="Jabatan" aria-invalid={errors.positionId ? true : undefined}>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(positionItems).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.positionId ? <p className="text-sm text-destructive">{errors.positionId.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Unit kerja</Label>
          <Controller
            control={control}
            name="workUnitId"
            render={({ field }) => (
              <Select items={unitItems} value={field.value} onValueChange={(value) => field.onChange(value ?? NO_UNIT)}>
                <SelectTrigger className="w-full" aria-label="Unit kerja">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitItems).map(([id, name]) => (
                    <SelectItem key={id || "none"} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="position-start">
              Tanggal mulai<span className="text-destructive">*</span>
            </Label>
            <Input id="position-start" type="date" aria-invalid={errors.startDate ? true : undefined} {...register("startDate")} />
            {errors.startDate ? <p className="text-sm text-destructive">{errors.startDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-end">Tanggal selesai</Label>
            <Input id="position-end" type="date" aria-invalid={errors.endDate ? true : undefined} {...register("endDate")} />
            {errors.endDate ? (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Kosongkan jika masih menjabat.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decree-number">Nomor SK</Label>
          <Input id="decree-number" placeholder="mis. 800/123/STIA/2024" {...register("decreeNumber")} />
          {errors.decreeNumber ? <p className="text-sm text-destructive">{errors.decreeNumber.message}</p> : null}
        </div>

        <FileField
          label="File SK"
          file={file}
          onChange={setFile}
          existingFileNote={entry?.decreePath ? "File SK sudah ada. Pilih file baru untuk menggantinya." : undefined}
        />
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={save.isPending}>
          Batal
        </Button>
        <Button type="submit" form="position-history-form" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </>
  );
}
