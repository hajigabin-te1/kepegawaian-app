"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileField } from "@/features/documents/components/file-field";
import { useUploadDocument } from "@/features/documents/hooks/use-documents";
import { documentSchema, type DocumentFormValues } from "@/features/documents/schemas/document-schema";
import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import { DOCUMENT_TYPES } from "@/features/documents/types/documents";
import { EmployeeSelect } from "@/features/employees/components/employee-select";
import { ApiError } from "@/lib/api-error";

const TYPE_ITEMS = Object.fromEntries(DOCUMENT_TYPES.map((type) => [type, type]));

type UploadDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set on the employee detail page; otherwise the employee is picked in the form. */
  fixedEmployeeId: string | null;
};

export function UploadDocumentDialog({ open, onOpenChange, fixedEmployeeId }: UploadDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? <UploadDocumentForm fixedEmployeeId={fixedEmployeeId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentForm({ fixedEmployeeId, onDone }: { fixedEmployeeId: string | null; onDone: () => void }) {
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { employeeId: fixedEmployeeId ?? "", documentType: "SK", title: "" },
  });

  /** Returns false (and shows the message) when the file is missing or not allowed. */
  const checkFile = (): File | null => {
    const message = file ? validateEmployeeFile(file) : "Pilih file dokumen.";
    setFileError(message ?? undefined);
    return message === null ? file : null;
  };

  const onSubmit = (values: DocumentFormValues) => {
    const validFile = checkFile();
    if (!validFile) return;
    upload.mutate(
      { values, file: validFile },
      {
        onSuccess: () => {
          toast.success("Dokumen diunggah.");
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Dokumen gagal diunggah."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Unggah Dokumen</DialogTitle>
        <DialogDescription>Dokumen tersimpan privat dan hanya dapat dibuka oleh Bagian Kepegawaian dan pegawai yang bersangkutan.</DialogDescription>
      </DialogHeader>

      <form id="upload-document-form" onSubmit={handleSubmit(onSubmit, () => void checkFile())} noValidate className="space-y-4">
        {fixedEmployeeId ? null : (
          <div className="space-y-2">
            <Label>
              Pegawai<span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <EmployeeSelect value={field.value} onChange={field.onChange} invalid={Boolean(errors.employeeId)} />
              )}
            />
            {errors.employeeId ? <p className="text-sm text-destructive">{errors.employeeId.message}</p> : null}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label>
              Jenis<span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => (
                <Select items={TYPE_ITEMS} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
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
            <Label htmlFor="document-title">
              Judul<span className="text-destructive">*</span>
            </Label>
            <Input id="document-title" placeholder="mis. SK Pengangkatan Dosen Tetap" aria-invalid={errors.title ? true : undefined} {...register("title")} />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>
        </div>

        <FileField
          label="File"
          required
          file={file}
          onChange={(next) => {
            setFile(next);
            setFileError(undefined);
          }}
          error={fileError}
        />
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={upload.isPending}>
          Batal
        </Button>
        <Button type="submit" form="upload-document-form" disabled={upload.isPending}>
          {upload.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Unggah
        </Button>
      </DialogFooter>
    </>
  );
}
