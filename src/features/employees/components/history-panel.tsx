"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HistoryIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteHistory, useHistory, useSaveHistory } from "@/features/employees/hooks/use-employee-records";
import { historySchema, type HistoryFormValues } from "@/features/employees/schemas/history-schemas";
import {
  HISTORY_CONFIGS,
  type HistoryConfig,
  type HistoryField,
  type HistoryRow,
} from "@/features/employees/types/histories";
import { usePositions, useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { ApiError } from "@/lib/api-error";

const NONE = "none";
const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

type Lookups = { positions: Record<string, string>; workUnits: Record<string, string> };

function useLookups(): Lookups {
  const positions = usePositions();
  const workUnits = useWorkUnits();
  return {
    positions: Object.fromEntries((positions.data ?? []).map((p) => [p.id, p.name])),
    workUnits: Object.fromEntries((workUnits.data ?? []).map((u) => [u.id, u.name])),
  };
}

function displayValue(field: HistoryField, value: string, lookups: Lookups): string {
  if (value === "") return "—";
  if (field.kind === "date") return dateFormatter.format(new Date(`${value}T00:00:00Z`));
  if (field.kind === "position") return lookups.positions[value] ?? "—";
  if (field.kind === "workUnit") return lookups.workUnits[value] ?? "—";
  return value;
}

type HistoryDialogProps = {
  config: HistoryConfig;
  employeeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: HistoryRow | null;
  lookups: Lookups;
};

function emptyValues(config: HistoryConfig, row: HistoryRow | null): HistoryFormValues {
  return Object.fromEntries(config.fields.map((f) => [f.key, row?.values[f.key] ?? ""]));
}

function HistoryDialog({ config, employeeId, open, onOpenChange, row, lookups }: HistoryDialogProps) {
  const save = useSaveHistory(config, employeeId);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HistoryFormValues>({
    resolver: zodResolver(historySchema(config)) as Resolver<HistoryFormValues>,
    defaultValues: emptyValues(config, row),
  });

  useEffect(() => {
    if (open) reset(emptyValues(config, row));
  }, [open, row, config, reset]);

  const onSubmit = (values: HistoryFormValues) =>
    save.mutate(
      { rowId: row?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(row ? "Riwayat diperbarui." : "Riwayat ditambahkan.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat gagal disimpan."),
      },
    );

  const renderField = (field: HistoryField) => {
    const error = errors[field.key]?.message;
    const label = field.required ? `${field.label} *` : field.label;
    if (field.kind === "position" || field.kind === "workUnit") {
      const options = field.kind === "position" ? lookups.positions : lookups.workUnits;
      const items = { [NONE]: "—", ...options };
      return (
        <div key={field.key} className="space-y-2">
          <Label>{label}</Label>
          <Controller
            control={control}
            name={field.key}
            render={({ field: controlled }) => (
              <Select items={items} value={controlled.value ? controlled.value : NONE} onValueChange={(v) => controlled.onChange(v === NONE || v === null ? "" : v)}>
                <SelectTrigger className="w-full" aria-label={field.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(items).map(([value, text]) => (
                    <SelectItem key={value} value={value}>
                      {text}
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
      <div key={field.key} className="space-y-2">
        <Label htmlFor={`history-${field.key}`}>{label}</Label>
        <Input
          id={`history-${field.key}`}
          type={field.kind === "date" ? "date" : "text"}
          inputMode={field.kind === "year" ? "numeric" : undefined}
          placeholder={field.kind === "year" ? "mis. 2015" : undefined}
          aria-invalid={error ? true : undefined}
          {...register(field.key)}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row ? `Ubah ${config.label}` : config.addLabel}</DialogTitle>
          <DialogDescription>Riwayat {config.label.toLowerCase()} pegawai. Kolom bertanda * wajib diisi.</DialogDescription>
        </DialogHeader>
        <form id="history-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          {config.fields.map(renderField)}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="history-form" disabled={save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryTable({ config, employeeId, canManage }: { config: HistoryConfig; employeeId: string; canManage: boolean }) {
  const history = useHistory(config, employeeId);
  const remove = useDeleteHistory(config, employeeId);
  const lookups = useLookups();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HistoryRow | null>(null);
  const [deleting, setDeleting] = useState<HistoryRow | null>(null);

  const rows = history.data ?? [];
  const openDialog = (row: HistoryRow | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Riwayat dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat gagal dihapus."),
    });
  };

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => openDialog(null)}>
            <PlusIcon />
            {config.addLabel}
          </Button>
        </div>
      ) : null}
      <Card className="gap-0 py-0">
        {history.isPending ? (
          <TableSkeleton rows={3} />
        ) : history.isError ? (
          <QueryErrorState error={history.error} onRetry={() => void history.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="Belum ada data" description={config.emptyDescription} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                {config.fields.map((field, index) => (
                  <TableHead key={field.key} className={index === 0 ? "pl-6" : undefined}>
                    {field.label}
                  </TableHead>
                ))}
                {canManage ? (
                  <TableHead className="w-24 pr-6">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-accent/15">
                  {config.fields.map((field, index) => (
                    <TableCell key={field.key} className={index === 0 ? "pl-6 font-medium" : "text-muted-foreground"}>
                      {displayValue(field, row.values[field.key] ?? "", lookups)}
                    </TableCell>
                  ))}
                  {canManage ? (
                    <TableCell className="pr-6 text-right">
                      <Button variant="ghost" size="icon-sm" aria-label="Ubah riwayat" onClick={() => openDialog(row)}>
                        <PencilIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Hapus riwayat" className="text-destructive hover:text-destructive" onClick={() => setDeleting(row)}>
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <HistoryDialog config={config} employeeId={employeeId} open={dialogOpen} onOpenChange={setDialogOpen} row={editing} lookups={lookups} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !remove.isPending && !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus riwayat?</DialogTitle>
            <DialogDescription>Catatan {config.label.toLowerCase()} ini akan dihapus dari data pegawai.</DialogDescription>
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
    </div>
  );
}

export function HistoryPanel({ employeeId, canManage }: { employeeId: string; canManage: boolean }) {
  const [type, setType] = useState<string>(HISTORY_CONFIGS[0].type);
  const config = HISTORY_CONFIGS.find((c) => c.type === type) ?? HISTORY_CONFIGS[0];

  return (
    <div className="space-y-4">
      <Tabs value={type} onValueChange={(value) => typeof value === "string" && setType(value)}>
        <TabsList className="h-auto flex-wrap justify-start">
          {HISTORY_CONFIGS.map((item) => (
            <TabsTrigger key={item.type} value={item.type}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <HistoryTable key={config.type} config={config} employeeId={employeeId} canManage={canManage} />
    </div>
  );
}
