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
import { Textarea } from "@/components/ui/textarea";
import { useSaveTraining } from "@/features/training/hooks/use-training";
import { trainingSchema, type TrainingFormValues } from "@/features/training/schemas/training-schemas";
import { TRAINING_STATUS_LABELS, type Training } from "@/features/training/types/training";
import { ApiError } from "@/lib/api-error";

const toValues = (training: Training | null): TrainingFormValues =>
  training
    ? {
        name: training.name,
        organizer: training.organizer ?? "",
        description: training.description ?? "",
        startDate: training.startDate ?? "",
        endDate: training.endDate ?? "",
        opensOn: training.opensOn ?? "",
        closesOn: training.closesOn ?? "",
        quota: training.quota === null ? "" : String(training.quota),
        status: training.status,
      }
    : { name: "", organizer: "", description: "", startDate: "", endDate: "", opensOn: "", closesOn: "", quota: "", status: "open" };

export function TrainingFormDialog({ open, onOpenChange, training }: { open: boolean; onOpenChange: (open: boolean) => void; training: Training | null }) {
  const save = useSaveTraining();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingFormValues>({ resolver: zodResolver(trainingSchema), defaultValues: toValues(training) });

  useEffect(() => {
    if (open) reset(toValues(training));
  }, [open, training, reset]);

  const onSubmit = (values: TrainingFormValues) =>
    save.mutate(
      { id: training?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(training ? "Diklat diperbarui." : "Diklat dibuat.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Diklat gagal disimpan."),
      },
    );

  const date = (name: "startDate" | "endDate" | "opensOn" | "closesOn", label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`training-${name}`}>{label}</Label>
      <Input id={`training-${name}`} type="date" aria-invalid={errors[name] ? true : undefined} {...register(name)} />
      {errors[name] ? <p className="text-sm text-destructive">{errors[name]?.message}</p> : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{training ? "Ubah Diklat" : "Tambah Diklat"}</DialogTitle>
          <DialogDescription>Pegawai hanya bisa mendaftar saat status Dibuka dan dalam rentang pendaftaran.</DialogDescription>
        </DialogHeader>
        <form id="training-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="training-name">Nama diklat</Label>
            <Input id="training-name" aria-invalid={errors.name ? true : undefined} {...register("name")} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="training-organizer">Penyelenggara</Label>
            <Input id="training-organizer" {...register("organizer")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="training-description">Deskripsi</Label>
            <Textarea id="training-description" rows={3} {...register("description")} />
          </div>
          {date("startDate", "Tanggal mulai")}
          {date("endDate", "Tanggal selesai")}
          {date("opensOn", "Pendaftaran dibuka")}
          {date("closesOn", "Pendaftaran ditutup")}
          <div className="space-y-2">
            <Label htmlFor="training-quota">Kuota peserta (opsional)</Label>
            <Input id="training-quota" inputMode="numeric" aria-invalid={errors.quota ? true : undefined} {...register("quota")} />
            {errors.quota ? <p className="text-sm text-destructive">{errors.quota.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select items={TRAINING_STATUS_LABELS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRAINING_STATUS_LABELS).map(([value, label]) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="training-form" disabled={save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
