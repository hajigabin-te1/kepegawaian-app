"use client";

import { useState } from "react";
import { Loader2Icon, MegaphoneIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { routes } from "@/config/routes";
import { AnnouncementDialog } from "@/features/announcements/components/announcement-dialog";
import { AnnouncementList } from "@/features/announcements/components/announcement-list";
import { AnnouncementsTable } from "@/features/announcements/components/announcements-table";
import { useAnnouncements, useDeleteAnnouncement, useSetPublished } from "@/features/announcements/hooks/use-announcements";
import type { Announcement } from "@/features/announcements/types/announcements";
import { ApiError } from "@/lib/api-error";

export function AnnouncementsPanel({ canManage }: { canManage: boolean }) {
  const announcements = useAnnouncements();
  const setPublished = useSetPublished();
  const remove = useDeleteAnnouncement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  const openDialog = (announcement: Announcement | null) => {
    setEditing(announcement);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const toggleVisibility = (announcement: Announcement) =>
    setPublished.mutate(
      { id: announcement.id, isPublished: !announcement.isPublished },
      {
        onSuccess: () => toast.success(announcement.isPublished ? "Pengumuman disembunyikan." : "Pengumuman ditampilkan."),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Tampilan pengumuman gagal diubah."),
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
        description={canManage ? "Kelola pengumuman resmi dan periode tayangnya untuk pegawai." : "Informasi resmi dari Bagian Kepegawaian."}
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
          <EmptyState
            icon={MegaphoneIcon}
            title="Belum ada pengumuman"
            description={canManage ? "Buat pengumuman pertama untuk pegawai." : "Pengumuman dari Bagian Kepegawaian akan tampil di sini."}
            action={
              canManage ? (
                <Button variant="outline" onClick={() => openDialog(null)}>
                  <PlusIcon />
                  Buat Pengumuman
                </Button>
              ) : null
            }
          />
        </Card>
      ) : canManage ? (
        <Card className="gap-0 py-0">
          <AnnouncementsTable
            announcements={announcements.data}
            togglingId={setPublished.isPending ? (setPublished.variables?.id ?? null) : null}
            onToggleVisibility={toggleVisibility}
            onEdit={openDialog}
            onDelete={setDeleting}
          />
        </Card>
      ) : (
        <AnnouncementList announcements={announcements.data} />
      )}

      {canManage ? <AnnouncementDialog key={dialogKey} open={dialogOpen} onOpenChange={setDialogOpen} announcement={editing} /> : null}

      <Dialog open={deleting !== null} onOpenChange={(next) => !remove.isPending && !next && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pengumuman?</DialogTitle>
            <DialogDescription>
              {deleting?.title} {deleting?.attachmentPath ? "beserta dokumennya " : ""}akan dihapus permanen.
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
    </>
  );
}
