"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileTextIcon, Loader2Icon, PlusIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteDocument, useDocuments, useUploadDocument } from "@/features/employees/hooks/use-employee-records";
import { documentSchema, type DocumentFormValues } from "@/features/employees/schemas/history-schemas";
import { getDocumentUrl } from "@/features/employees/services/document-service";
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, type EmployeeDocument } from "@/features/employees/types/documents";
import { ApiError } from "@/lib/api-error";

const TYPE_ITEMS = Object.fromEntries(DOCUMENT_TYPES.map((t) => [t, t]));
const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

function UploadDialog({ employeeId, open, onOpenChange }: { employeeId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const upload = useUploadDocument(employeeId);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({ resolver: zodResolver(documentSchema), defaultValues: { documentType: "SK", title: "" } });

  const close = (next: boolean) => {
    if (upload.isPending) return;
    if (!next) {
      reset({ documentType: "SK", title: "" });
      setFileError(null);
      setFile(null);
    }
    onOpenChange(next);
  };

  const onSubmit = (values: DocumentFormValues) => {
    if (!file) return setFileError("Pilih berkas terlebih dahulu.");
    if (file.size > DOCUMENT_MAX_BYTES) return setFileError("Ukuran berkas maksimal 10 MB.");
    setFileError(null);
    upload.mutate(
      { file, values },
      {
        onSuccess: () => {
          toast.success("Dokumen diunggah.");
          reset({ documentType: "SK", title: "" });
          setFile(null);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Dokumen gagal diunggah."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unggah Dokumen</DialogTitle>
          <DialogDescription>Format PDF, JPG, atau PNG, maksimal 10 MB.</DialogDescription>
        </DialogHeader>
        <form id="document-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis dokumen</Label>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => (
                <Select items={TYPE_ITEMS} value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full" aria-label="Jenis dokumen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-title">Judul</Label>
            <Input id="document-title" placeholder="mis. SK Pengangkatan 2020" aria-invalid={errors.title ? true : undefined} {...register("title")} />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-file">Berkas</Label>
            <Input id="document-file" type="file" accept={DOCUMENT_ACCEPT} onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-invalid={fileError ? true : undefined} />
            {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={upload.isPending}>
            Batal
          </Button>
          <Button type="submit" form="document-form" disabled={upload.isPending}>
            {upload.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Unggah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsPanel({ employeeId, canManage }: { employeeId: string; canManage: boolean }) {
  const documents = useDocuments(employeeId);
  const remove = useDeleteDocument(employeeId);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<EmployeeDocument | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const rows = documents.data ?? [];

  const open = async (document: EmployeeDocument) => {
    setOpening(document.id);
    try {
      window.open(await getDocumentUrl(document.filePath), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Berkas tidak dapat dibuka.");
    } finally {
      setOpening(null);
    }
  };

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

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setUploading(true)}>
            <PlusIcon />
            Unggah Dokumen
          </Button>
        </div>
      ) : null}
      <Card className="gap-0 py-0">
        {documents.isPending ? (
          <TableSkeleton rows={3} />
        ) : documents.isError ? (
          <QueryErrorState error={documents.error} onRetry={() => void documents.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={FileTextIcon} title="Belum ada dokumen" description="SK, ijazah, sertifikat, dan berkas lain pegawai akan tampil di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Judul</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="hidden sm:table-cell">Diunggah</TableHead>
                <TableHead className="w-24 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((document) => (
                <TableRow key={document.id} className="hover:bg-accent/15">
                  <TableCell className="pl-6 font-medium">{document.title}</TableCell>
                  <TableCell>
                    <Badge variant="accent">{document.documentType}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">{dateFormatter.format(new Date(document.createdAt))}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Buka ${document.title}`} disabled={opening === document.id} onClick={() => void open(document)}>
                      {opening === document.id ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
                    </Button>
                    {canManage ? (
                      <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${document.title}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(document)}>
                        <Trash2Icon />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <UploadDialog employeeId={employeeId} open={uploading} onOpenChange={setUploading} />

      <Dialog open={deleting !== null} onOpenChange={(next) => !remove.isPending && !next && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus dokumen?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{deleting?.title}</span> beserta berkasnya akan dihapus permanen.
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
    </div>
  );
}
