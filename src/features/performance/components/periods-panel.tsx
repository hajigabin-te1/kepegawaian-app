"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRangeIcon, ClipboardPlusIcon, Loader2Icon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { useGenerateAppraisals, usePeriods, useSavePeriod } from "@/features/performance/hooks/use-performance";
import { periodSchema, type PeriodFormValues } from "@/features/performance/schemas/performance-schemas";
import { PERIOD_TYPE_LABELS, type AppraisalPeriod } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));
const STATUS_ITEMS = { active: "Aktif (form bisa dibuat)", closed: "Ditutup" };

const toValues = (period: AppraisalPeriod | null): PeriodFormValues =>
  period
    ? { name: period.name, periodType: period.periodType, startDate: period.startDate, endDate: period.endDate, isActive: period.isActive }
    : { name: "", periodType: "annual", startDate: "", endDate: "", isActive: true };

function PeriodDialog({ open, onOpenChange, period }: { open: boolean; onOpenChange: (open: boolean) => void; period: AppraisalPeriod | null }) {
  const save = useSavePeriod();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodFormValues>({ resolver: zodResolver(periodSchema), defaultValues: toValues(period) });

  useEffect(() => {
    if (open) reset(toValues(period));
  }, [open, period, reset]);

  const onSubmit = (values: PeriodFormValues) =>
    save.mutate(
      { id: period?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(period ? "Periode diperbarui." : "Periode ditambahkan.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Periode gagal disimpan."),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{period ? "Ubah Periode" : "Tambah Periode"}</DialogTitle>
          <DialogDescription>Periode menentukan kapan penilaian kinerja dilakukan.</DialogDescription>
        </DialogHeader>
        <form id="period-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period-name">Nama periode</Label>
            <Input id="period-name" placeholder="mis. Penilaian Tahun 2026" aria-invalid={errors.name ? true : undefined} {...register("name")} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis</Label>
              <Controller
                control={control}
                name="periodType"
                render={({ field }) => (
                  <Select items={PERIOD_TYPE_LABELS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger className="w-full" aria-label="Jenis periode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERIOD_TYPE_LABELS).map(([value, label]) => (
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
              <Label>Status</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Select items={STATUS_ITEMS} value={field.value ? "active" : "closed"} onValueChange={(v) => field.onChange(v === "active")}>
                    <SelectTrigger className="w-full" aria-label="Status periode">
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period-start">Tanggal mulai</Label>
              <Input id="period-start" type="date" aria-invalid={errors.startDate ? true : undefined} {...register("startDate")} />
              {errors.startDate ? <p className="text-sm text-destructive">{errors.startDate.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-end">Tanggal selesai</Label>
              <Input id="period-end" type="date" aria-invalid={errors.endDate ? true : undefined} {...register("endDate")} />
              {errors.endDate ? <p className="text-sm text-destructive">{errors.endDate.message}</p> : null}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="period-form" disabled={save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PeriodsPanel() {
  const periods = usePeriods();
  const generate = useGenerateAppraisals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppraisalPeriod | null>(null);
  const [generating, setGenerating] = useState<AppraisalPeriod | null>(null);

  const openDialog = (period: AppraisalPeriod | null) => {
    setEditing(period);
    setDialogOpen(true);
  };

  const confirmGenerate = () => {
    if (!generating) return;
    generate.mutate(generating.id, {
      onSuccess: (count) => {
        toast.success(count > 0 ? `${count} form penilaian dibuat.` : "Semua pegawai aktif sudah punya form pada periode ini.");
        setGenerating(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Form gagal dibuat."),
    });
  };

  return (
    <>
      <PageHeader
        title="Periode Penilaian"
        description="Buka periode, lalu buat form penilaian untuk seluruh pegawai aktif."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Penilaian Kinerja" }, { label: "Periode" }]}
        actions={
          <Button onClick={() => openDialog(null)}>
            <PlusIcon />
            Tambah Periode
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        {periods.isPending ? (
          <TableSkeleton />
        ) : periods.isError ? (
          <QueryErrorState error={periods.error} onRetry={() => void periods.refetch()} />
        ) : periods.data.length === 0 ? (
          <EmptyState
            icon={CalendarRangeIcon}
            title="Belum ada periode"
            description="Tambahkan periode penilaian untuk mulai membuat form."
            action={
              <Button size="sm" onClick={() => openDialog(null)}>
                <PlusIcon />
                Tambah Periode
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Periode</TableHead>
                <TableHead className="hidden sm:table-cell">Jenis</TableHead>
                <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.data.map((period) => (
                <TableRow key={period.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{period.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{PERIOD_TYPE_LABELS[period.periodType]}</TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                    {formatDate(period.startDate)} – {formatDate(period.endDate)}
                  </TableCell>
                  <TableCell>
                    <ActiveStatusBadge isActive={period.isActive} />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      {period.isActive ? (
                        <Button variant="outline" size="sm" onClick={() => setGenerating(period)}>
                          <ClipboardPlusIcon />
                          Buat form
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${period.name}`} onClick={() => openDialog(period)}>
                        <PencilIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PeriodDialog open={dialogOpen} onOpenChange={setDialogOpen} period={editing} />

      <Dialog open={generating !== null} onOpenChange={(next) => !generate.isPending && !next && setGenerating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat form penilaian?</DialogTitle>
            <DialogDescription>
              Satu form draf dibuat untuk setiap pegawai aktif pada {generating?.name}. Pegawai yang sudah punya form tidak diduplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerating(null)} disabled={generate.isPending}>
              Batal
            </Button>
            <Button onClick={confirmGenerate} disabled={generate.isPending}>
              {generate.isPending ? <Loader2Icon className="animate-spin" /> : null}
              Buat form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
