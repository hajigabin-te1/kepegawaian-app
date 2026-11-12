"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeeOptions } from "@/features/attendance/hooks/use-attendance";
import { usePositions } from "@/features/master-data/hooks/use-master-data";
import { useProposePromotion } from "@/features/promotion/hooks/use-promotions";
import { promotionSchema, type PromotionFormValues } from "@/features/promotion/schemas/promotion-schemas";
import { PROMOTION_TYPE_LABELS } from "@/features/promotion/types/promotion";
import { ApiError } from "@/lib/api-error";

const EMPTY: PromotionFormValues = { employeeId: "", type: "rank", proposedRank: "", proposedPositionId: "", effectiveDate: "", reason: "" };

export function PromotionFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const propose = useProposePromotion();
  const employees = useEmployeeOptions();
  const positions = usePositions();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromotionFormValues>({ resolver: zodResolver(promotionSchema), defaultValues: EMPTY });
  const type = useWatch({ control, name: "type" });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const employeeItems = Object.fromEntries((employees.data ?? []).map((e) => [e.id, e.employeeNumber ? `${e.name} (${e.employeeNumber})` : e.name]));
  const positionItems = Object.fromEntries((positions.data ?? []).filter((p) => p.isActive).map((p) => [p.id, p.name]));

  const onSubmit = (values: PromotionFormValues) =>
    propose.mutate(values, {
      onSuccess: () => {
        toast.success("Usulan dibuat.");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Usulan gagal dibuat."),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !propose.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usulkan Kenaikan</DialogTitle>
          <DialogDescription>Pangkat dan jabatan saat ini diambil otomatis dari data pegawai.</DialogDescription>
        </DialogHeader>
        <form id="promotion-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
          <div className="space-y-2">
            <Label>Jenis</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select items={PROMOTION_TYPE_LABELS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full" aria-label="Jenis kenaikan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROMOTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {type === "rank" ? (
            <div className="space-y-2">
              <Label htmlFor="promotion-rank">Pangkat/golongan usulan</Label>
              <Input id="promotion-rank" aria-invalid={errors.proposedRank ? true : undefined} {...register("proposedRank")} />
              {errors.proposedRank ? <p className="text-sm text-destructive">{errors.proposedRank.message}</p> : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Jabatan usulan</Label>
              <Controller
                control={control}
                name="proposedPositionId"
                render={({ field }) => (
                  <Select items={positionItems} value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger className="w-full" aria-label="Jabatan usulan" aria-invalid={errors.proposedPositionId ? true : undefined}>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionItems).map(([value, text]) => (
                        <SelectItem key={value} value={value}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.proposedPositionId ? <p className="text-sm text-destructive">{errors.proposedPositionId.message}</p> : null}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="promotion-date">Tanggal berlaku (opsional)</Label>
            <Input id="promotion-date" type="date" aria-invalid={errors.effectiveDate ? true : undefined} {...register("effectiveDate")} />
            <p className="text-xs text-muted-foreground">Jika kosong, dipakai tanggal usulan dijalankan.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="promotion-reason">Alasan (opsional)</Label>
            <Input id="promotion-reason" {...register("reason")} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={propose.isPending}>
            Batal
          </Button>
          <Button type="submit" form="promotion-form" disabled={propose.isPending}>
            {propose.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Buat usulan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
