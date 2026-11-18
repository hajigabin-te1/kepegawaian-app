"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileField } from "@/features/documents/components/file-field";
import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import { useSaveWorkReport } from "@/features/performance/hooks/use-work-reports";
import { workReportSchema, type WorkReportFormValues } from "@/features/performance/schemas/work-report-schemas";
import type { WorkReport } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

type WorkReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: string;
  periodName: string;
  employeeId: string;
  /** The report being edited, or null to add a new one. */
  report: WorkReport | null;
};

export function WorkReportDialog(props: WorkReportDialogProps) {
  const save = useSaveWorkReport();
  return (
    <Dialog open={props.open} onOpenChange={(next) => !save.isPending && props.onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        {/* Mounted per opening so the form always starts from the selected report. */}
        {props.open ? <WorkReportForm key={props.report?.id ?? "new"} {...props} save={save} /> : null}
      </DialogContent>
    </Dialog>
  );
}

type WorkReportFormProps = WorkReportDialogProps & { save: ReturnType<typeof useSaveWorkReport> };

function WorkReportForm({ onOpenChange, periodId, periodName, employeeId, report, save }: WorkReportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkReportFormValues>({ resolver: zodResolver(workReportSchema), defaultValues: { description: report?.description ?? "" } });

  const onSubmit = ({ description }: WorkReportFormValues) => {
    if (!file && !report) {
      setFileError("Bukti dokumen wajib diunggah.");
      return;
    }
    // FileField already shows the reason for an invalid file.
    if (file && validateEmployeeFile(file)) return;

    save.mutate(
      { input: { id: report?.id ?? null, periodId, employeeId, description, file }, current: report },
      {
        onSuccess: () => {
          toast.success(report ? "Laporan kerja diperbarui." : "Laporan kerja ditambahkan.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Laporan kerja gagal disimpan."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{report ? "Ubah Laporan Kerja" : "Tambah Laporan Kerja"}</DialogTitle>
        <DialogDescription>{periodName}. Laporan menjadi bahan penilaian kinerja oleh Bagian Kepegawaian.</DialogDescription>
      </DialogHeader>

      <form id="work-report-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="work-report-description">
            Deskripsi pekerjaan<span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="work-report-description"
            rows={6}
            placeholder="mis. Menyusun laporan Beban Kerja Dosen (BKD) Prodi Administrasi Publik semester ganjil."
            aria-invalid={errors.description ? true : undefined}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Jelaskan apa yang dikerjakan dan hasilnya. 10–2000 karakter.</p>
          )}
        </div>

        <FileField
          label="Bukti dokumen"
          required={!report}
          file={file}
          onChange={(next) => {
            setFile(next);
            setFileError(undefined);
          }}
          existingFileNote={report ? `File saat ini: ${report.evidenceName}. Pilih file baru untuk mengganti.` : undefined}
          error={fileError}
        />
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
          Batal
        </Button>
        <Button type="submit" form="work-report-form" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
          {report ? "Simpan perubahan" : "Kirim laporan"}
        </Button>
      </DialogFooter>
    </>
  );
}
