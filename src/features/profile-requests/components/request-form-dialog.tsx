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
import { GENDER_LABELS, MARITAL_LABELS } from "@/features/employees/types/employees";
import { useSubmitRequest } from "@/features/profile-requests/hooks/use-profile-requests";
import { profileRequestSchema, type ProfileRequestFormValues } from "@/features/profile-requests/schemas/profile-request-schemas";
import { CHANGE_FIELDS, type ChangeFieldKey, type FieldValues } from "@/features/profile-requests/types/profile-requests";
import { ApiError } from "@/lib/api-error";

const NONE = "none";

type RequestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: FieldValues;
};

export function RequestFormDialog({ open, onOpenChange, current }: RequestFormDialogProps) {
  const submit = useSubmitRequest();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProfileRequestFormValues>({
    resolver: zodResolver(profileRequestSchema),
    defaultValues: { ...current, reason: "" },
  });

  useEffect(() => {
    if (open) reset({ ...current, reason: "" });
  }, [open, current, reset]);

  const onSubmit = ({ reason, ...values }: ProfileRequestFormValues) => {
    const changes: Partial<Record<ChangeFieldKey, string>> = {};
    for (const field of CHANGE_FIELDS) {
      const next = values[field.key].trim();
      if (next !== current[field.key]) changes[field.key] = next;
    }
    if (Object.keys(changes).length === 0) {
      setError("reason", { message: "Ubah minimal satu data sebelum mengajukan." });
      return;
    }
    submit.mutate(
      { changes, reason },
      {
        onSuccess: () => {
          toast.success("Pengajuan perbaikan data terkirim ke Bagian Kepegawaian.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengajuan gagal dikirim."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajukan Perbaikan Data</DialogTitle>
          <DialogDescription>
            Ubah data yang keliru, lalu jelaskan alasannya. Data baru berlaku setelah disetujui Bagian Kepegawaian.
          </DialogDescription>
        </DialogHeader>

        <form id="profile-request-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          {CHANGE_FIELDS.map((field) => {
            const error = errors[field.key]?.message;
            if (field.kind === "gender" || field.kind === "marital") {
              const items = { [NONE]: "—", ...(field.kind === "gender" ? GENDER_LABELS : MARITAL_LABELS) };
              return (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Controller
                    control={control}
                    name={field.key}
                    render={({ field: controlled }) => (
                      <Select items={items} value={controlled.value ? controlled.value : NONE} onValueChange={(v) => controlled.onChange(v === NONE || v === null ? "" : v)}>
                        <SelectTrigger className="w-full" aria-label={field.label}>
                          <SelectValue />
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
                </div>
              );
            }
            return (
              <div key={field.key} className={field.key === "address" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                <Label htmlFor={`pr-${field.key}`}>{field.label}</Label>
                <Input id={`pr-${field.key}`} type={field.kind === "date" ? "date" : "text"} aria-invalid={error ? true : undefined} {...register(field.key)} />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            );
          })}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pr-reason">Alasan perbaikan</Label>
            <Input id="pr-reason" placeholder="mis. Salah ketik saat input data awal" aria-invalid={errors.reason ? true : undefined} {...register("reason")} />
            {errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>
            Batal
          </Button>
          <Button type="submit" form="profile-request-form" disabled={submit.isPending}>
            {submit.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Kirim pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
