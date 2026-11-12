"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChangeEmployeeStatus } from "@/features/employees/hooks/use-employees";
import { deactivateEmployeeSchema, type DeactivateEmployeeValues } from "@/features/employees/schemas/employee-schema";
import { ApiError } from "@/lib/api-error";

const STATUS_ITEMS = { inactive: "Nonaktif", retired: "Pensiun" };

type DeactivateEmployeeDialogProps = {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateEmployeeDialog({ employeeId, employeeName, open, onOpenChange }: DeactivateEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? <DeactivateForm employeeId={employeeId} employeeName={employeeName} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DeactivateForm({ employeeId, employeeName, onDone }: { employeeId: string; employeeName: string; onDone: () => void }) {
  const changeStatus = useChangeEmployeeStatus(employeeId);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeactivateEmployeeValues>({
    resolver: zodResolver(deactivateEmployeeSchema),
    defaultValues: { activeStatus: "inactive", reason: "" },
  });

  const onSubmit = (values: DeactivateEmployeeValues) => {
    changeStatus.mutate(
      { reactivate: false, values },
      {
        onSuccess: () => {
          toast.success(`${employeeName} dinonaktifkan.`);
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Status pegawai gagal diubah."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nonaktifkan pegawai?</DialogTitle>
        <DialogDescription>
          {employeeName} tidak lagi muncul di daftar pegawai aktif. Data dan riwayatnya tetap tersimpan dan dapat diaktifkan
          kembali.
        </DialogDescription>
      </DialogHeader>
      <form id="deactivate-employee-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label>Status baru</Label>
          <Controller
            control={control}
            name="activeStatus"
            render={({ field }) => (
              <Select items={STATUS_ITEMS} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                <SelectTrigger className="w-full" aria-label="Status baru">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                  <SelectItem value="retired">Pensiun</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deactivation-reason">Alasan</Label>
          <Input id="deactivation-reason" placeholder="mis. Mengundurkan diri per 1 Desember 2026" {...register("reason")} />
          {errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={changeStatus.isPending}>
          Batal
        </Button>
        <Button type="submit" form="deactivate-employee-form" variant="destructive" disabled={changeStatus.isPending}>
          {changeStatus.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Nonaktifkan
        </Button>
      </DialogFooter>
    </>
  );
}
