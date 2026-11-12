"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployee } from "@/features/employees/hooks/use-employees";
import { formatDays } from "@/features/leave/components/leave-parts";
import { useHolidays, useLeaveTypes, useSubmitLeave } from "@/features/leave/hooks/use-leave";
import { leaveRequestSchema, type LeaveRequestFormValues } from "@/features/leave/schemas/leave-schemas";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES, type LeaveBalance } from "@/features/leave/types/leave";
import { requestedDays } from "@/features/leave/types/leave-days";
import { ApiError } from "@/lib/api-error";

const EMPTY: LeaveRequestFormValues = { typeId: "", startDate: "", endDate: "", reason: "" };
const isIso = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

type LeaveRequestDialogProps = {
  employeeId: string;
  balance: LeaveBalance | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LeaveRequestDialog({ employeeId, balance, open, onOpenChange }: LeaveRequestDialogProps) {
  const types = useLeaveTypes();
  const employee = useEmployee(employeeId);
  const submit = useSubmitLeave(employeeId);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({ resolver: zodResolver(leaveRequestSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const changeOpen = (next: boolean) => {
    if (submit.isPending) return;
    if (!next) {
      setFile(null);
      setFileError(null);
    }
    onOpenChange(next);
  };

  const [typeId, startDate, endDate] = useWatch({ control, name: ["typeId", "startDate", "endDate"] });
  const validRange = isIso(startDate) && isIso(endDate) && endDate >= startDate;
  const holidays = useHolidays(startDate, endDate, validRange);

  const isFemale = employee.data?.gender === "female";
  const available = (types.data ?? []).filter((type) => !type.femaleOnly || isFemale);
  const selected = available.find((type) => type.id === typeId);
  const items = Object.fromEntries(
    available.map((type) => [type.id, type.category === "leave" && !type.countsTowardQuota ? `${type.name} (di luar kuota umum)` : type.name]),
  );

  const days =
    selected && validRange && holidays.data
      ? requestedDays(selected.code, startDate, endDate, new Set(holidays.data.map((h) => h.date)))
      : null;
  const usesQuota = selected?.category === "leave" && selected.countsTowardQuota;
  const overQuota = usesQuota && days !== null && balance !== undefined && days > balance.remaining;

  const onSubmit = (values: LeaveRequestFormValues) => {
    if (file && file.size > ATTACHMENT_MAX_BYTES) return setFileError("Ukuran lampiran maksimal 10 MB.");
    if (selected?.requiresDocument && !file) return setFileError("Jenis ini wajib melampirkan dokumen.");
    setFileError(null);
    submit.mutate(
      { values, file },
      {
        onSuccess: () => {
          toast.success("Pengajuan terkirim ke Bagian Kepegawaian.");
          setFile(null);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengajuan gagal dikirim."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajukan Cuti/Izin</DialogTitle>
          <DialogDescription>Hari Minggu dan tanggal merah tidak dihitung sebagai hari cuti.</DialogDescription>
        </DialogHeader>

        <form id="leave-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis cuti/izin</Label>
            <Controller
              control={control}
              name="typeId"
              render={({ field }) => (
                <Select items={items} value={field.value || null} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger className="w-full" aria-label="Jenis cuti/izin" aria-invalid={errors.typeId ? true : undefined}>
                    <SelectValue placeholder={types.isPending ? "Memuat…" : "Pilih jenis"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(items).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.typeId ? <p className="text-sm text-destructive">{errors.typeId.message}</p> : null}
            {selected?.maxMonths ? <p className="text-xs text-muted-foreground">Maksimal {selected.maxMonths} bulan per pengajuan.</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leave-start">Tanggal mulai</Label>
              <Input id="leave-start" type="date" aria-invalid={errors.startDate ? true : undefined} {...register("startDate")} />
              {errors.startDate ? <p className="text-sm text-destructive">{errors.startDate.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-end">Tanggal selesai</Label>
              <Input id="leave-end" type="date" aria-invalid={errors.endDate ? true : undefined} {...register("endDate")} />
              {errors.endDate ? <p className="text-sm text-destructive">{errors.endDate.message}</p> : null}
            </div>
          </div>

          {days !== null ? (
            <p className={overQuota || days === 0 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              {days === 0
                ? "Tanggal yang dipilih tidak berisi hari kerja."
                : `Dihitung ${formatDays(days)}${usesQuota && balance ? ` · sisa kuota ${formatDays(balance.remaining)}` : ""}${overQuota ? " — kuota tidak mencukupi" : ""}.`}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="leave-reason">Alasan</Label>
            <Input id="leave-reason" aria-invalid={errors.reason ? true : undefined} {...register("reason")} />
            {errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-file">Lampiran {selected?.requiresDocument ? "" : "(opsional)"}</Label>
            <Input
              id="leave-file"
              type="file"
              accept={ATTACHMENT_ACCEPT}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              aria-invalid={fileError ? true : undefined}
            />
            <p className="text-xs text-muted-foreground">Mis. surat dokter untuk sakit berkepanjangan. PDF, JPG, atau PNG, maksimal 10 MB.</p>
            {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => changeOpen(false)} disabled={submit.isPending}>
            Batal
          </Button>
          <Button type="submit" form="leave-form" disabled={submit.isPending}>
            {submit.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Kirim pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
