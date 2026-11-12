"use client";

import { useState } from "react";
import Link from "next/link";
import { FileTextIcon, SearchIcon, SearchXIcon, Trash2Icon, UploadIcon } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_TIME_ZONE } from "@/config/locale";
import { routes } from "@/config/routes";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { UploadDocumentDialog } from "@/features/documents/components/upload-document-dialog";
import { useDeleteDocument, useDocuments } from "@/features/documents/hooks/use-documents";
import {
  ALL_DOCUMENT_TYPES,
  DOCUMENT_PAGE_SIZE,
  DOCUMENT_TYPES,
  type EmployeeDocument,
} from "@/features/documents/types/documents";
import { ApiError } from "@/lib/api-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE });
const TYPE_FILTER_ITEMS: Record<string, string> = {
  [ALL_DOCUMENT_TYPES]: "Semua jenis",
  ...Object.fromEntries(DOCUMENT_TYPES.map((type) => [type, type])),
};

type DocumentsPanelProps = {
  /** Set inside the employee detail page; omitted on the menu page listing every employee. */
  employeeId?: string;
  canManage: boolean;
};

export function DocumentsPanel({ employeeId, canManage }: DocumentsPanelProps) {
  const isStandalone = employeeId === undefined;
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [documentType, setDocumentType] = useState<string>(ALL_DOCUMENT_TYPES);
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  // Back to page 1 whenever the search or type filter changes.
  const filterKey = `${search}|${documentType}`;
  const page = pageState.key === filterKey ? pageState.page : 1;
  const documents = useDocuments({ employeeId: employeeId ?? null, search, documentType, page });
  const remove = useDeleteDocument();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<EmployeeDocument | null>(null);

  const rows = documents.data?.rows ?? [];
  const hasFilters = search !== "" || documentType !== ALL_DOCUMENT_TYPES;

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting, {
      onSuccess: () => {
        toast.success("Dokumen dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Dokumen gagal dihapus."),
    });
  };

  const uploadButton = canManage ? (
    <Button size={isStandalone ? "default" : "sm"} onClick={() => setUploading(true)}>
      <UploadIcon />
      Unggah Dokumen
    </Button>
  ) : undefined;

  const typeFilter = (
    <Select items={TYPE_FILTER_ITEMS} value={documentType} onValueChange={(value) => value && setDocumentType(value)}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter jenis dokumen">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TYPE_FILTER_ITEMS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      {isStandalone ? (
        <PageHeader
          title="Dokumen Pegawai"
          description="SK, ijazah, sertifikat, dan dokumen kepegawaian lainnya."
          breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Dokumen" }, { label: "Dokumen Pegawai" }]}
          actions={uploadButton}
        />
      ) : null}

      <Card className="gap-0 py-0">
        {isStandalone ? (
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <div className="relative flex-1 sm:max-w-md">
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
            {typeFilter}
          </div>
        ) : (
          <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Dokumen</CardTitle>
              <CardDescription>File tersimpan privat. PDF, JPG, atau PNG, maksimal 5 MB.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {typeFilter}
              {uploadButton}
            </div>
          </CardHeader>
        )}

        {documents.isPending ? (
          <TableSkeleton rows={4} />
        ) : documents.isError ? (
          <QueryErrorState error={documents.error} onRetry={() => void documents.refetch()} />
        ) : rows.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={SearchXIcon} title="Tidak ada dokumen yang cocok" description="Ubah kata kunci atau jenis dokumen." />
          ) : (
            <EmptyState
              icon={FileTextIcon}
              title="Belum ada dokumen"
              description="Unggah SK, ijazah, atau sertifikat pegawai."
              action={canManage ? (
                <Button size="sm" onClick={() => setUploading(true)}>
                  <UploadIcon />
                  Unggah Dokumen
                </Button>
              ) : undefined}
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="pl-6">Dokumen</TableHead>
                  {isStandalone ? <TableHead className="hidden md:table-cell">Pegawai</TableHead> : null}
                  <TableHead className="hidden sm:table-cell">Diunggah</TableHead>
                  <TableHead className="w-40 pr-6">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((document) => (
                  <TableRow key={document.id} className="hover:bg-accent/15">
                    <TableCell className="pl-6">
                      <span className="flex items-center gap-2">
                        <Badge variant="accent">{document.documentType}</Badge>
                        <span className="font-medium">{document.title}</span>
                      </span>
                    </TableCell>
                    {isStandalone ? (
                      <TableCell className="hidden md:table-cell">
                        <Link href={routes.employees.detail(document.employeeId)} className="hover:underline">
                          {document.employeeName}
                        </Link>
                      </TableCell>
                    ) : null}
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {dateFormatter.format(new Date(document.createdAt))}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <span className="inline-flex items-center gap-2">
                        <FileLinkButton path={document.filePath} label="Buka" />
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(document)}
                            aria-label={`Hapus ${document.title}`}
                          >
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              page={page}
              pageSize={DOCUMENT_PAGE_SIZE}
              total={documents.data?.total ?? 0}
              itemLabel="dokumen"
              isFetching={documents.isFetching}
              onPageChange={(next) => setPageState({ key: filterKey, page: next })}
            />
          </>
        )}
      </Card>

      <UploadDocumentDialog open={uploading} onOpenChange={setUploading} fixedEmployeeId={employeeId ?? null} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus dokumen?"
        description={deleting ? `"${deleting.title}" milik ${deleting.employeeName} akan dihapus permanen beserta file-nya.` : ""}
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </>
  );
}
