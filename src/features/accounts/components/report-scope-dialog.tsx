"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/common/query-error-state";
import { useAddReportScope, useDeleteReportScope, useReportScopes } from "@/features/accounts/hooks/use-accounts";
import { reportScopeSchema, type ReportScopeFormValues } from "@/features/accounts/schemas/account-schemas";
import { REPORT_LABELS, type ReportKey, type ReportScope, type UserAccount } from "@/features/accounts/types/accounts";
import { useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { WORK_UNIT_TYPE_LABELS } from "@/features/master-data/types/master-data";
import { ApiError } from "@/lib/api-error";

const CAMPUS = "campus";
const CATEGORY_ITEMS = { all: "Dosen dan tenaga kependidikan", lecturer: "Dosen saja", staff: "Tenaga kependidikan saja" };
const REPORT_KEYS = Object.keys(REPORT_LABELS) as ReportKey[];
const DEFAULT_VALUES: ReportScopeFormValues = { workUnitId: CAMPUS, category: "all", reports: [...REPORT_KEYS] };

function describe(scope: ReportScope): string {
  const unit = scope.workUnitName ?? "Seluruh kampus";
  const category = scope.category === "lecturer" ? "Dosen" : scope.category === "staff" ? "Tenaga kependidikan" : "Dosen dan tendik";
  return `${unit} · ${category}`;
}

function ScopeList({ account }: { account: UserAccount }) {
  const scopes = useReportScopes(account.id);
  const remove = useDeleteReportScope(account.id);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (scopes.isPending) return <Skeleton className="h-16 w-full" />;
  if (scopes.isError) return <QueryErrorState error={scopes.error} onRetry={() => void scopes.refetch()} />;
  if (scopes.data.length === 0) {
    return <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">Belum ada cakupan. Akun ini belum bisa melihat statistik.</p>;
  }

  const confirmRemove = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("Cakupan dihapus.");
        setConfirming(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Cakupan gagal dihapus."),
    });

  return (
    <ul className="divide-y rounded-lg border">
      {scopes.data.map((scope) => (
        <li key={scope.id} className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{describe(scope)}</p>
            <div className="flex flex-wrap gap-1.5">
              {scope.reports.map((key) => (
                <Badge key={key} variant="accent">
                  {REPORT_LABELS[key]}
                </Badge>
              ))}
            </div>
          </div>
          {confirming === scope.id ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirming(null)} disabled={remove.isPending}>
                Batal
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmRemove(scope.id)} disabled={remove.isPending}>
                {remove.isPending ? <Loader2Icon className="animate-spin" /> : null}
                Hapus
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label={`Hapus cakupan ${describe(scope)}`} className="text-destructive hover:text-destructive" onClick={() => setConfirming(scope.id)}>
              <Trash2Icon />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function AddScopeForm({ account }: { account: UserAccount }) {
  const add = useAddReportScope(account.id);
  const workUnits = useWorkUnits();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportScopeFormValues>({ resolver: zodResolver(reportScopeSchema), defaultValues: DEFAULT_VALUES });

  const unitItems = {
    [CAMPUS]: "Seluruh kampus",
    ...Object.fromEntries(
      (workUnits.data ?? []).filter((u) => u.isActive).map((u) => [u.id, `${u.name} (${WORK_UNIT_TYPE_LABELS[u.unitType]})`]),
    ),
  };

  const onSubmit = (values: ReportScopeFormValues) =>
    add.mutate(
      {
        workUnitId: values.workUnitId === CAMPUS ? null : values.workUnitId,
        category: values.category === "all" ? null : values.category,
        reports: values.reports,
      },
      {
        onSuccess: () => {
          toast.success("Cakupan ditambahkan.");
          reset(DEFAULT_VALUES);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Cakupan gagal ditambahkan."),
      },
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-lg border bg-muted/40 p-4">
      <p className="text-sm font-medium">Tambah cakupan</p>
      <div className="space-y-2">
        <Label>Unit kerja</Label>
        <Controller
          control={control}
          name="workUnitId"
          render={({ field }) => (
            <Select items={unitItems} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
              <SelectTrigger className="w-full" aria-label="Unit kerja">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(unitItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Unit yang dipilih beserta semua unit di bawahnya ikut dihitung.
          {account.roleCode === "vice_chair" ? " Untuk Wakil Ketua, pilih unit bidangnya." : ""}
        </p>
      </div>
      <div className="space-y-2">
        <Label>Kategori pegawai</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select items={CATEGORY_ITEMS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
              <SelectTrigger className="w-full" aria-label="Kategori pegawai">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Laporan yang boleh dilihat</legend>
        <Controller
          control={control}
          name="reports"
          render={({ field }) => (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {REPORT_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={field.value.includes(key)}
                    onChange={(event) => field.onChange(event.target.checked ? [...field.value, key] : field.value.filter((k) => k !== key))}
                  />
                  {REPORT_LABELS[key]}
                </label>
              ))}
            </div>
          )}
        />
        {errors.reports ? <p className="text-sm text-destructive">{errors.reports.message}</p> : null}
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={add.isPending}>
          {add.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          Tambah cakupan
        </Button>
      </div>
    </form>
  );
}

type ReportScopeDialogProps = {
  account: UserAccount | null;
  onOpenChange: (open: boolean) => void;
};

export function ReportScopeDialog({ account, onOpenChange }: ReportScopeDialogProps) {
  return (
    <Dialog open={account !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        {account ? (
          <>
            <DialogHeader>
              <DialogTitle>Cakupan Statistik</DialogTitle>
              <DialogDescription>
                {account.email} · {account.roleName}. Pimpinan hanya melihat angka agregat pada cakupan di bawah ini, tanpa data per pegawai.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <ScopeList account={account} />
              <AddScopeForm key={account.id} account={account} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
