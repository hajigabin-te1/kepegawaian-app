"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { FileField } from "@/features/documents/components/file-field";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { useSaveAnnouncement } from "@/features/announcements/hooks/use-announcements";
import { announcementSchema, type AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
import { getAnnouncementAttachmentUrl, validateAnnouncementFile } from "@/features/announcements/services/announcement-service";
import { ANNOUNCEMENT_FILE_ACCEPT, ANNOUNCEMENT_FILE_HINT, type Announcement } from "@/features/announcements/types/announcements";
import { ApiError } from "@/lib/api-error";

const VISIBILITY_ITEMS = { published: "Tampilkan sesuai periode", hidden: "Sembunyikan" };

const toValues = (announcement: Announcement | null): AnnouncementFormValues =>
  announcement
    ? {
        title: announcement.title,
        content: announcement.content,
        startsOn: announcement.startsOn,
        endsOn: announcement.endsOn ?? "",
        isPublished: announcement.isPublished,
      }
    : { title: "", content: "", startsOn: todayInCampus(), endsOn: "", isPublished: true };

type AnnouncementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
};

/** Remount with a new `key` each time it opens so the form and file state start fresh. */
export function AnnouncementDialog({ open, onOpenChange, announcement }: AnnouncementDialogProps) {
  const save = useSaveAnnouncement();
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({ resolver: zodResolver(announcementSchema), defaultValues: toValues(announcement) });

  const showExisting = Boolean(announcement?.attachmentPath) && !removeExisting && !file;

  const onSubmit = (values: AnnouncementFormValues) => {
    if (file && validateAnnouncementFile(file)) return;
    save.mutate(
      { current: announcement, values, attachment: { file, remove: removeExisting } },
      {
        onSuccess: () => {
          toast.success(announcement ? "Pengumuman diperbarui." : "Pengumuman dibuat.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengumuman gagal disimpan."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{announcement ? "Ubah Pengumuman" : "Buat Pengumuman"}</DialogTitle>
          <DialogDescription>Pegawai melihat pengumuman ini hanya selama periode tayangnya.</DialogDescription>
        </DialogHeader>
        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Judul</Label>
            <Input id="announcement-title" aria-invalid={errors.title ? true : undefined} {...register("title")} />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="announcement-start">Tanggal mulai</Label>
              <Input id="announcement-start" type="date" aria-invalid={errors.startsOn ? true : undefined} {...register("startsOn")} />
              {errors.startsOn ? <p className="text-sm text-destructive">{errors.startsOn.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-end">Tanggal berakhir</Label>
              <Input id="announcement-end" type="date" aria-invalid={errors.endsOn ? true : undefined} {...register("endsOn")} />
              {errors.endsOn ? <p className="text-sm text-destructive">{errors.endsOn.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-content">Isi</Label>
            <Textarea id="announcement-content" rows={6} aria-invalid={errors.content ? true : undefined} {...register("content")} />
            {errors.content ? <p className="text-sm text-destructive">{errors.content.message}</p> : null}
          </div>

          {showExisting && announcement?.attachmentPath ? (
            <div className="space-y-2">
              <Label>Dokumen pengumuman (opsional)</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
                <FileIcon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{announcement.attachmentName}</span>
                <FileLinkButton path={announcement.attachmentPath} label="Lihat" resolveUrl={getAnnouncementAttachmentUrl} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setRemoveExisting(true)} aria-label="Hapus atau ganti dokumen">
                  <XIcon />
                </Button>
              </div>
            </div>
          ) : (
            <FileField
              label="Dokumen pengumuman (opsional)"
              file={file}
              onChange={setFile}
              accept={ANNOUNCEMENT_FILE_ACCEPT}
              validate={validateAnnouncementFile}
              hint={removeExisting ? `Dokumen lama akan dihapus saat disimpan. ${ANNOUNCEMENT_FILE_HINT}` : ANNOUNCEMENT_FILE_HINT}
            />
          )}

          <div className="space-y-2">
            <Label>Tampilan</Label>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Select items={VISIBILITY_ITEMS} value={field.value ? "published" : "hidden"} onValueChange={(v) => field.onChange(v === "published")}>
                  <SelectTrigger className="w-full" aria-label="Tampilan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VISIBILITY_ITEMS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="announcement-form" disabled={save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
