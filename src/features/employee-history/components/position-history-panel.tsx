"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseIcon, PencilIcon, PlusIcon, SearchIcon, SearchXIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PaginationBar } from "@/components/common/pagination-bar";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_TIME_ZONE } from "@/config/locale";
import { routes } from "@/config/routes";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { PositionHistoryDialog } from "@/features/employee-history/components/position-history-dialog";
import { useDeletePositionHistory, usePositionHistories } from "@/features/employee-history/hooks/use-histories";
import { HISTORY_PAGE_SIZE, type PositionHistory } from "@/features/employee-history/types/history";
import { ApiError } from "@/lib/api-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE });

type PositionHistoryPanelProps = {
  /** Set inside the employee detail page; omitted on the menu page listing every employee. */
  employeeId?: string;
  canManage: boolean;
};

export function PositionHistoryPanel({ employeeId, canManage }: PositionHistoryPanelProps) {
  const isStandalone = employeeId === undefined;
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [pageState, setPageState] = useState({ search: "", page: 1 });
  // Back to page 1 whenever the search changes.
  const page = pageState.search === search ? pageState.page : 1;
  const histories = usePositionHistories({ employeeId: employeeId ?? null, search, page });
  const remove = useDeletePositionHistory();
  const [editing, setEditing] = useState<PositionHistory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<PositionHistory | null>(null);

  const openDialog = (entry: PositionHistory | null) => {
    setEditing(entry);
    setDialogOpen(true);
  };
  const rows = histories.data?.rows ?? [];

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting, {
      onSuccess: () => {
        toast.success("Riwayat jabatan dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat jabatan gagal dihapus."),
    });
  };

  const addButton = canManage ? (
    <Button size={isStandalone ? "default" : "sm"} onClick={() => openDialog(null)}>
      <PlusIcon />
      Tambah Riwayat Jabatan
    </Button>
  ) : undefined;

  return (
    <>
      {isStandalone ? (
        <PageHeader
          title="Riwayat Jabatan"
          description="Jabatan yang pernah dan sedang diemban pegawai, beserta SK-nya."
          breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Kepegawaian" }, { label: "Riwayat Jabatan" }]}
          actions={addButton}
        />
      ) : null}

      <Card className="gap-0 py-0">
        {isStandalone ? (
          <div className="border-b p-4">
            <div className="relative max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama pegawai…"
                className="pl-9"
                aria-label="Cari nama pegawai"
              />
            </div>
          </div>
        ) : (
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b py-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Riwayat jabatan</CardTitle>
              <CardDescription>Diurutkan dari yang terbaru.</CardDescription>
            </div>
            {addButton}
          </CardHeader>
        )}

        {histories.isPending ? (
          <TableSkeleton rows={4} />
        ) : histories.isError ? (
          <QueryErrorState error={histories.error} onRetry={() => void histories.refetch()} />
        ) : rows.length === 0 ? (
          search ? (
            <EmptyState icon={SearchXIcon} title="Tidak ada hasil" description="Tidak ada riwayat jabatan untuk nama tersebut." />
          ) : (
            <EmptyState
              icon={BriefcaseIcon}
              title="Belum ada riwayat jabatan"
              description="Catat jabatan beserta nomor dan file SK-nya."
              action={canManage ? (
                <Button size="sm" onClick={() => openDialog(null)}>
                  <PlusIcon />
                  Tambah Riwayat Jabatan
                </Button>
              ) : undefined}
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  {isStandalone ? <TableHead className="pl-6">Pegawai</TableHead> : null}
                  <TableHead className={isStandalone ? undefined : "pl-6"}>Jabatan</TableHead>
                  <TableHead className="hidden md:table-cell">Periode</TableHead>
                  <TableHead className="hidden lg:table-cell">SK</TableHead>
                  {canManage ? (
                    <TableHead className="w-24 pr-6">
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-accent/15">
                    {isStandalone ? (
                      <TableCell className="pl-6">
                        <Link href={routes.employees.detail(entry.employeeId)} className="font-medium hover:underline">
                          {entry.employeeName}
                        </Link>
                        {entry.employeeNumber ? (
                          <span className="block text-xs text-muted-foreground tabular-nums">NIP {entry.employeeNumber}</span>
                        ) : null}
                      </TableCell>
                    ) : null}
                    <TableCell className={isStandalone ? undefined : "pl-6"}>
                      <span className="flex items-center gap-2 font-medium">
                        {entry.positionName ?? "—"}
                        {entry.endDate === null ? <Badge variant="accent">Saat ini</Badge> : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">{entry.workUnitName ?? "Unit kerja tidak diisi"}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {dateFormatter.format(new Date(entry.startDate))} – {entry.endDate ? dateFormatter.format(new Date(entry.endDate)) : "sekarang"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="block text-sm tabular-nums">{entry.decreeNumber ?? "—"}</span>
                      {entry.decreePath ? <FileLinkButton path={entry.decreePath} label="Lihat SK" /> : null}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => openDialog(entry)} aria-label="Ubah riwayat jabatan">
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(entry)}
                          aria-label="Hapus riwayat jabatan"
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              page={page}
              pageSize={HISTORY_PAGE_SIZE}
              total={histories.data?.total ?? 0}
              itemLabel="riwayat"
              isFetching={histories.isFetching}
              onPageChange={(next) => setPageState({ search, page: next })}
            />
          </>
        )}
      </Card>

      <PositionHistoryDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} fixedEmployeeId={employeeId ?? null} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus riwayat jabatan?"
        description={
          deleting
            ? `Riwayat jabatan ${deleting.positionName ?? ""} milik ${deleting.employeeName} beserta file SK-nya akan dihapus permanen.`
            : ""
        }
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </>
  );
}
