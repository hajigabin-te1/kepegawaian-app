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
import { toTimeInput } from "@/features/attendance/components/attendance-format";
import { useCorrectAttendance, useEmployeeOptions } from "@/features/attendance/hooks/use-attendance";
import { correctionSchema, type CorrectionFormValues } from "@/features/attendance/schemas/attendance-schemas";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { ATTENDANCE_STATUS_LABELS, type AttendanceRecord } from "@/features/attendance/types/attendance";
import { ApiError } from "@/lib/api-error";

/** Prefill for the form: an existing record, or just an employee/date. */
export type CorrectionTarget = {
  employeeId: string;
  date: string;
  record?: AttendanceRecord;
};

type CorrectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CorrectionTarget | null;
};

function toFormValues(target: CorrectionTarget | null): CorrectionFormValues {
  return {
    employeeId: target?.employeeId ?? "",
    date: target?.date ?? todayInCampus(),
    checkIn: toTimeInput(target?.record?.checkInAt ?? null),
    checkOut: toTimeInput(target?.record?.checkOutAt ?? null),
    status: target?.record?.status ?? "present",
    reason: "",
  };
}

export function CorrectionDialog({ open, onOpenChange, target }: CorrectionDialogProps) {
  const employees = useEmployeeOptions();
  const correct = useCorrectAttendance();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrectionFormValues>({ resolver: zodResolver(correctionSchema), defaultValues: toFormValues(target) });

  useEffect(() => {
    if (open) reset(toFormValues(target));
  }, [open, target, reset]);

  const employeeItems = Object.fromEntries(
    (employees.data ?? []).map((e) => [e.id, e.employeeNumber ? `${e.name} (${e.employeeNumber})` : e.name]),
  );

  const onSubmit = (values: CorrectionFormValues) => {
    correct.mutate(values, {
      onSuccess: () => {
        toast.success("Presensi dikoreksi. Pegawai menerima notifikasi.");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Koreksi gagal disimpan."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koreksi Presensi</DialogTitle>
          <DialogDescription>Perubahan langsung berlaku, tercatat di riwayat koreksi, dan diberitahukan ke pegawai.</DialogDescription>
        </DialogHeader>

        <form id="correction-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Pegawai</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select items={employeeItems} value={field.value || null} onValueChange={(value) => field.onChange(value ?? "")}>
                  <SelectTrigger className="w-full" aria-label="Pegawai" aria-invalid={errors.employeeId ? true : undefined}>
                    <SelectValue placeholder={employees.isPending ? "Memuat pegawai…" : "Pilih pegawai"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employeeItems).map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="correction-date">Tanggal</Label>
              <Input id="correction-date" type="date" aria-invalid={errors.date ? true : undefined} {...register("date")} />
              {errors.date ? <p className="text-sm text-destructive">{errors.date.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-in">Jam datang</Label>
              <Input id="correction-in" type="time" {...register("checkIn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correction-out">Jam pulang</Label>
              <Input id="correction-out" type="time" aria-invalid={errors.checkOut ? true : undefined} {...register("checkOut")} />
              {errors.checkOut ? <p className="text-sm text-destructive">{errors.checkOut.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select items={ATTENDANCE_STATUS_LABELS} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
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
            <Label htmlFor="correction-reason">Alasan koreksi</Label>
            <Input
              id="correction-reason"
              placeholder="mis. Gangguan sinyal GPS saat presensi"
              aria-invalid={errors.reason ? true : undefined}
              {...register("reason")}
            />
            {errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={correct.isPending}>
            Batal
          </Button>
          <Button type="submit" form="correction-form" disabled={correct.isPending}>
            {correct.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan koreksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
