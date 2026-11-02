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
import { useSavePosition } from "@/features/master-data/hooks/use-master-data";
import { positionSchema, type PositionFormValues } from "@/features/master-data/schemas/master-data-schemas";
import type { Position } from "@/features/master-data/types/master-data";
import { ApiError } from "@/lib/api-error";

const STATUS_ITEMS = { active: "Aktif", inactive: "Nonaktif" };

type PositionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Position being edited, or null to create a new one. */
  position: Position | null;
};

function toFormValues(position: Position | null): PositionFormValues {
  return position
    ? {
        name: position.name,
        positionType: position.positionType ?? "",
        level: position.level === null ? "" : String(position.level),
        isActive: position.isActive,
      }
    : { name: "", positionType: "", level: "", isActive: true };
}

export function PositionFormDialog({ open, onOpenChange, position }: PositionFormDialogProps) {
  const savePosition = useSavePosition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormValues>({ resolver: zodResolver(positionSchema), defaultValues: toFormValues(position) });

  useEffect(() => {
    if (open) reset(toFormValues(position));
  }, [open, position, reset]);

  const onSubmit = (values: PositionFormValues) => {
    savePosition.mutate(
      { id: position?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(position ? "Jabatan diperbarui." : "Jabatan ditambahkan.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan jabatan."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? "Ubah Jabatan" : "Tambah Jabatan"}</DialogTitle>
          <DialogDescription>Jabatan dipilih saat mengisi data kepegawaian pegawai.</DialogDescription>
        </DialogHeader>

        <form id="position-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position-name">Nama jabatan</Label>
            <Input
              id="position-name"
              placeholder="mis. Analis Kepegawaian"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-type">Jenis jabatan</Label>
              <Input id="position-type" placeholder="mis. Struktural" {...register("positionType")} />
              {errors.positionType ? <p className="text-sm text-destructive">{errors.positionType.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-level">Level</Label>
              <Input
                id="position-level"
                inputMode="numeric"
                placeholder="opsional"
                aria-invalid={errors.level ? true : undefined}
                {...register("level")}
              />
              {errors.level ? <p className="text-sm text-destructive">{errors.level.message}</p> : null}
            </div>
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
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={savePosition.isPending}>
            Batal
          </Button>
          <Button type="submit" form="position-form" disabled={savePosition.isPending}>
            {savePosition.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
