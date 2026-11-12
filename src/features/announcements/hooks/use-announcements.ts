"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
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
    mutationFn: ({ id, values }: { id: string | null; values: AnnouncementFormValues }) => saveAnnouncement(id, values),
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
