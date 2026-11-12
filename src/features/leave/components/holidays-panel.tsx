"use client";

import { useState } from "react";
import { CalendarOffIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { useCreateHoliday, useDeleteHoliday, useHolidays } from "@/features/leave/hooks/use-leave";
import { holidaySchema, type HolidayFormValues } from "@/features/leave/schemas/leave-schemas";
import type { Holiday } from "@/features/leave/types/leave";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

function AddHolidayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateHoliday();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayFormValues>({ resolver: zodResolver(holidaySchema), defaultValues: { date: "", name: "" } });

  const onSubmit = (values: HolidayFormValues) =>
    create.mutate(values, {
      onSuccess: () => {
        toast.success("Hari libur ditambahkan.");
        reset({ date: "", name: "" });
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Hari libur gagal disimpan."),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Hari Libur</DialogTitle>
          <DialogDescription>Tanggal ini tidak dihitung sebagai hari cuti pada pengajuan berikutnya.</DialogDescription>
        </DialogHeader>
        <form id="holiday-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holiday-date">Tanggal</Label>
            <Input id="holiday-date" type="date" aria-invalid={errors.date ? true : undefined} {...register("date")} />
            {errors.date ? <p className="text-sm text-destructive">{errors.date.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-name">Nama hari libur</Label>
            <Input id="holiday-name" placeholder="mis. Hari Kemerdekaan RI" aria-invalid={errors.name ? true : undefined} {...register("name")} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Batal
          </Button>
          <Button type="submit" form="holiday-form" disabled={create.isPending}>
            {create.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HolidaysPanel() {
  const [year, setYear] = useState(Number(todayInCampus().slice(0, 4)));
  const holidays = useHolidays(`${year}-01-01`, `${year}-12-31`);
  const remove = useDeleteHoliday();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | null>(null);

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.date, {
      onSuccess: () => {
        toast.success("Hari libur dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Hari libur gagal dihapus."),
    });
  };

  return (
    <>
      <PageHeader
        title="Hari Libur"
        description="Daftar tanggal merah. Hari Minggu otomatis tidak dihitung, jadi tidak perlu dimasukkan."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Cuti & Izin" }, { label: "Hari Libur" }]}
        actions={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon />
            Tambah Hari Libur
          </Button>
        }
      />

      <Input
        type="number"
        value={year}
        min={2000}
        max={2100}
        onChange={(event) => Number(event.target.value) >= 2000 && setYear(Number(event.target.value))}
        aria-label="Tahun"
        className="w-28"
      />

      <Card className="gap-0 py-0">
        {holidays.isPending ? (
          <TableSkeleton />
        ) : holidays.isError ? (
          <QueryErrorState error={holidays.error} onRetry={() => void holidays.refetch()} />
        ) : holidays.data.length === 0 ? (
          <EmptyState
            icon={CalendarOffIcon}
            title={`Belum ada hari libur ${year}`}
            description="Isi tanggal merah agar perhitungan hari cuti akurat."
            action={
              <Button size="sm" onClick={() => setAdding(true)}>
                <PlusIcon />
                Tambah Hari Libur
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Tanggal</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-14 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.data.map((holiday) => (
                <TableRow key={holiday.date} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium tabular-nums">{dateFormatter.format(new Date(`${holiday.date}T00:00:00Z`))}</TableCell>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${holiday.name}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(holiday)}>
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddHolidayDialog open={adding} onOpenChange={setAdding} />

      <Dialog open={deleting !== null} onOpenChange={(next) => !remove.isPending && !next && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus hari libur?</DialogTitle>
            <DialogDescription>
              {deleting?.name}. Pengajuan yang sudah dibuat tidak dihitung ulang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? <Loader2Icon className="animate-spin" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
