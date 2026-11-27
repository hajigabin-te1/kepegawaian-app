"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AnnouncementAttachmentChange, AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
import type { Announcement } from "@/features/announcements/types/announcements";
import {
  deleteAnnouncement,
  listAnnouncements,
  saveAnnouncement,
  setAnnouncementPublished,
} from "@/features/announcements/services/announcement-service";

const key = ["announcements"] as const;

export function useAnnouncements() {
  return useQuery({ queryKey: key, queryFn: listAnnouncements });
}

export function useSaveAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      current,
      values,
      attachment,
    }: {
      current: Pick<Announcement, "id" | "attachmentPath"> | null;
      values: AnnouncementFormValues;
      attachment: AnnouncementAttachmentChange;
    }) => saveAnnouncement(current, values, attachment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useSetPublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => setAnnouncementPublished(id, isPublished),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteAnnouncement(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}
