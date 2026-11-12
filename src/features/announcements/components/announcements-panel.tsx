"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon, MegaphoneIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useAnnouncements, useDeleteAnnouncement, useSaveAnnouncement, useSetPublished } from "@/features/announcements/hooks/use-announcements";
import { announcementSchema, type AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
import type { Announcement } from "@/features/announcements/types/announcements";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });
const STATUS_ITEMS = { published: "Terbit sekarang", draft: "Simpan sebagai draf" };

const toValues = (announcement: Announcement | null): AnnouncementFormValues =>
  announcement
    ? { title: announcement.title, content: announcement.content, isPublished: announcement.isPublished }
    : { title: "", content: "", isPublished: true };

function AnnouncementDialog({ open, onOpenChange, announcement }: { open: boolean; onOpenChange: (open: boolean) => void; announcement: Announcement | null }) {
  const save = useSaveAnnouncement();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({ resolver: zodResolver(announcementSchema), defaultValues: toValues(announcement) });

  useEffect(() => {
    if (open) reset(toValues(announcement));
  }, [open, announcement, reset]);

  const onSubmit = (values: AnnouncementFormValues) =>
    save.mutate(
      { id: announcement?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(announcement ? "Pengumuman diperbarui." : "Pengumuman dibuat.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengumuman gagal disimpan."),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{announcement ? "Ubah Pengumuman" : "Buat Pengumuman"}</DialogTitle>
          <DialogDescription>Pengumuman yang terbit dapat dilihat semua pegawai.</DialogDescription>
        </DialogHeader>
        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Judul</Label>
            <Input id="announcement-title" aria-invalid={errors.title ? true : undefined} {...register("title")} />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-content">Isi</Label>
            <Textarea id="announcement-content" rows={6} aria-invalid={errors.content ? true : undefined} {...register("content")} />
            {errors.content ? <p className="text-sm text-destructive">{errors.content.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Select items={STATUS_ITEMS} value={field.value ? "published" : "draft"} onValueChange={(v) => field.onChange(v === "published")}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_ITEMS).map(([value, label]) => (
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

export function AnnouncementsPanel({ canManage }: { canManage: boolean }) {
  const announcements = useAnnouncements();
  const setPublished = useSetPublished();
  const remove = useDeleteAnnouncement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const openDialog = (announcement: Announcement | null) => {
    setEditing(announcement);
    setDialogOpen(true);
  };

  const togglePublished = (announcement: Announcement) =>
    setPublished.mutate(
      { id: announcement.id, isPublished: !announcement.isPublished },
      {
        onSuccess: () => toast.success(announcement.isPublished ? "Pengumuman disembunyikan." : "Pengumuman diterbitkan."),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Status gagal diubah."),
      },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Pengumuman dihapus.");
        setDeleting(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Pengumuman gagal dihapus."),
    });
  };

  return (
    <>
      <PageHeader
        title="Pengumuman"
        description="Informasi resmi dari Bagian Kepegawaian."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengumuman" }]}
        actions={
          canManage ? (
            <Button onClick={() => openDialog(null)}>
              <PlusIcon />
              Buat Pengumuman
            </Button>
          ) : null
        }
      />

      {announcements.isPending ? (
        <Card className="gap-0 py-0">
          <TableSkeleton rows={3} />
        </Card>
      ) : announcements.isError ? (
        <Card>
          <QueryErrorState error={announcements.error} onRetry={() => void announcements.refetch()} />
        </Card>
      ) : announcements.data.length === 0 ? (
        <Card>
          <EmptyState icon={MegaphoneIcon} title="Belum ada pengumuman" description="Pengumuman dari Bagian Kepegawaian akan tampil di sini." />
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.data.map((announcement) => (
            <Card key={announcement.id} className="gap-3 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{announcement.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {announcement.publishedAt ? `Terbit ${dateFormatter.format(new Date(announcement.publishedAt))}` : `Dibuat ${dateFormatter.format(new Date(announcement.createdAt))}`}
                  </p>
                </div>
                {announcement.isPublished ? null : <Badge variant="secondary">Draf</Badge>}
              </div>
              <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              {canManage ? (
                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => togglePublished(announcement)} disabled={setPublished.isPending}>
                    {announcement.isPublished ? <EyeOffIcon /> : <EyeIcon />}
                    {announcement.isPublished ? "Sembunyikan" : "Terbitkan"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDialog(announcement)}>
                    <PencilIcon />
                    Ubah
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${announcement.title}`} className="text-destructive hover:text-destructive" onClick={() => setDeleting(announcement)}>
                    <Trash2Icon />
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <AnnouncementDialog open={dialogOpen} onOpenChange={setDialogOpen} announcement={editing} />

      <Dialog open={deleting !== null} onOpenChange={(next) => !remove.isPending && !next && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pengumuman?</DialogTitle>
            <DialogDescription>{deleting?.title} akan dihapus permanen.</DialogDescription>
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
    </>
  );
}
