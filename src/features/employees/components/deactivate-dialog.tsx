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
import { useSetEmployeeActive } from "@/features/employees/hooks/use-employees";
import { deactivateSchema, type DeactivateFormValues } from "@/features/employees/schemas/employee-schemas";
import { ApiError } from "@/lib/api-error";

const STATUS_ITEMS = { inactive: "Nonaktif", retired: "Pensiun" };

type DeactivateDialogProps = {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateDialog({ employeeId, employeeName, open, onOpenChange }: DeactivateDialogProps) {
  const setActive = useSetEmployeeActive(employeeId);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeactivateFormValues>({ resolver: zodResolver(deactivateSchema), defaultValues: { status: "inactive", reason: "" } });

  useEffect(() => {
    if (open) reset({ status: "inactive", reason: "" });
  }, [open, reset]);

  const onSubmit = (values: DeactivateFormValues) =>
    setActive.mutate(values, {
      onSuccess: () => {
        toast.success("Pegawai dinonaktifkan.");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menonaktifkan pegawai."),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nonaktifkan pegawai?</DialogTitle>
          <DialogDescription>
            {employeeName} tidak lagi dihitung sebagai pegawai aktif dan tidak bisa presensi. Data dan riwayat tetap tersimpan, dan status dapat diaktifkan kembali.
          </DialogDescription>
        </DialogHeader>
        <form id="deactivate-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select items={STATUS_ITEMS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_ITEMS).map(([value, label]) => (
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
            <Label htmlFor="deactivate-reason">Alasan</Label>
            <Input id="deactivate-reason" placeholder="mis. Mengundurkan diri" aria-invalid={errors.reason ? true : undefined} {...register("reason")} />
            {errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={setActive.isPending}>
            Batal
          </Button>
          <Button type="submit" form="deactivate-form" variant="destructive" disabled={setActive.isPending}>
            {setActive.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Nonaktifkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
