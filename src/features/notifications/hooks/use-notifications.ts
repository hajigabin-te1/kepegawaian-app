"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/services/notification-service";

export const notificationKeys = {
  all: ["notifications"] as const,
  feed: (userId: string) => [...notificationKeys.all, "feed", userId] as const,
};

const POLL_INTERVAL_MS = 60_000;

/** The header bell polls so new notifications appear without a page reload. */
export function useNotificationFeed(userId: string) {
  return useQuery({
    queryKey: notificationKeys.feed(userId),
    queryFn: () => getNotificationFeed(userId),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
