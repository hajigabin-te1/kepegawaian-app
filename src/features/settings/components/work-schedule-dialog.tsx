"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateWorkSchedule } from "@/features/settings/hooks/use-settings";
import { workScheduleSchema, type WorkScheduleFormValues } from "@/features/settings/schemas/settings-schemas";
import type { WorkSchedule } from "@/features/settings/types/settings";
import { ApiError } from "@/lib/api-error";

type WorkScheduleDialogProps = {
  schedule: WorkSchedule | null;
  onOpenChange: (open: boolean) => void;
};

export function WorkScheduleDialog({ schedule, onOpenChange }: WorkScheduleDialogProps) {
  return (
    <Dialog open={schedule !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {schedule ? <ScheduleForm key={schedule.id} schedule={schedule} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ScheduleForm({ schedule, onDone }: { schedule: WorkSchedule; onDone: () => void }) {
  const update = useUpdateWorkSchedule();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkScheduleFormValues>({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: {
      checkInTime: schedule.checkInTime,
      checkOutTime: schedule.checkOutTime,
      lateToleranceMinutes: String(schedule.lateToleranceMinutes),
      flagsEarlyLeave: schedule.flagsEarlyLeave,
    },
  });

  const onSubmit = (values: WorkScheduleFormValues) => {
    update.mutate(
      { id: schedule.id, values },
      {
        onSuccess: () => {
          toast.success(`${schedule.name} diperbarui.`);
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan jam kerja."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ubah {schedule.name}</DialogTitle>
        <DialogDescription>Jam memakai zona waktu kampus. Berlaku untuk presensi berikutnya, tidak mengubah presensi yang sudah tercatat.</DialogDescription>
      </DialogHeader>

      <form id="work-schedule-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="schedule-check-in">Jam masuk</Label>
            <Input id="schedule-check-in" type="time" aria-invalid={errors.checkInTime ? true : undefined} {...register("checkInTime")} />
            {errors.checkInTime ? <p className="text-sm text-destructive">{errors.checkInTime.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-check-out">Jam pulang</Label>
            <Input id="schedule-check-out" type="time" aria-invalid={errors.checkOutTime ? true : undefined} {...register("checkOutTime")} />
            {errors.checkOutTime ? <p className="text-sm text-destructive">{errors.checkOutTime.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-tolerance">Toleransi (menit)</Label>
            <Input id="schedule-tolerance" inputMode="numeric" className="tabular-nums" aria-invalid={errors.lateToleranceMinutes ? true : undefined} {...register("lateToleranceMinutes")} />
            {errors.lateToleranceMinutes ? <p className="text-sm text-destructive">{errors.lateToleranceMinutes.message}</p> : null}
          </div>
        </div>
        <label htmlFor="schedule-early-leave" className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5">
          <input id="schedule-early-leave" type="checkbox" className="mt-0.5 size-4 accent-primary" {...register("flagsEarlyLeave")} />
          <span className="text-sm">
            <span className="block font-medium">Catat pulang awal</span>
            <span className="block text-muted-foreground">Matikan jika jam pulang fleksibel, seperti dosen yang mengajar.</span>
          </span>
        </label>
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          Batal
        </Button>
        <Button type="submit" form="work-schedule-form" disabled={update.isPending}>
          {update.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </>
  );
}
