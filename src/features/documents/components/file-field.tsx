"use client";

import { useId } from "react";
import { FileIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateEmployeeFile } from "@/features/documents/services/file-storage";
import { EMPLOYEE_FILE_ACCEPT } from "@/features/documents/types/files";

type FileFieldProps = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  /** Shown when editing a record that already has a file and no new one is picked. */
  existingFileNote?: string;
  error?: string;
};

const sizeFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function FileField({ label, file, onChange, required, existingFileNote, error }: FileFieldProps) {
  const id = useId();
  const invalid = file ? validateEmployeeFile(file) : null;
  const message = error ?? invalid;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
          <FileIcon className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{sizeFormatter.format(file.size / 1024 / 1024)} MB</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label="Hapus pilihan file">
            <XIcon />
          </Button>
        </div>
      ) : (
        <input
          id={id}
          type="file"
          accept={EMPLOYEE_FILE_ACCEPT}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-lg border border-input bg-background text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-input file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-muted"
        />
      )}
      {message ? (
        <p className="text-sm text-destructive">{message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{existingFileNote ?? "PDF, JPG, atau PNG. Maksimal 5 MB."}</p>
      )}
    </div>
  );
}
