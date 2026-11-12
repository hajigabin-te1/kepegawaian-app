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
import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import { useSaveEducationHistory } from "@/features/employee-history/hooks/use-histories";
import { educationHistorySchema, type EducationHistoryFormValues } from "@/features/employee-history/schemas/history-schemas";
import { EDUCATION_LEVELS, type EducationHistory } from "@/features/employee-history/types/history";
import { EmployeeSelect } from "@/features/employees/components/employee-select";
import { ApiError } from "@/lib/api-error";

const LEVEL_ITEMS = Object.fromEntries(EDUCATION_LEVELS.map((level) => [level, level]));

type EducationHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: EducationHistory | null;
  /** Set on the employee detail page; otherwise the employee is picked in the form. */
  fixedEmployeeId: string | null;
};

export function EducationHistoryDialog({ open, onOpenChange, entry, fixedEmployeeId }: EducationHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? <EducationHistoryForm entry={entry} fixedEmployeeId={fixedEmployeeId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EducationHistoryForm({ entry, fixedEmployeeId, onDone }: {
  entry: EducationHistory | null;
  fixedEmployeeId: string | null;
  onDone: () => void;
}) {
  const save = useSaveEducationHistory();
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EducationHistoryFormValues>({
    resolver: zodResolver(educationHistorySchema),
    defaultValues: {
      employeeId: entry?.employeeId ?? fixedEmployeeId ?? "",
      educationLevel: entry?.educationLevel ?? "",
      institution: entry?.institution ?? "",
      major: entry?.major ?? "",
      graduationYear: entry?.graduationYear === null || entry === null ? "" : String(entry.graduationYear),
    },
  });

  const onSubmit = (values: EducationHistoryFormValues) => {
    if (file && validateEmployeeFile(file)) return;
    save.mutate(
      { existing: entry, values, file },
      {
        onSuccess: () => {
          toast.success(entry ? "Riwayat pendidikan diperbarui." : "Riwayat pendidikan ditambahkan.");
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Riwayat pendidikan gagal disimpan."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry ? "Ubah Riwayat Pendidikan" : "Tambah Riwayat Pendidikan"}</DialogTitle>
        <DialogDescription>Pendidikan formal yang telah ditempuh beserta ijazahnya.</DialogDescription>
      </DialogHeader>

      <form id="education-history-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Jenjang<span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="educationLevel"
              render={({ field }) => (
                <Select items={LEVEL_ITEMS} value={field.value || null} onValueChange={(value) => value && field.onChange(value)}>
                  <SelectTrigger className="w-full" aria-label="Jenjang" aria-invalid={errors.educationLevel ? true : undefined}>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.educationLevel ? <p className="text-sm text-destructive">{errors.educationLevel.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduation-year">Tahun lulus</Label>
            <Input id="graduation-year" inputMode="numeric" placeholder="mis. 2015" className="tabular-nums" {...register("graduationYear")} />
            {errors.graduationYear ? <p className="text-sm text-destructive">{errors.graduationYear.message}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="institution">
            Institusi<span className="text-destructive">*</span>
          </Label>
          <Input id="institution" placeholder="mis. Universitas Lambung Mangkurat" aria-invalid={errors.institution ? true : undefined} {...register("institution")} />
          {errors.institution ? <p className="text-sm text-destructive">{errors.institution.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Program studi / jurusan</Label>
          <Input id="major" placeholder="mis. Ilmu Administrasi Negara" {...register("major")} />
          {errors.major ? <p className="text-sm text-destructive">{errors.major.message}</p> : null}
        </div>

        <FileField
          label="File ijazah"
          file={file}
          onChange={setFile}
          existingFileNote={entry?.certificatePath ? "File ijazah sudah ada. Pilih file baru untuk menggantinya." : undefined}
        />
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={save.isPending}>
          Batal
        </Button>
        <Button type="submit" form="education-history-form" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </>
  );
}
