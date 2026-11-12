"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCapIcon, PencilIcon, PlusIcon, SearchIcon, SearchXIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PaginationBar } from "@/components/common/pagination-bar";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { EducationHistoryDialog } from "@/features/employee-history/components/education-history-dialog";
import { useDeleteEducationHistory, useEducationHistories } from "@/features/employee-history/hooks/use-histories";
import { HISTORY_PAGE_SIZE, type EducationHistory } from "@/features/employee-history/types/history";
import { ApiError } from "@/lib/api-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type EducationHistoryPanelProps = {
  /** Set inside the employee detail page; omitted on the menu page listing every employee. */
  employeeId?: string;
  canManage: boolean;
};

export function EducationHistoryPanel({ employeeId, canManage }: EducationHistoryPanelProps) {
  const isStandalone = employeeId === undefined;
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [pageState, setPageState] = useState({ search: "", page: 1 });
  // Back to page 1 whenever the search changes.
  const page = pageState.search === search ? pageState.page : 1;
  const histories = useEducationHistories({ employeeId: employeeId ?? null, search, page });
  const remove = useDeleteEducationHistory();
  const [editing, setEditing] = useState<EducationHistory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<EducationHistory | null>(null);

  const openDialog = (entry: EducationHistory | null) => {
    setEditing(entry);
    setDialogOpen(true);
  };
  const rows = histories.data?.rows ?? [];

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting, {
      onSuccess: () => {
        toast.success("Riwayat pendidikan dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat pendidikan gagal dihapus."),
    });
  };

  const addButton = canManage ? (
    <Button size={isStandalone ? "default" : "sm"} onClick={() => openDialog(null)}>
      <PlusIcon />
      Tambah Riwayat Pendidikan
    </Button>
  ) : undefined;

  return (
    <>
      {isStandalone ? (
        <PageHeader
          title="Riwayat Pendidikan"
          description="Pendidikan formal dosen dan tenaga kependidikan, beserta ijazahnya."
          breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Kepegawaian" }, { label: "Riwayat Pendidikan" }]}
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
              <CardTitle className="text-lg font-semibold">Riwayat pendidikan</CardTitle>
              <CardDescription>Diurutkan dari tahun lulus terbaru.</CardDescription>
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
            <EmptyState icon={SearchXIcon} title="Tidak ada hasil" description="Tidak ada riwayat pendidikan untuk nama tersebut." />
          ) : (
            <EmptyState
              icon={GraduationCapIcon}
              title="Belum ada riwayat pendidikan"
              description="Catat jenjang, institusi, dan file ijazah."
              action={canManage ? (
                <Button size="sm" onClick={() => openDialog(null)}>
                  <PlusIcon />
                  Tambah Riwayat Pendidikan
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
                  <TableHead className={isStandalone ? undefined : "pl-6"}>Pendidikan</TableHead>
                  <TableHead className="hidden md:table-cell">Tahun lulus</TableHead>
                  <TableHead className="hidden lg:table-cell">Ijazah</TableHead>
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
                      <span className="font-medium">
                        {entry.educationLevel} · {entry.institution}
                      </span>
                      <span className="block text-xs text-muted-foreground">{entry.major ?? "Jurusan tidak diisi"}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{entry.graduationYear ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {entry.certificatePath ? <FileLinkButton path={entry.certificatePath} label="Lihat ijazah" /> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => openDialog(entry)} aria-label="Ubah riwayat pendidikan">
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(entry)}
                          aria-label="Hapus riwayat pendidikan"
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

      <EducationHistoryDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} fixedEmployeeId={employeeId ?? null} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus riwayat pendidikan?"
        description={
          deleting
            ? `Riwayat pendidikan ${deleting.educationLevel} ${deleting.institution} milik ${deleting.employeeName} beserta file ijazahnya akan dihapus permanen.`
            : ""
        }
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </>
  );
}
