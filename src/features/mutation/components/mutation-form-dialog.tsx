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
import { useEmployeeOptions } from "@/features/attendance/hooks/use-attendance";
import { useProposeMutation } from "@/features/mutation/hooks/use-mutations";
import { mutationSchema, type MutationFormValues } from "@/features/mutation/schemas/mutation-schemas";
import { usePositions, useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { ApiError } from "@/lib/api-error";

const NONE = "none";
const EMPTY: MutationFormValues = { employeeId: "", toWorkUnitId: "", toPositionId: "", effectiveDate: "", reason: "" };

export function MutationFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const propose = useProposeMutation();
  const employees = useEmployeeOptions();
  const workUnits = useWorkUnits();
  const positions = usePositions();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MutationFormValues>({ resolver: zodResolver(mutationSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const employeeItems = Object.fromEntries((employees.data ?? []).map((e) => [e.id, e.employeeNumber ? `${e.name} (${e.employeeNumber})` : e.name]));
  const unitItems = { [NONE]: "Tidak berubah", ...Object.fromEntries((workUnits.data ?? []).filter((u) => u.isActive).map((u) => [u.id, u.name])) };
  const positionItems = { [NONE]: "Tidak berubah", ...Object.fromEntries((positions.data ?? []).filter((p) => p.isActive).map((p) => [p.id, p.name])) };

  const onSubmit = (values: MutationFormValues) =>
    propose.mutate(values, {
      onSuccess: () => {
        toast.success("Usulan mutasi dibuat.");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Usulan gagal dibuat."),
    });

  const picker = (name: "toWorkUnitId" | "toPositionId", label: string, items: Record<string, string>) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select items={items} value={field.value === "" ? NONE : field.value} onValueChange={(v) => field.onChange(v === NONE || v === null ? "" : v)}>
            <SelectTrigger className="w-full" aria-label={label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(items).map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] ? <p className="text-sm text-destructive">{errors[name]?.message}</p> : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !propose.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usulkan Mutasi</DialogTitle>
          <DialogDescription>Unit dan jabatan saat ini diambil otomatis dari data pegawai.</DialogDescription>
        </DialogHeader>
        <form id="mutation-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Pegawai</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select items={employeeItems} value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger className="w-full" aria-label="Pegawai" aria-invalid={errors.employeeId ? true : undefined}>
                    <SelectValue placeholder={employees.isPending ? "Memuat pegawai…" : "Pilih pegawai"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employeeItems).map(([value, text]) => (
                      <SelectItem key={value} value={value}>
                        {text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
          </div>
          {picker("toWorkUnitId", "Unit kerja baru", unitItems)}
          {picker("toPositionId", "Jabatan baru", positionItems)}
          <div className="space-y-2">
            <Label htmlFor="mutation-date">Tanggal berlaku</Label>
            <Input id="mutation-date" type="date" aria-invalid={errors.effectiveDate ? true : undefined} {...register("effectiveDate")} />
            {errors.effectiveDate ? <p className="text-sm text-destructive">{errors.effectiveDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mutation-reason">Alasan (opsional)</Label>
            <Input id="mutation-reason" {...register("reason")} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={propose.isPending}>
            Batal
          </Button>
          <Button type="submit" form="mutation-form" disabled={propose.isPending}>
            {propose.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Buat usulan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
