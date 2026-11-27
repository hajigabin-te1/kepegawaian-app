"use client";

import { Card } from "@/components/ui/card";
import { FileLinkButton } from "@/features/documents/components/file-link-button";
import { formatAnnouncementDate } from "@/features/announcements/components/announcement-format";
import { getAnnouncementAttachmentUrl } from "@/features/announcements/services/announcement-service";
import type { Announcement } from "@/features/announcements/types/announcements";

/** Employee view: announcements currently within their period (filtered by RLS). */
export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="gap-3 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{announcement.title}</h2>
            <p className="text-xs text-muted-foreground">
              Dirilis {formatAnnouncementDate(announcement.startsOn)}
              {announcement.endsOn ? `, berlaku sampai ${formatAnnouncementDate(announcement.endsOn)}` : null}
            </p>
          </div>
          <p className="max-w-prose text-sm whitespace-pre-wrap">{announcement.content}</p>
          {announcement.attachmentPath ? (
            <div className="border-t pt-3">
              <FileLinkButton
                path={announcement.attachmentPath}
                label={announcement.attachmentName ?? "Lihat dokumen"}
                resolveUrl={getAnnouncementAttachmentUrl}
              />
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
