"use client";

import { EyeIcon, EyeOffIcon, Loader2Icon, PaperclipIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import { formatAnnouncementDate } from "@/features/announcements/components/announcement-format";
import type { Announcement, AnnouncementStatus } from "@/features/announcements/types/announcements";

const STATUS_BADGES: Record<AnnouncementStatus, { label: string; variant: "secondary" | "accent" | "success" | "outline" }> = {
  hidden: { label: "Disembunyikan", variant: "secondary" },
  scheduled: { label: "Terjadwal", variant: "accent" },
  live: { label: "Tayang", variant: "success" },
  ended: { label: "Berakhir", variant: "outline" },
};

function statusOf(announcement: Announcement, today: string): AnnouncementStatus {
  if (!announcement.isPublished) return "hidden";
  if (announcement.startsOn > today) return "scheduled";
  if (announcement.endsOn && announcement.endsOn < today) return "ended";
  return "live";
}

type AnnouncementsTableProps = {
  announcements: Announcement[];
  /** Id of the announcement whose visibility is being changed. */
  togglingId: string | null;
  onToggleVisibility: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
};

/** HR list: title, release date, and the hide/edit/delete actions. */
export function AnnouncementsTable({ announcements, togglingId, onToggleVisibility, onEdit, onDelete }: AnnouncementsTableProps) {
  const today = todayInCampus();

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead className="pl-6">Judul</TableHead>
          <TableHead className="w-44">Tanggal rilis</TableHead>
          <TableHead className="pr-6 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {announcements.map((announcement) => {
          const status = STATUS_BADGES[statusOf(announcement, today)];
          const toggling = togglingId === announcement.id;
          return (
            <TableRow key={announcement.id} className="hover:bg-accent/15">
              <TableCell className="min-w-56 pl-6 align-top whitespace-normal">
                <div className="flex items-start gap-2">
                  <span className="font-medium break-words">{announcement.title}</span>
                  {announcement.attachmentPath ? (
                    <PaperclipIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Ada dokumen" role="img" />
                  ) : null}
                </div>
                <Badge variant={status.variant} className="mt-1.5">
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell className="align-top">
                <span className="block tabular-nums">{formatAnnouncementDate(announcement.startsOn)}</span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {announcement.endsOn ? `s.d. ${formatAnnouncementDate(announcement.endsOn)}` : "Tanpa tanggal berakhir"}
                </span>
              </TableCell>
              <TableCell className="pr-6 align-top">
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleVisibility(announcement)}
                    disabled={toggling}
                    aria-label={`${announcement.isPublished ? "Sembunyikan" : "Tampilkan"} ${announcement.title}`}
                  >
                    {toggling ? <Loader2Icon className="animate-spin" /> : announcement.isPublished ? <EyeOffIcon /> : <EyeIcon />}
                    <span className="hidden md:inline">{announcement.isPublished ? "Sembunyikan" : "Tampilkan"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(announcement)} aria-label={`Ubah ${announcement.title}`}>
                    <PencilIcon />
                    <span className="hidden md:inline">Ubah</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(announcement)}
                    aria-label={`Hapus ${announcement.title}`}
                    title="Hapus"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
